'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function reinitialiserApplication() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .single()

  if (!org) throw new Error('Organisation non trouvée')
  const id = org.id

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
    'cave_vins',
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
