import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { StocksTable } from '@/components/stocks/stocks-table'
import { StocksHeader } from '@/components/stocks/stocks-header'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function StocksPage() {
  await requireRouteAccess('/stocks')
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const { data: stocks } = await (supabase as any)
    .from('stock_actuel')
    .select('*')
    .eq('organization_id', orgUUID)
    .order('categorie')
    .order('nom')

  const { data: alertes } = await (supabase as any)
    .from('stock_actuel')
    .select('*')
    .eq('organization_id', orgUUID)
    .eq('en_alerte', true)

  return (
    <div className="space-y-6">
      <StocksHeader alertesCount={alertes?.length ?? 0} />
      <StocksTable stocks={stocks ?? []} />
    </div>
  )
}