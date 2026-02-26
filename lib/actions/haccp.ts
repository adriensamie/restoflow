'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function initTemplatesDefaut() {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any).rpc('init_haccp_templates', { org_id: organization_id })
  if (error) throw new Error(error.message)
  revalidatePath('/hygiene')
}

export async function creerReleve(data: {
  template_id?: string
  nom_controle: string
  type: string
  valeur?: number
  unite?: string
  resultat: string
  action_corrective?: string
  zone?: string
  equipement?: string
  employe_nom?: string
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('haccp_releves')
    .insert({ ...data, organization_id })
    .select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/hygiene')
  return result
}

export async function creerTemplate(data: {
  nom: string
  type: string
  description?: string
  frequence: string
  valeur_min?: number
  valeur_max?: number
  unite?: string
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('haccp_templates')
    .insert({ ...data, organization_id })
    .select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/hygiene')
  return result
}

export async function supprimerTemplate(id: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('haccp_templates').update({ actif: false }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/hygiene')
}
