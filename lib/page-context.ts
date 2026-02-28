import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Shared helper for server pages: creates supabase client + resolves orgUUID.
 * Redirects to /onboarding if org not found in Supabase.
 */
export async function getPageContext() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  if (!orgId) redirect('/onboarding')

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .single()

  if (!org?.id) redirect('/onboarding')

  return { supabase, orgId: org.id as string }
}
