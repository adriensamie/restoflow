'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { z } from 'zod'

const allergenesSchema = z.array(z.string().min(1).max(100)).max(30)

export async function calculerAllergenesRecette(recetteId: string): Promise<string[]> {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Get all ingredients of the recipe
  const { data: ingredients } = await (supabase as any)
    .from('recette_ingredients')
    .select('produit_id, produits:produit_id(allergenes)')
    .eq('recette_id', recetteId)
    .eq('organization_id', organization_id)

  if (!ingredients) return []

  // Merge allergenes from all products
  const allergenesSet = new Set<string>()
  for (const ing of ingredients) {
    const allergenes = ing.produits?.allergenes
    if (Array.isArray(allergenes)) {
      allergenes.forEach((a: string) => allergenesSet.add(a))
    }
  }

  const allergenes = Array.from(allergenesSet).sort()

  // Update recipe allergenes
  await (supabase as any)
    .from('recettes')
    .update({ allergenes })
    .eq('id', recetteId)
    .eq('organization_id', organization_id)

  return allergenes
}

export async function updateProduitAllergenes(produitId: string, allergenes: string[]) {
  const validatedAllergenes = allergenesSchema.parse(allergenes)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await (supabase as any)
    .from('produits')
    .update({ allergenes: validatedAllergenes })
    .eq('id', produitId)
    .eq('organization_id', organization_id)

  if (error) throw new Error(error.message)

  // Recalculate allergenes for all recipes using this product
  const { data: recipeIngredients } = await (supabase as any)
    .from('recette_ingredients')
    .select('recette_id')
    .eq('produit_id', produitId)
    .eq('organization_id', organization_id)

  if (recipeIngredients) {
    const recetteIds: string[] = [...new Set<string>(recipeIngredients.map((r: any) => r.recette_id))]
    for (const recetteId of recetteIds) {
      await calculerAllergenesRecette(recetteId)
    }
  }
}
