'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getOrgUUID(): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()
  if (!orgId) throw new Error('Non authentifie')

  // 1. Resolve parent org from Clerk org ID
  const { data: parentOrg, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .is('parent_organization_id', null)
    .returns<{ id: string }[]>()
    .single()

  if (error || !parentOrg) {
    // Fallback: try without parent filter (org might not have children)
    const { data: anyOrg, error: anyErr } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', orgId)
      .returns<{ id: string }[]>()
      .limit(1)
      .single()
    if (anyErr || !anyOrg) throw new Error('Organisation introuvable')
    return anyOrg.id
  }

  // 2. Check for selected site cookie
  const cookieStore = await cookies()
  const selectedSiteId = cookieStore.get('selected_site_id')?.value

  if (selectedSiteId) {
    // 3. Verify the selected site is a valid child of this parent
    const { data: childOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', selectedSiteId)
      .eq('parent_organization_id', parentOrg.id)
      .returns<{ id: string }[]>()
      .single()

    if (childOrg) return childOrg.id
    // Invalid cookie — fall through to parent
  }

  return parentOrg.id
}

export async function getCurrentStaff(): Promise<{
  orgId: string
  staffId: string
  role: 'patron' | 'manager' | 'employe' | 'livreur'
  nom: string
  prenom: string
}> {
  const supabase = await createServerSupabaseClient()
  const { userId, orgId, orgRole } = await auth()
  if (!userId || !orgId) throw new Error('Non authentifie')

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .returns<{ id: string }[]>()
    .single()
  if (!org) throw new Error('Organisation introuvable')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role, nom, prenom')
    .eq('organization_id', org.id)
    .eq('clerk_user_id', userId)
    .eq('actif', true)
    .single()

  if (!staff) {
    // Only grant patron if Clerk confirms org:admin role
    if (orgRole === 'org:admin') {
      return { orgId: org.id, staffId: '', role: 'patron', nom: '', prenom: '' }
    }
    throw new Error('Acces refuse : aucun profil staff')
  }

  return {
    orgId: org.id,
    staffId: staff.id,
    role: staff.role,
    nom: staff.nom,
    prenom: staff.prenom,
  }
}
