import { FichesPaieClient } from '@/components/equipe/fiches-paie-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function FichesPaiePage() {
  await requireRouteAccess('/fiches-paie')
  const { supabase, orgId } = await getPageContext()

  const moisCourant = new Date().toISOString().slice(0, 7) + '-01'

  const [{ data: fiches }, { data: employes }] = await Promise.all([
    supabase
      .from('fiches_paie')
      .select('*, employes(prenom, nom, poste, couleur)')
      .eq('organization_id', orgId)
      .order('mois', { ascending: false }),
    supabase
      .from('employes')
      .select('id, prenom, nom, poste, taux_horaire, heures_contrat, couleur')
      .eq('actif', true)
      .eq('organization_id', orgId)
      .order('prenom'),
  ])

  return <FichesPaieClient fiches={fiches ?? []} employes={employes ?? []} moisCourant={moisCourant} />
}
