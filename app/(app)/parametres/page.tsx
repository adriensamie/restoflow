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
  try {
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
  } catch (e: unknown) {
    // Rethrow Next.js redirects (they use error throwing internally)
    if (e && typeof e === 'object' && 'digest' in e) {
      const digest = (e as { digest: string }).digest
      if (digest.startsWith('NEXT_REDIRECT')) throw e
    }
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[PARAMETRES PAGE ERROR]', msg, e)
    return (
      <div style={{ padding: '2rem', color: '#f87171', background: '#0d1526', borderRadius: '1rem', border: '1px solid #7f1d1d' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#e2e8f0' }}>
          Erreur chargement Paramètres
        </h2>
        <pre style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg}</pre>
      </div>
    )
  }
}
