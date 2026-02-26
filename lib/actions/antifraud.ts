'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function sauvegarderConfigCaisse(data: {
  source: string
  api_key?: string
  webhook_secret?: string
  api_endpoint?: string
  seuil_alerte_annulation?: number
  alertes_actives?: boolean
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('config_caisse')
    .upsert({ ...data, organization_id }, { onConflict: 'organization_id' })
  if (error) throw new Error(error.message)
  revalidatePath('/antifraud')
}

export async function ajouterEventManuel(data: {
  event_type: string
  montant: number
  mode_paiement?: string
  employe_nom?: string
  nb_couverts?: number
  motif?: string
  service?: string
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('events_caisse')
    .insert({ ...data, organization_id, source: 'manuel' })
  if (error) throw new Error(error.message)
  revalidatePath('/antifraud')
}
