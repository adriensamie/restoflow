import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { PlanningClient } from '@/components/planning/planning-client'

export default async function PlanningPage() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  // Semaine courante
  const aujourd = new Date()
  const lundi = new Date(aujourd)
  lundi.setDate(aujourd.getDate() - ((aujourd.getDay() + 6) % 7))
  const dimanche = new Date(lundi)
  dimanche.setDate(lundi.getDate() + 6)

  const dateDebut = lundi.toISOString().slice(0, 10)
  const dateFin = dimanche.toISOString().slice(0, 10)

  const [{ data: employes }, { data: creneaux }] = await Promise.all([
    (supabase as any)
      .from('employes')
      .select('*')
      .eq('actif', true)
      .eq('organization_id', orgUUID)
      .order('poste').order('prenom'),
    (supabase as any)
      .from('creneaux_planning')
      .select('*, employes(prenom, nom, couleur, poste)')
      .eq('organization_id', orgUUID)
      .gte('date', dateDebut)
      .lte('date', dateFin)
      .order('date').order('heure_debut'),
  ])

  return (
    <PlanningClient
      employes={employes ?? []}
      creneaux={creneaux ?? []}
      dateDebut={dateDebut}
      dateFin={dateFin}
    />
  )
}
