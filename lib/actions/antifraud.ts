'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { requireAccess } from '@/lib/billing'
import { requireRole } from '@/lib/rbac'
import { configCaisseSchema, eventManuelSchema } from '@/lib/validations/antifraud'

export async function sauvegarderConfigCaisse(data: {
  source: string
  api_key?: string
  webhook_secret?: string
  api_endpoint?: string
  seuil_alerte_annulation?: number
  alertes_actives?: boolean
}) {
  const validated = configCaisseSchema.parse(data)
  await requireAccess('antifraud')
  await requireRole(['patron'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await supabase
    .from('config_caisse')
    .upsert({ ...validated, organization_id }, { onConflict: 'organization_id' })
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
  const validated = eventManuelSchema.parse(data)
  await requireAccess('antifraud')
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await supabase
    .from('events_caisse')
    .insert({ ...validated, organization_id, source: 'manuel' })
  if (error) throw new Error(error.message)
  revalidatePath('/antifraud')
}
