import { PrevisionsClient } from '@/components/previsions/previsions-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function PrevisionsPage() {
  await requireRouteAccess('/previsions')
  const { supabase, orgId } = await getPageContext()

  const [{ data: previsions }, { data: snapshots }, { data: produits }] = await Promise.all([
    supabase
      .from('previsions')
      .select('*')
      .eq('organization_id', orgId)
      .order('date_prevision', { ascending: false })
      .limit(30),
    supabase
      .from('snapshots_food_cost')
      .select('mois, ca_total, nb_couverts, ticket_moyen')
      .eq('organization_id', orgId)
      .order('mois', { ascending: false })
      .limit(12),
    supabase
      .from('stock_actuel')
      .select('produit_id, nom, categorie, quantite_actuelle, seuil_alerte, unite')
      .eq('organization_id', orgId)
      .order('nom'),
  ])

  return (
    <PrevisionsClient
      previsions={previsions ?? []}
      historiqueCA={snapshots ?? []}
      produits={produits ?? []}
    />
  )
}
