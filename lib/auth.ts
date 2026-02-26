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
