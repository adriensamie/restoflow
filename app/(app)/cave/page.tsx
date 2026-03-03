import { CaveClient } from '@/components/cave/cave-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { requireAccess } from '@/lib/billing'
import { getPageContext } from '@/lib/page-context'

export default async function CavePage() {
  await requireRouteAccess('/cave')
  await requireAccess('cave')
  const { supabase, orgId } = await getPageContext()

  const { data: vins } = await supabase
    .from('vins')
    .select('id, nom, appellation, categorie, zone, prix_achat_ht, prix_vente_ttc, prix_verre_ttc, contenance_verre, vendu_au_verre, stock_bouteilles, seuil_alerte, fournisseurs(nom)')
    .eq('actif', true)
    .eq('organization_id', orgId)
    .order('categorie')
    .order('nom')

  const vinsList = vins ?? []

  const stats = {
    totalRefs: vinsList.length,
    totalBouteilles: vinsList.reduce((sum: number, v) => sum + (v.stock_bouteilles || 0), 0),
    valeurTotale: vinsList.reduce((sum: number, v) => sum + ((v.prix_achat_ht || 0) * (v.stock_bouteilles || 0)), 0),
    alertes: vinsList.filter(v => v.stock_bouteilles <= v.seuil_alerte).length,
  }

  return <CaveClient vins={vinsList} stats={stats} />
}
