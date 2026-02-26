'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function creerFichePaie(data: {
  employe_id: string
  mois: string
  heures_normales: number
  heures_sup?: number
  heures_absences?: number
  salaire_brut: number
  primes?: number
  avantages?: number
  importe_ia?: boolean
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Calculer net estimé (charges salariales ~22%)
  const cotisations = Math.round(data.salaire_brut * 0.22 * 100) / 100
  const salaire_net = Math.round((data.salaire_brut - cotisations) * 100) / 100

  const { data: result, error } = await (supabase as any)
    .from('fiches_paie')
    .upsert({
      ...data,
      organization_id,
      cotisations,
      salaire_net,
    }, { onConflict: 'organization_id,employe_id,mois' })
    .select().single()

  if (error) throw new Error(error.message)
  revalidatePath('/fiches-paie')
  return result
}

export async function validerFichePaie(id: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any).from('fiches_paie')
    .update({ statut: 'valide', validated_at: new Date().toISOString() })
    .eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/fiches-paie')
}

export async function marquerPaye(id: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any).from('fiches_paie')
    .update({ statut: 'paye' }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/fiches-paie')
}

export async function genererFichesDepuisPlanning(mois: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const debut = new Date(mois)
  const fin = new Date(debut.getFullYear(), debut.getMonth() + 1, 0)

  // Récupérer tous les créneaux du mois avec calcul des heures
  const { data: creneaux, error: crError } = await (supabase as any)
    .from('creneaux_planning')
    .select('employe_id, heure_debut, heure_fin, cout_prevu')
    .eq('organization_id', organization_id)
    .gte('date', debut.toISOString().slice(0, 10))
    .lte('date', fin.toISOString().slice(0, 10))
  if (crError) throw new Error(crError.message)

  if (!creneaux?.length) throw new Error('Aucun créneau ce mois')

  // Regrouper par employé en calculant les heures depuis heure_debut/heure_fin
  const parEmploye: Record<string, { heures: number; cout: number }> = {}
  creneaux.forEach((c: any) => {
    if (!parEmploye[c.employe_id]) parEmploye[c.employe_id] = { heures: 0, cout: 0 }
    const [hd, md] = (c.heure_debut || '0:0').split(':').map(Number)
    const [hf, mf] = (c.heure_fin || '0:0').split(':').map(Number)
    const h = (hf * 60 + mf - hd * 60 - md) / 60
    parEmploye[c.employe_id].heures += h > 0 ? h : 0
    parEmploye[c.employe_id].cout += c.cout_prevu || 0
  })

  // Récupérer les employés
  const { data: employes, error: empError } = await (supabase as any)
    .from('employes')
    .select('id, taux_horaire, heures_contrat')
    .eq('organization_id', organization_id)
    .in('id', Object.keys(parEmploye))
  if (empError) throw new Error(empError.message)

  const fiches = []
  for (const emp of (employes || [])) {
    const stats = parEmploye[emp.id]
    const heuresContrat = emp.heures_contrat || 35
    const heuresMois = heuresContrat * 4.33
    const heuresSup = Math.max(0, stats.heures - heuresMois)
    const tauxH = emp.taux_horaire || 12
    const brut = Math.round(stats.heures * tauxH * 100) / 100

    const { error } = await (supabase as any).from('fiches_paie').upsert({
      organization_id,
      employe_id: emp.id,
      mois,
      heures_normales: Math.min(stats.heures, heuresMois),
      heures_sup: heuresSup,
      salaire_brut: brut,
      cotisations: Math.round(brut * 0.22 * 100) / 100,
      salaire_net: Math.round(brut * 0.78 * 100) / 100,
    }, { onConflict: 'organization_id,employe_id,mois' })

    if (!error) fiches.push(emp.id)
  }

  revalidatePath('/fiches-paie')
  return fiches.length
}
