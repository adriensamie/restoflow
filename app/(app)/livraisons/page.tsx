import { LivraisonsClient } from '@/components/commandes/livraisons-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function LivraisonsPage() {
  await requireRouteAccess('/livraisons')
  const { supabase, orgId } = await getPageContext()

  const { data: commandes } = await supabase
    .from('commandes')
    .select('*, fournisseurs(nom, contact_telephone, contact_email), commande_lignes(id, produit_id, quantite_commandee, quantite_recue, prix_unitaire, note_ecart, produits(nom, unite, categorie))')
    .eq('organization_id', orgId)
    .in('statut', ['envoyee', 'confirmee', 'recue_partielle'])
    .order('date_livraison_prevue', { ascending: true })

  return <LivraisonsClient commandes={commandes ?? []} />
}
