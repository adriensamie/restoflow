import { HaccpClient } from '@/components/haccp/haccp-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function HygienePage() {
  await requireRouteAccess('/hygiene')
  const { supabase, orgId } = await getPageContext()

  const aujourd = new Date()
  const debut7j = new Date(aujourd)
  debut7j.setDate(aujourd.getDate() - 7)

  const [{ data: templates }, { data: releves }] = await Promise.all([
    (supabase as any)
      .from('haccp_templates')
      .select('*')
      .eq('organization_id', orgId)
      .eq('actif', true)
      .order('nom'),
    (supabase as any)
      .from('haccp_releves')
      .select('*')
      .eq('organization_id', orgId)
      .gte('created_at', debut7j.toISOString())
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  return (
    <HaccpClient
      templates={templates ?? []}
      releves={releves ?? []}
    />
  )
}
