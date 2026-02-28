import { EquipeClient } from '@/components/equipe/equipe-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function EquipePage() {
  await requireRouteAccess('/equipe')
  const { supabase, orgId } = await getPageContext()

  const { data: employes } = await (supabase as any)
    .from('employes')
    .select('*')
    .eq('organization_id', orgId)
    .order('poste').order('prenom')

  return <EquipeClient employes={employes ?? []} />
}
