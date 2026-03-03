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
  const { data, error } = await supabase
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
  const { error } = await supabase
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
  const { error } = await supabase
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
  const { error } = await supabase
    .from('mouvements_stock')
    .insert({ ...validated, organization_id })
  if (error) throw new Error(error.message)

  // Check stock critique after movement
  try {
    const { data: stock } = await supabase
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
    type: 'inventaire' as const,
    quantite: l.quantite_reelle,
    prix_unitaire: l.prix_unitaire,
    motif: 'Inventaire manuel',
    organization_id,
  }))
  const { error } = await supabase.from('mouvements_stock').insert(inserts)
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
}
// ─── Import avec fournisseur ─────────────────────────────────────────────────

export async function importerProduitsAvecFournisseur(input: {
  fournisseurNom: string | null
  produits: {
    nom: string
    categorie: string
    unite: string
    prix_unitaire?: number
  }[]
}) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  let fournisseur_id: string | null = null

  // Find or create fournisseur
  if (input.fournisseurNom?.trim()) {
    const nom = input.fournisseurNom.trim()
    const { data: existing } = await supabase
      .from('fournisseurs')
      .select('id')
      .eq('organization_id', organization_id)
      .ilike('nom', nom)
      .eq('actif', true)
      .maybeSingle()

    if (existing) {
      fournisseur_id = existing.id
    } else {
      const { data: created, error } = await supabase
        .from('fournisseurs')
        .insert({ nom, organization_id })
        .select('id')
        .single()
      if (error) throw new Error(`Erreur création fournisseur: ${error.message}`)
      fournisseur_id = created.id
    }
  }

  // Create products + link to fournisseur
  let count = 0
  for (const p of input.produits) {
    const validated = creerProduitSchema.parse({
      nom: p.nom,
      categorie: p.categorie,
      unite: p.unite,
      prix_unitaire: p.prix_unitaire,
      seuil_alerte: 0,
    })
    const { data: produit, error } = await supabase
      .from('produits')
      .insert({ ...validated, organization_id })
      .select('id')
      .single()
    if (error) {
      console.error(`Erreur création produit "${p.nom}":`, error.message)
      continue
    }

    if (fournisseur_id) {
      const { error: linkError } = await supabase
        .from('produit_fournisseur')
        .upsert({
          produit_id: produit.id,
          fournisseur_id,
          organization_id,
          fournisseur_principal: true,
          prix_negocie: p.prix_unitaire ?? null,
        }, { onConflict: 'produit_id,fournisseur_id' })
      if (linkError) console.error(`Erreur liaison produit-fournisseur:`, linkError.message)
    }

    count++
  }

  revalidatePath('/stocks')
  revalidatePath('/fournisseurs')
  return { count, fournisseur_id }
}

export async function supprimerProduit(id: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await supabase
    .from('produits')
    .update({ actif: false })
    .eq('id', id)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
}
