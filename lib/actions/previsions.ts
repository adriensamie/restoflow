'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function sauvegarderPrevision(data: {
  date_prevision: string
  couverts_midi?: number
  couverts_soir?: number
  ca_prevu?: number
  meteo_condition?: string
  meteo_temperature?: number
  est_ferie?: boolean
  est_vacances?: boolean
  evenement_local?: string
  confiance?: string
  produits_prioritaires?: any[]
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('previsions')
    .upsert({ ...data, organization_id }, { onConflict: 'organization_id,date_prevision' })
  if (error) throw new Error(error.message)
  revalidatePath('/previsions')
}

export async function sauvegarderReel(data: {
  date_prevision: string
  couverts_reel_midi?: number
  couverts_reel_soir?: number
  ca_reel?: number
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('previsions')
    .update(data)
    .eq('date_prevision', data.date_prevision)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/previsions')
}
