import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { AntifraudClient } from '@/components/antifraud/antifraud-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function AntifraudPage() {
  await requireRouteAccess('/antifraud')
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const debut = new Date()
  debut.setMonth(debut.getMonth() - 1)

  const [{ data: events }, { data: config }] = await Promise.all([
    (supabase as any)
      .from('events_caisse')
      .select('*')
      .eq('organization_id', orgUUID)
      .gte('event_at', debut.toISOString())
      .order('event_at', { ascending: false })
      .limit(500),
    (supabase as any)
      .from('config_caisse')
      .select('*')
      .eq('organization_id', orgUUID)
      .maybeSingle(),
  ])

  return <AntifraudClient events={events ?? []} config={config} />
}
