import { ParametresClient } from '@/components/parametres/parametres-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'
import { getAllRolePermissions } from '@/lib/actions/rbac'
import { getCurrentStaff } from '@/lib/rbac'

export default async function ParametresPage() {
  await requireRouteAccess('/parametres')
  const { supabase, orgId } = await getPageContext()

  const [{ data: org }, staff, permissions] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    getCurrentStaff(),
    getAllRolePermissions().catch(() => ({})),
  ])

  const isPatron = staff?.role === 'patron'

  return (
    <ParametresClient
      organisation={org}
      isPatron={isPatron}
      initialPermissions={permissions as Record<string, { allowed_routes: string[]; allowed_actions: string[] }>}
    />
  )
}
