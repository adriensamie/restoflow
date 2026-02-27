'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { creerFournisseurSchema, modifierFournisseurSchema, creerCommandeSchema } from '@/lib/validations/commandes'

// ─── Fournisseurs ────────────────────────────────────────────────────────────

export async function creerFournisseur(data: {
  nom: string
  contact_nom?: string
  contact_email?: string
  contact_telephone?: string
  adresse?: string
  delai_livraison?: number
  conditions_paiement?: string
}) {
  creerFournisseurSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('fournisseurs').insert({ ...data, organization_id }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/fournisseurs')
  return result
}

export async function modifierFournisseur(id: string, data: {
  nom?: string
  contact_nom?: string
  contact_email?: string
  contact_telephone?: string
  adresse?: string
  delai_livraison?: number
  conditions_paiement?: string
}) {
  modifierFournisseurSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('fournisseurs').update(data).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/fournisseurs')
}

export async function lierProduitFournisseur(data: {
  produit_id: string
  fournisseur_id: string
  reference?: string
  prix_negocie?: number
  unite_commande?: string
  qte_min?: number
  fournisseur_principal?: boolean
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('produit_fournisseur').upsert({ ...data, organization_id }, { onConflict: 'produit_id,fournisseur_id' })
  if (error) throw new Error(error.message)
  revalidatePath('/fournisseurs')
  revalidatePath('/stocks')
}

// ─── Commandes ───────────────────────────────────────────────────────────────

export async function creerCommande(data: {
  fournisseur_id: string
  date_livraison_prevue?: string
  note?: string
  lignes: { produit_id: string; quantite_commandee: number; prix_unitaire?: number }[]
}) {
  creerCommandeSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Numéro auto : CMD-YYYYMMDD-XXXXXX
  const numero = `CMD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900000 + 100000)}`

  const totalHt = data.lignes.reduce((acc, l) => acc + l.quantite_commandee * (l.prix_unitaire ?? 0), 0)

  const { data: commande, error } = await (supabase as any)
    .from('commandes')
    .insert({
      fournisseur_id: data.fournisseur_id,
      organization_id,
      numero,
      date_livraison_prevue: data.date_livraison_prevue,
      note: data.note,
      total_ht: totalHt,
      statut: 'brouillon',
    })
    .select().single()

  if (error) throw new Error(error.message)

  const lignes = data.lignes.map(l => ({
    commande_id: commande.id,
    produit_id: l.produit_id,
    quantite_commandee: l.quantite_commandee,
    prix_unitaire: l.prix_unitaire,
  }))

  const { error: lignesError } = await (supabase as any)
    .from('commande_lignes').insert(lignes)
  if (lignesError) throw new Error(lignesError.message)

  revalidatePath('/commandes')
  return commande
}

export async function envoyerCommande(id: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('commandes').update({ statut: 'envoyee' }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/commandes')
}

// ─── Réception livraison ─────────────────────────────────────────────────────

export async function receptionnerLivraison(
  commandeId: string,
  lignes: { ligne_id: string; produit_id: string; quantite_commandee: number; quantite_recue: number; prix_unitaire?: number; note_ecart?: string }[]
) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // 0. Vérifier que la commande appartient bien à cette organisation
  const { data: commande, error: cmdCheckError } = await (supabase as any)
    .from('commandes').select('id').eq('id', commandeId).eq('organization_id', organization_id).single()
  if (cmdCheckError || !commande) throw new Error('Commande introuvable')

  // 1. Mettre à jour chaque ligne (scoped via commande_id)
  for (const ligne of lignes) {
    const { error: ligneError } = await (supabase as any)
      .from('commande_lignes')
      .update({ quantite_recue: ligne.quantite_recue, note_ecart: ligne.note_ecart })
      .eq('id', ligne.ligne_id)
      .eq('commande_id', commandeId)
    if (ligneError) throw new Error(ligneError.message)

    // 2. Créer un mouvement stock "entree" pour chaque produit reçu
    if (ligne.quantite_recue > 0) {
      const { error: mvtError } = await (supabase as any).from('mouvements_stock').insert({
        produit_id: ligne.produit_id,
        organization_id,
        type: 'entree',
        quantite: ligne.quantite_recue,
        prix_unitaire: ligne.prix_unitaire,
        motif: `Livraison commande`,
        note: ligne.note_ecart || null,
      })
      if (mvtError) throw new Error(mvtError.message)
    }
  }

  // 3. Vérifier si tout reçu ou partiel
  const toutRecu = lignes.every(l => l.quantite_recue >= l.quantite_commandee)
  const statut = toutRecu ? 'recue' : 'recue_partielle'

  const { error: cmdError } = await (supabase as any)
    .from('commandes')
    .update({ statut, date_livraison_reelle: new Date().toISOString().slice(0, 10) })
    .eq('id', commandeId)
    .eq('organization_id', organization_id)
  if (cmdError) throw new Error(cmdError.message)

  revalidatePath('/commandes')
  revalidatePath('/stocks')

  // Retourner les écarts pour génération PDF côté client
  const ecarts = lignes.filter(l => {
    const pct = l.quantite_commandee > 0
      ? Math.abs(l.quantite_recue - l.quantite_commandee) / l.quantite_commandee * 100
      : 0
    return pct > 5
  })

  return { statut, ecarts }
  export async function supprimerFournisseur(id: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('fournisseurs')
    .delete()
    .eq('id', id)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/fournisseurs')
}
