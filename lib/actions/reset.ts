'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'

export async function reinitialiserApplication() {
  const staff = await requireRole(['patron'])
  const supabase = await createServerSupabaseClient()
  const id = staff.orgId

  // Supprimer dans l'ordre (FK oblige)
  const tables = [
    'haccp_releves',
    'haccp_templates',
    'fiches_paie',
    'creneaux_planning',
    'employes',
    'contrats',
    'snapshots_food_cost',
    'previsions',
    'events_caisse',
    'config_caisse',
    'recette_ingredients',
    'recettes',
    'mouvements_stock',
    'commande_lignes',
    'commandes',
    'fournisseurs',
    'vins',
    'produits',
  ]

  for (const table of tables) {
    await (supabase as any)
      .from(table)
      .delete()
      .eq('organization_id', id)
  }

  revalidatePath('/')
}
