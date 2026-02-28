import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { ParametresClient } from '@/components/parametres/parametres-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function ParametresPage() {
  await requireRouteAccess('/parametres')
  const supabase = await createServerSupabaseClient()
  const { orgId, userId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('*')
    .eq('clerk_org_id', orgId)
    .single()

  return <ParametresClient organisation={org} />
}
