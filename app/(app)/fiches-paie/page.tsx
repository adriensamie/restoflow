import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { FichesPaieClient } from '@/components/equipe/fiches-paie-client'

export default async function FichesPaiePage() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const moisCourant = new Date().toISOString().slice(0, 7) + '-01'

  const [{ data: fiches }, { data: employes }] = await Promise.all([
    (supabase as any)
      .from('fiches_paie')
      .select('*, employes(prenom, nom, poste, couleur)')
      .eq('organization_id', orgUUID)
      .order('mois', { ascending: false })
      .order('employes(nom)'),
    (supabase as any)
      .from('employes')
      .select('id, prenom, nom, poste, taux_horaire, heures_contrat, couleur')
      .eq('actif', true)
      .eq('organization_id', orgUUID)
      .order('prenom'),
  ])

  return <FichesPaieClient fiches={fiches ?? []} employes={employes ?? []} moisCourant={moisCourant} />
}
