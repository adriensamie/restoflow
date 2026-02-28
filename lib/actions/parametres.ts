'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { sauvegarderParametresSchema } from '@/lib/validations/parametres'

export async function sauvegarderParametres(data: {
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  siret?: string
  tva_intracom?: string
  taux_tva_defaut?: number
  objectif_food_cost?: number
  timezone?: string
  devise?: string
  nb_couverts_moyen?: number
}) {
  const validated = sauvegarderParametresSchema.parse(data)
  const staff = await requireRole(['patron'])
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any)
    .from('organizations')
    .update({
      nom: validated.nom,
      adresse: validated.adresse,
      telephone: validated.telephone,
      email_contact: validated.email,
      siret: validated.siret,
      timezone: validated.timezone || 'Europe/Paris',
      devise: validated.devise || 'EUR',
      updated_at: new Date().toISOString(),
    })
    .eq('id', staff.orgId)

  if (error) throw error
  revalidatePath('/parametres')
}
