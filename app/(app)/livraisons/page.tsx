import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { LivraisonsClient } from '@/components/commandes/livraisons-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function LivraisonsPage() {
  await requireRouteAccess('/livraisons')
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const { data: commandes } = await (supabase as any)
    .from('commandes')
    .select('*, fournisseurs(nom, contact_telephone, contact_email), commande_lignes(id, produit_id, quantite_commandee, quantite_recue, prix_unitaire, note_ecart, produits(nom, unite, categorie))')
    .eq('organization_id', orgUUID)
    .in('statut', ['envoyee', 'confirmee', 'recue_partielle'])
    .order('date_livraison_prevue', { ascending: true })

  return <LivraisonsClient commandes={commandes ?? []} />
}
