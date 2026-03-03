import { ParametresClient } from '@/components/parametres/parametres-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'
import { getCurrentStaff } from '@/lib/rbac'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DEFAULT_ROLE_ROUTES, DEFAULT_ROLE_ACTIONS } from '@/lib/rbac'

async function fetchRolePermissions(orgId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('role_permissions')
      .select('role, allowed_routes, allowed_actions')
      .eq('organization_id', orgId)

    const result: Record<string, { allowed_routes: string[]; allowed_actions: string[] }> = {}
    for (const role of ['manager', 'employe', 'livreur']) {
      const existing = data?.find((d: { role: string }) => d.role === role)
      result[role] = {
        allowed_routes: existing?.allowed_routes ?? DEFAULT_ROLE_ROUTES[role] ?? [],
        allowed_actions: existing?.allowed_actions ?? DEFAULT_ROLE_ACTIONS[role] ?? [],
      }
    }
    return result
  } catch {
    // Table may not exist yet (pending migration) — return defaults
    const result: Record<string, { allowed_routes: string[]; allowed_actions: string[] }> = {}
    for (const role of ['manager', 'employe', 'livreur']) {
      result[role] = {
        allowed_routes: DEFAULT_ROLE_ROUTES[role] ?? [],
        allowed_actions: DEFAULT_ROLE_ACTIONS[role] ?? [],
      }
    }
    return result
  }
}

export default async function ParametresPage() {
  await requireRouteAccess('/parametres')
  const { supabase, orgId } = await getPageContext()

  const [{ data: org }, staff, permissions] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    getCurrentStaff(),
    fetchRolePermissions(orgId),
  ])

  const isPatron = staff?.role === 'patron'

  return (
    <ParametresClient
      organisation={org}
      isPatron={isPatron}
      initialPermissions={permissions}
    />
  )
}
