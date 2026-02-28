'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

const creerReleveSchema = z.object({
  template_id: z.string().uuid().optional(),
  nom_controle: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  valeur: z.number().optional(),
  unite: z.string().max(50).optional(),
  resultat: z.enum(['conforme', 'non_conforme', 'na']),
  action_corrective: z.string().max(500).optional(),
  zone: z.string().max(100).optional(),
  equipement: z.string().max(100).optional(),
  employe_nom: z.string().max(200).optional(),
})

const creerTemplateSchema = z.object({
  nom: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  frequence: z.string().min(1).max(50),
  valeur_min: z.number().optional(),
  valeur_max: z.number().optional(),
  unite: z.string().max(50).optional(),
})

export async function initTemplatesDefaut() {
  await requireRole(['patron', 'manager'])
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
  const validated = creerReleveSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('haccp_releves')
    .insert({ ...validated, organization_id })
    .select().single()
  if (error) throw new Error(error.message)

  // Notify on non-conformity
  if (data.resultat === 'non_conforme') {
    try {
      await createNotification({
        organizationId: organization_id,
        type: 'haccp_non_conforme',
        titre: `Non-conformite HACCP : ${data.nom_controle}`,
        message: data.action_corrective ? `Action : ${data.action_corrective}` : `Releve non conforme detecte`,
        canal: ['in_app', 'web_push'],
      })
    } catch {}
  }

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
  const validated = creerTemplateSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('haccp_templates')
    .insert({ ...validated, organization_id })
    .select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/hygiene')
  return result
}

export async function supprimerTemplate(id: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('haccp_templates').update({ actif: false }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/hygiene')
}
