import { InventaireClient } from '@/components/inventaire/inventaire-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function InventairePage() {
  await requireRouteAccess('/inventaire')
  const { supabase, orgId } = await getPageContext()

  const [{ data: produits }, { data: vins }, { data: sessions }] = await Promise.all([
    supabase.from('produits').select('id, nom, categorie, unite, prix_unitaire').eq('actif', true).eq('organization_id', orgId).order('categorie').order('nom'),
    supabase.from('vins').select('id, nom, appellation, categorie, stock_bouteilles').eq('actif', true).eq('organization_id', orgId).order('categorie').order('nom'),
    supabase.from('sessions_inventaire').select('*, lignes_inventaire(count)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <InventaireClient
      produits={produits ?? []}
      vins={vins ?? []}
      sessions={sessions ?? []}
    />
  )
}
