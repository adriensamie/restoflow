'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getOrgUUID(): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()
  if (!orgId) throw new Error('Non authentifié')
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .returns<{ id: string }[]>()
    .single()
  if (error || !data) throw new Error('Organisation introuvable')
  return data.id
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
  if (!userId || !orgId) throw new Error('Non authentifié')

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .returns<{ id: string }[]>()
    .single()
  if (!org) throw new Error('Organisation introuvable')

  const { data: staff } = await (supabase as any)
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
