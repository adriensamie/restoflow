'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'

export async function reinitialiserApplication() {
  const staff = await requireRole(['patron'])
  const supabase = await createServerSupabaseClient()
  const id = staff.orgId

  // Supprimer dans l'ordre (FK oblige — enfants avant parents)
  const tables = [
    // Nouvelles tables enfants
    'lignes_retour',
    'retours_fournisseur',
    'lots_produit',
    'prix_produit_historique',
    'notifications',
    'notification_preferences',
    'push_subscriptions',
    'role_permissions',
    'pin_sessions',
    'lignes_inventaire',
    'sessions_inventaire',
    'mouvements_cave',
    'objectifs_kpi',
    // Tables originales
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
    'produit_fournisseur',
    'fournisseurs',
    'vins',
    'produits',
  ]

  for (const table of tables) {
    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .eq('organization_id', id)
    if (error) console.error(`Reset: erreur suppression ${table}:`, error.message)
  }

  revalidatePath('/')
}
