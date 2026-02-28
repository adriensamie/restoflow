import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { MargesClient } from '@/components/marges/marges-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function MargesPage() {
  await requireRouteAccess('/marges')
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const [{ data: snapshots }, { data: objectifs }, { data: recettes }] = await Promise.all([
    (supabase as any)
      .from('snapshots_food_cost')
      .select('*')
      .eq('organization_id', orgUUID)
      .order('mois', { ascending: false })
      .limit(12),
    (supabase as any)
      .from('objectifs_kpi')
      .select('*')
      .eq('organization_id', orgUUID)
      .order('mois', { ascending: false })
      .limit(12),
    (supabase as any)
      .from('recettes')
      .select('id, nom, type, prix_vente_ttc, cout_matiere, food_cost_pct, marge_pct, coefficient')
      .eq('actif', true)
      .eq('organization_id', orgUUID)
      .not('food_cost_pct', 'is', null)
      .order('food_cost_pct', { ascending: false }),
  ])

  return (
    <MargesClient
      snapshots={snapshots ?? []}
      objectifs={objectifs ?? []}
      recettes={recettes ?? []}
    />
  )
}
