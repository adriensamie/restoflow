import { AntifraudClient } from '@/components/antifraud/antifraud-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function AntifraudPage() {
  await requireRouteAccess('/antifraud')
  const { supabase, orgId } = await getPageContext()

  const debut = new Date()
  debut.setMonth(debut.getMonth() - 1)

  const [{ data: events }, { data: config }] = await Promise.all([
    (supabase as any)
      .from('events_caisse')
      .select('*')
      .eq('organization_id', orgId)
      .gte('created_at', debut.toISOString())
      .order('created_at', { ascending: false })
      .limit(500),
    (supabase as any)
      .from('config_caisse')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle(),
  ])

  return <AntifraudClient events={events ?? []} config={config} />
}
