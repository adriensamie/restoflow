import { NouvelleCommandeClient } from '@/components/commandes/nouvelle-commande-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'
import { notFound } from 'next/navigation'

export default async function ModifierCommandePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRouteAccess('/commandes')
  const { id } = await params
  const { supabase, orgId } = await getPageContext()

  // Fetch commande (must be brouillon)
  const { data: commande } = await supabase
    .from('commandes')
    .select('id, numero, statut, fournisseur_id, date_livraison_prevue, note')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (!commande || commande.statut !== 'brouillon') notFound()

  // Fetch lignes with product info
  const { data: lignes } = await supabase
    .from('commande_lignes')
    .select('produit_id, quantite_commandee, prix_unitaire, produits(nom, unite)')
    .eq('commande_id', id)

  // Fetch fournisseurs
  const { data: fournisseurs } = await supabase
    .from('fournisseurs')
    .select('*')
    .eq('actif', true)
    .eq('organization_id', orgId)
    .order('nom')

  const commandeExistante = {
    id: commande.id,
    numero: commande.numero,
    fournisseur_id: commande.fournisseur_id,
    date_livraison_prevue: commande.date_livraison_prevue,
    note: commande.note,
    lignes: (lignes ?? []).map(l => ({
      produit_id: l.produit_id,
      produit_nom: l.produits?.nom ?? 'Produit',
      unite: l.produits?.unite ?? '',
      quantite_commandee: l.quantite_commandee,
      prix_unitaire: l.prix_unitaire,
    })),
  }

  return (
    <NouvelleCommandeClient
      fournisseurs={fournisseurs ?? []}
      commandeExistante={commandeExistante}
    />
  )
}
