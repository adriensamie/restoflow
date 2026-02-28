'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { requireAccess } from '@/lib/billing'
import { sauvegarderPrevisionSchema, sauvegarderReelSchema } from '@/lib/validations/previsions-actions'

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
  const validated = sauvegarderPrevisionSchema.parse(data)
  await requireAccess('previsions_ia')
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await supabase
    .from('previsions')
    .upsert({ ...validated, organization_id }, { onConflict: 'organization_id,date_prevision' })
  if (error) throw new Error(error.message)
  revalidatePath('/previsions')
}

export async function sauvegarderReel(data: {
  date_prevision: string
  couverts_reel_midi?: number
  couverts_reel_soir?: number
  ca_reel?: number
}) {
  const validated = sauvegarderReelSchema.parse(data)
  await requireAccess('previsions_ia')
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await supabase
    .from('previsions')
    .update(validated)
    .eq('date_prevision', validated.date_prevision)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/previsions')
}
