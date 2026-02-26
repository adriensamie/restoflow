import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { IntegrationsClient } from '@/components/integrations/integrations-client'

export default async function IntegrationsPage() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id, nom').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const { data: configCaisse } = await (supabase as any)
    .from('config_caisse').select('*').eq('organization_id', orgUUID).maybeSingle()

  return (
    <IntegrationsClient
      orgId={orgUUID}
      configCaisse={configCaisse}
      webhookUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'https://restoflow.fr'}/api/caisse/webhook?org=${orgUUID}`}
    />
  )
}
