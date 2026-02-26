'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { creerProduitSchema, modifierProduitSchema, ajouterMouvementSchema, ligneInventaireSchema } from '@/lib/validations/stocks'

// ─── Produits ────────────────────────────────────────────────────────────────

export async function creerProduit(formData: {
  nom: string
  categorie: string
  unite: string
  prix_unitaire?: number
  seuil_alerte?: number
  description?: string
}) {
  creerProduitSchema.parse(formData)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data, error } = await (supabase as any)
    .from('produits')
    .insert({ ...formData, organization_id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
  return data
}

export async function modifierProduit(id: string, formData: {
  nom?: string
  categorie?: string
  unite?: string
  prix_unitaire?: number
  seuil_alerte?: number
  description?: string
}) {
  modifierProduitSchema.parse(formData)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('produits')
    .update(formData)
    .eq('id', id)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
}

export async function archiverProduit(id: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('produits')
    .update({ actif: false })
    .eq('id', id)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
}

// ─── Mouvements ──────────────────────────────────────────────────────────────

export async function ajouterMouvement(formData: {
  produit_id: string
  type: 'entree' | 'sortie' | 'perte' | 'inventaire'
  quantite: number
  prix_unitaire?: number
  motif?: string
  note?: string
}) {
  ajouterMouvementSchema.parse(formData)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('mouvements_stock')
    .insert({ ...formData, organization_id })
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
  revalidatePath('/pertes')
}

export async function enregistrerInventaire(
  lignes: { produit_id: string; quantite_reelle: number; prix_unitaire?: number }[]
) {
  lignes.forEach(l => ligneInventaireSchema.parse(l))
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const inserts = lignes.map(l => ({
    produit_id: l.produit_id,
    type: 'inventaire',
    quantite: l.quantite_reelle,
    prix_unitaire: l.prix_unitaire,
    motif: 'Inventaire manuel',
    organization_id,
  }))
  const { error } = await (supabase as any).from('mouvements_stock').insert(inserts)
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
}
