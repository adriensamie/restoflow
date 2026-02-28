'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { creerProduitSchema, modifierProduitSchema, ajouterMouvementSchema, ligneInventaireSchema } from '@/lib/validations/stocks'
import { createNotification } from '@/lib/notifications'
import { requireRole } from '@/lib/rbac'

// ─── Produits ────────────────────────────────────────────────────────────────

export async function creerProduit(formData: {
  nom: string
  categorie: string
  unite: string
  prix_unitaire?: number
  seuil_alerte?: number
  description?: string
}) {
  const validated = creerProduitSchema.parse(formData)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data, error } = await (supabase as any)
    .from('produits')
    .insert({ ...validated, organization_id })
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
  const validated = modifierProduitSchema.parse(formData)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('produits')
    .update(validated)
    .eq('id', id)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
}

export async function archiverProduit(id: string) {
  await requireRole(['patron', 'manager'])
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
  const validated = ajouterMouvementSchema.parse(formData)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('mouvements_stock')
    .insert({ ...validated, organization_id })
  if (error) throw new Error(error.message)

  // Check stock critique after movement
  try {
    const { data: stock } = await (supabase as any)
      .from('stock_actuel')
      .select('nom, quantite_actuelle, seuil_alerte, unite')
      .eq('produit_id', validated.produit_id)
      .eq('organization_id', organization_id)
      .single()
    if (stock && stock.quantite_actuelle <= stock.seuil_alerte) {
      await createNotification({
        organizationId: organization_id,
        type: 'stock_critique',
        titre: `Stock critique : ${stock.nom}`,
        message: `${stock.quantite_actuelle} ${stock.unite} restant(s) (seuil : ${stock.seuil_alerte})`,
        canal: ['in_app', 'web_push'],
      })
    }
  } catch {}

  revalidatePath('/stocks')
  revalidatePath('/pertes')
}

export async function enregistrerInventaire(
  lignes: { produit_id: string; quantite_reelle: number; prix_unitaire?: number }[]
) {
  const validatedLignes = lignes.map(l => ligneInventaireSchema.parse(l))
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const inserts = validatedLignes.map(l => ({
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
export async function supprimerProduit(id: string) {
  await requireRole(['patron', 'manager'])
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
