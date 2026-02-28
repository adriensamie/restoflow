import { IntegrationsClient } from '@/components/integrations/integrations-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function IntegrationsPage() {
  await requireRouteAccess('/integrations')
  const { supabase, orgId } = await getPageContext()

  const { data: configCaisse } = await (supabase as any)
    .from('config_caisse').select('*').eq('organization_id', orgId).maybeSingle()

  return (
    <IntegrationsClient
      orgId={orgId}
      configCaisse={configCaisse}
      webhookUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'https://restoflow.fr'}/api/caisse/webhook?org=${orgId}`}
    />
  )
}
