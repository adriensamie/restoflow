import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Shared helper for server pages: creates supabase client + resolves orgUUID.
 * Redirects to /onboarding if org not found in Supabase.
 * Respects selected_site_id cookie for multi-site support.
 */
export async function getPageContext() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  if (!orgId) redirect('/onboarding')

  // Find parent org
  const { data: parentOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .is('parent_organization_id', null)
    .single()

  if (!parentOrg?.id) {
    // Fallback: try without parent filter
    const { data: anyOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', orgId)
      .limit(1)
      .single()

    if (!anyOrg?.id) redirect('/onboarding')
    return { supabase, orgId: anyOrg.id as string }
  }

  // Check for selected site cookie
  const cookieStore = await cookies()
  const selectedSiteId = cookieStore.get('selected_site_id')?.value

  if (selectedSiteId) {
    const { data: childOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', selectedSiteId)
      .eq('parent_organization_id', parentOrg.id)
      .single()

    if (childOrg) return { supabase, orgId: childOrg.id as string }
  }

  return { supabase, orgId: parentOrg.id as string }
}
