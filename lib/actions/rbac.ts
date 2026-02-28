'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole, DEFAULT_ROLE_ROUTES, DEFAULT_ROLE_ACTIONS } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { updateRolePermissionsSchema } from '@/lib/validations/rbac'

export async function getPermissionsForRole(role: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data } = await (supabase as any)
    .from('role_permissions')
    .select('allowed_routes, allowed_actions')
    .eq('organization_id', organization_id)
    .eq('role', role)
    .single()

  return {
    allowed_routes: data?.allowed_routes ?? DEFAULT_ROLE_ROUTES[role] ?? [],
    allowed_actions: data?.allowed_actions ?? DEFAULT_ROLE_ACTIONS[role] ?? [],
  }
}

export async function getAllRolePermissions() {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data } = await (supabase as any)
    .from('role_permissions')
    .select('role, allowed_routes, allowed_actions')
    .eq('organization_id', organization_id)

  const result: Record<string, { allowed_routes: string[]; allowed_actions: string[] }> = {}
  for (const role of ['manager', 'employe', 'livreur']) {
    const existing = data?.find((d: any) => d.role === role)
    result[role] = {
      allowed_routes: existing?.allowed_routes ?? DEFAULT_ROLE_ROUTES[role] ?? [],
      allowed_actions: existing?.allowed_actions ?? DEFAULT_ROLE_ACTIONS[role] ?? [],
    }
  }
  return result
}

export async function updateRolePermissions(data: {
  role: string
  allowed_routes: string[]
  allowed_actions: string[]
}) {
  updateRolePermissionsSchema.parse(data)
  await requireRole(['patron'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await (supabase as any)
    .from('role_permissions')
    .upsert({
      organization_id,
      role: data.role,
      allowed_routes: data.allowed_routes,
      allowed_actions: data.allowed_actions,
    }, { onConflict: 'organization_id,role' })

  if (error) throw new Error(error.message)
  revalidatePath('/parametres')
}
