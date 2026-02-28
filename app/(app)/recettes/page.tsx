import { RecettesClient } from '@/components/recettes/recettes-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function RecettesPage() {
  await requireRouteAccess('/recettes')
  const { supabase, orgId } = await getPageContext()

  const [{ data: recettes }, { data: produits }, { data: vins }] = await Promise.all([
    supabase
      .from('recettes')
      .select('*, recette_ingredients!recette_ingredients_recette_id_fkey(id, quantite, unite, cout_unitaire, produits(nom), vins(nom))')
      .eq('actif', true)
      .eq('organization_id', orgId)
      .order('type').order('nom'),
    supabase
      .from('produits')
      .select('id, nom, categorie, unite, prix_unitaire')
      .eq('actif', true)
      .eq('organization_id', orgId)
      .order('nom'),
    supabase
      .from('vins')
      .select('id, nom, appellation, prix_achat_ht')
      .eq('actif', true)
      .eq('organization_id', orgId)
      .order('nom'),
  ])

  return <RecettesClient recettes={recettes ?? []} produits={produits ?? []} vins={vins ?? []} />
}