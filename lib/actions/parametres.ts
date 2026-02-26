'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

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
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', orgId)
    .single()

  if (!org) throw new Error('Organisation non trouvée')

  const { error } = await (supabase as any)
    .from('organizations')
    .update({
      nom: data.nom,
      adresse: data.adresse,
      telephone: data.telephone,
      email: data.email,
      siret: data.siret,
      tva_intracom: data.tva_intracom,
      taux_tva_defaut: data.taux_tva_defaut,
      objectif_food_cost: data.objectif_food_cost,
      timezone: data.timezone || 'Europe/Paris',
      devise: data.devise || 'EUR',
      nb_couverts_moyen: data.nb_couverts_moyen,
      updated_at: new Date().toISOString(),
    })
    .eq('id', org.id)

  if (error) throw error
  revalidatePath('/parametres')
}
