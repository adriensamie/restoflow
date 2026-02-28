import { StocksTable } from '@/components/stocks/stocks-table'
import { StocksHeader } from '@/components/stocks/stocks-header'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function StocksPage() {
  await requireRouteAccess('/stocks')
  const { supabase, orgId } = await getPageContext()

  const [{ data: stocks }, { data: alertes }] = await Promise.all([
    (supabase as any)
      .from('stock_actuel')
      .select('*')
      .eq('organization_id', orgId)
      .order('categorie')
      .order('nom'),
    (supabase as any)
      .from('stock_actuel')
      .select('*')
      .eq('organization_id', orgId)
      .eq('en_alerte', true),
  ])

  return (
    <div className="space-y-6">
      <StocksHeader alertesCount={alertes?.length ?? 0} />
      <StocksTable stocks={stocks ?? []} />
    </div>
  )
}