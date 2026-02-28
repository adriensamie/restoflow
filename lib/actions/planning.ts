'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { creerEmployeSchema, modifierEmployeSchema, creerCreneauSchema } from '@/lib/validations/planning'
import { requireRole } from '@/lib/rbac'

export async function creerEmploye(data: {
  prenom: string
  nom: string
  poste: string
  email?: string
  telephone?: string
  couleur?: string
  taux_horaire?: number
  heures_contrat?: number
}) {
  creerEmployeSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('employes').insert({ ...data, organization_id }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/planning')
  revalidatePath('/equipe')
  return result
}

export async function modifierEmploye(id: string, data: {
  prenom?: string
  nom?: string
  poste?: string
  email?: string
  telephone?: string
  couleur?: string
  taux_horaire?: number
  heures_contrat?: number
}) {
  modifierEmployeSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('employes').update(data).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/planning')
  revalidatePath('/equipe')
}

export async function archiverEmploye(id: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('employes').update({ actif: false }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/planning')
  revalidatePath('/equipe')
}

export async function creerCreneau(data: {
  employe_id: string
  date: string
  heure_debut: string
  heure_fin: string
  poste?: string
  service?: string
  note?: string
}) {
  creerCreneauSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Calculer le coût prévu
  const { data: emp, error: empError } = await (supabase as any)
    .from('employes').select('taux_horaire').eq('id', data.employe_id).eq('organization_id', organization_id).single()
  if (empError) throw new Error(empError.message)

  const [hd, md] = data.heure_debut.split(':').map(Number)
  const [hf, mf] = data.heure_fin.split(':').map(Number)
  let minutes = hf * 60 + mf - (hd * 60 + md)
  if (minutes < 0) minutes += 24 * 60
  const heures = minutes / 60
  const cout = emp?.taux_horaire ? Math.round(heures * emp.taux_horaire * 100) / 100 : null

  const { data: result, error } = await (supabase as any)
    .from('creneaux_planning')
    .insert({ ...data, organization_id, cout_prevu: cout })
    .select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/planning')
  return result
}

export async function modifierStatutCreneau(id: string, statut: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('creneaux_planning').update({ statut }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/planning')
}

export async function supprimerCreneau(id: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('creneaux_planning').delete().eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/planning')
}

export async function dupliquerSemaine(dateDebut: string, dateFin: string, offsetJours: number) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data: creneaux, error: selError } = await (supabase as any)
    .from('creneaux_planning')
    .select('employe_id, date, heure_debut, heure_fin, poste, service, note, cout_prevu')
    .eq('organization_id', organization_id)
    .gte('date', dateDebut)
    .lte('date', dateFin)
  if (selError) throw new Error(selError.message)

  if (!creneaux?.length) throw new Error('Aucun créneau à dupliquer')

  const nouveaux = creneaux.map((c: any) => {
    const d = new Date(c.date)
    d.setDate(d.getDate() + offsetJours)
    return { ...c, organization_id, date: d.toISOString().slice(0, 10), statut: 'planifie' }
  })

  const { error: insError } = await (supabase as any).from('creneaux_planning').insert(nouveaux)
  if (insError) throw new Error(insError.message)
  revalidatePath('/planning')
  return nouveaux.length
}
