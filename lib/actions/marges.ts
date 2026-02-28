'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/rbac'

export async function sauvegarderObjectifs(data: {
  mois: string
  food_cost_cible: number
  masse_salariale_cible: number
  marge_nette_cible: number
  ca_cible?: number
}) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('objectifs_kpi')
    .upsert({ ...data, organization_id }, { onConflict: 'organization_id,mois' })
  if (error) throw new Error(error.message)
  revalidatePath('/marges')
}

export async function sauvegarderSnapshot(data: {
  mois: string
  ca_total: number
  cout_matieres: number
  masse_salariale: number
  nb_couverts?: number
  source?: string
}) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const foodCost = data.ca_total > 0
    ? Math.round((data.cout_matieres / data.ca_total) * 1000) / 10 : null
  const margebrute = data.ca_total > 0
    ? Math.round(((data.ca_total - data.cout_matieres) / data.ca_total) * 1000) / 10 : null
  const margeNette = data.ca_total > 0
    ? Math.round(((data.ca_total - data.cout_matieres - data.masse_salariale) / data.ca_total) * 1000) / 10 : null
  const ticketMoyen = data.nb_couverts && data.nb_couverts > 0
    ? Math.round((data.ca_total / data.nb_couverts) * 100) / 100 : null

  const { error } = await (supabase as any)
    .from('snapshots_food_cost')
    .upsert({
      ...data,
      organization_id,
      food_cost_reel: foodCost,
      marge_brute: margebrute,
      marge_nette: margeNette,
      ticket_moyen: ticketMoyen,
    }, { onConflict: 'organization_id,mois' })
  if (error) throw new Error(error.message)
  revalidatePath('/marges')
}
