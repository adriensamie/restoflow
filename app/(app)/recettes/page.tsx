import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { RecettesClient } from '@/components/recettes/recettes-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function RecettesPage() {
  await requireRouteAccess('/recettes')
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .single()

  const orgUUID = org?.id

  const [{ data: recettes }, { data: produits }, { data: vins }] = await Promise.all([
    (supabase as any)
      .from('recettes')
      .select('*, recette_ingredients!recette_ingredients_recette_id_fkey(id, quantite, unite, cout_unitaire, produits(nom), vins(nom))')
      .eq('actif', true)
      .eq('organization_id', orgUUID)
      .order('type').order('nom'),
    (supabase as any)
      .from('produits')
      .select('id, nom, categorie, unite, prix_unitaire')
      .eq('actif', true)
      .eq('organization_id', orgUUID)
      .order('nom'),
    (supabase as any)
      .from('vins')
      .select('id, nom, appellation, prix_achat_ht')
      .eq('actif', true)
      .eq('organization_id', orgUUID)
      .order('nom'),
  ])

  return <RecettesClient recettes={recettes ?? []} produits={produits ?? []} vins={vins ?? []} />
}