import { MargesClient } from '@/components/marges/marges-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function MargesPage() {
  await requireRouteAccess('/marges')
  const { supabase, orgId } = await getPageContext()

  const [{ data: snapshots }, { data: objectifs }, { data: recettes }] = await Promise.all([
    supabase
      .from('snapshots_food_cost')
      .select('*')
      .eq('organization_id', orgId)
      .order('mois', { ascending: false })
      .limit(12),
    supabase
      .from('objectifs_kpi')
      .select('*')
      .eq('organization_id', orgId)
      .order('mois', { ascending: false })
      .limit(12),
    supabase
      .from('recettes')
      .select('id, nom, type, prix_vente_ttc, cout_matiere, food_cost_pct, marge_pct, coefficient')
      .eq('actif', true)
      .eq('organization_id', orgId)
      .not('food_cost_pct', 'is', null)
      .order('food_cost_pct', { ascending: false }),
  ])

  return (
    <MargesClient
      snapshots={snapshots ?? []}
      objectifs={objectifs ?? []}
      recettes={recettes ?? []}
    />
  )
}
