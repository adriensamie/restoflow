import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { PrevisionsClient } from '@/components/previsions/previsions-client'

export default async function PrevisionsPage() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const [{ data: previsions }, { data: snapshots }, { data: produits }] = await Promise.all([
    (supabase as any)
      .from('previsions')
      .select('*')
      .eq('organization_id', orgUUID)
      .order('date_prevision', { ascending: false })
      .limit(30),
    (supabase as any)
      .from('snapshots_food_cost')
      .select('mois, ca_total, nb_couverts, ticket_moyen')
      .eq('organization_id', orgUUID)
      .order('mois', { ascending: false })
      .limit(12),
    (supabase as any)
      .from('produits')
      .select('id, nom, categorie, stock_actuel, seuil_alerte, unite')
      .eq('actif', true)
      .eq('organization_id', orgUUID)
      .order('nom'),
  ])

  return (
    <PrevisionsClient
      previsions={previsions ?? []}
      historiqueCA={snapshots ?? []}
      produits={produits ?? []}
    />
  )
}
