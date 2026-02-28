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
  timezone?: string
  devise?: string
  taux_tva?: number
  taux_charges_salariales?: number
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
      taux_tva: validated.taux_tva ?? 10,
      taux_charges_salariales: validated.taux_charges_salariales ?? 22,
      updated_at: new Date().toISOString(),
    })
    .eq('id', staff.orgId)

  if (error) throw error
  revalidatePath('/parametres')
}
