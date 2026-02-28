import { ParametresClient } from '@/components/parametres/parametres-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function ParametresPage() {
  await requireRouteAccess('/parametres')
  const { supabase, orgId } = await getPageContext()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  return <ParametresClient organisation={org} />
}
