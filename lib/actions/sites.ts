'use server'

import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getChildSites(): Promise<
  { id: string; nom: string; slug: string | null }[]
> {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()
  if (!orgId) return []

  // Find the parent org for the current Clerk org
  const { data: parentOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .is('parent_organization_id', null)
    .single()

  if (!parentOrg) return []

  // Get children
  const { data: children } = await supabase
    .from('organizations')
    .select('id, nom, slug')
    .eq('parent_organization_id', parentOrg.id)
    .order('nom')

  return children ?? []
}

export async function getSelectedSiteId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('selected_site_id')?.value ?? null
}

export async function setSelectedSite(siteId: string | null) {
  const cookieStore = await cookies()

  if (!siteId) {
    cookieStore.delete('selected_site_id')
    return
  }

  // Verify the site belongs to the current org before setting cookie
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()
  if (!orgId) throw new Error('Non authentifie')

  const { data: parentOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .is('parent_organization_id', null)
    .single()

  if (!parentOrg) throw new Error('Organisation parent introuvable')

  const { data: child } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', siteId)
    .eq('parent_organization_id', parentOrg.id)
    .single()

  if (!child) throw new Error('Site introuvable')

  cookieStore.set('selected_site_id', siteId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}
