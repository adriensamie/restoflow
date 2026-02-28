import { PlanningClient } from '@/components/planning/planning-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function PlanningPage() {
  await requireRouteAccess('/planning')
  const { supabase, orgId } = await getPageContext()

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
      .eq('organization_id', orgId)
      .order('poste').order('prenom'),
    (supabase as any)
      .from('creneaux_planning')
      .select('*, employes(prenom, nom, couleur, poste)')
      .eq('organization_id', orgId)
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
