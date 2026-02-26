'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { creerRecetteSchema, ajouterIngredientSchema } from '@/lib/validations/recettes'

export async function creerRecette(data: {
  nom: string
  type: string
  description?: string
  prix_vente_ttc?: number
  pourcentage_ficelles?: number
  nb_portions?: number
  allergenes?: string[]
  importe_ia?: boolean
}) {
  creerRecetteSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('recettes').insert({ ...data, organization_id }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/recettes')
  return result
}

export async function modifierRecette(id: string, data: {
  nom?: string
  type?: string
  description?: string | null
  prix_vente_ttc?: number | null
  pourcentage_ficelles?: number | null
  nb_portions?: number | null
  allergenes?: string[] | null
  importe_ia?: boolean
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('recettes').update(data).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/recettes')
}

export async function ajouterIngredient(data: {
  recette_id: string
  produit_id?: string
  vin_id?: string
  quantite: number
  unite: string
  cout_unitaire?: number
  ordre?: number
}) {
  ajouterIngredientSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('recette_ingredients').insert({ ...data, organization_id })
  if (error) throw new Error(error.message)
  await recalculerCouts(data.recette_id)
  revalidatePath('/recettes')
}

export async function supprimerIngredient(id: string, recetteId: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('recette_ingredients').delete().eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  await recalculerCouts(recetteId)
  revalidatePath('/recettes')
}

export async function recalculerCouts(recetteId: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data: ingredients, error: ingError } = await (supabase as any)
    .from('recette_ingredients')
    .select('quantite, cout_unitaire')
    .eq('recette_id', recetteId)
    .eq('organization_id', organization_id)
  if (ingError) throw new Error(ingError.message)

  const { data: recette, error: recError } = await (supabase as any)
    .from('recettes').select('prix_vente_ttc, pourcentage_ficelles, nb_portions')
    .eq('id', recetteId).eq('organization_id', organization_id).single()
  if (recError) throw new Error(recError.message)

  if (!recette) return

  const coutIngredients = (ingredients || []).reduce((acc: number, i: any) =>
    acc + (i.quantite * (i.cout_unitaire || 0)), 0)

  const ficelles = recette.pourcentage_ficelles || 3
  const coutTotal = coutIngredients * (1 + ficelles / 100)
  const coutPortion = coutTotal / (recette.nb_portions || 1)

  let foodCost = null, marge = null, coeff = null
  if (recette.prix_vente_ttc && recette.prix_vente_ttc > 0) {
    const prixHT = recette.prix_vente_ttc / 1.1
    foodCost = Math.round((coutPortion / prixHT) * 100 * 10) / 10
    marge = Math.round((1 - coutPortion / prixHT) * 100 * 10) / 10
    coeff = Math.round((recette.prix_vente_ttc / coutPortion) * 10) / 10
  }

  const { error: updError } = await (supabase as any).from('recettes').update({
    cout_matiere: coutPortion,
    food_cost_pct: foodCost,
    marge_pct: marge,
    coefficient: coeff,
  }).eq('id', recetteId).eq('organization_id', organization_id)
  if (updError) throw new Error(updError.message)
}

export async function archiverRecette(id: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('recettes').update({ actif: false }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/recettes')
}
