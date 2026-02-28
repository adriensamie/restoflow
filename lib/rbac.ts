import { cache } from 'react'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Staff } from '@/types/database'

// Default routes accessible by each role (fallback when no custom config exists)
export const DEFAULT_ROLE_ROUTES: Record<string, string[]> = {
  patron: ['*'], // all access
  manager: [
    '/dashboard', '/alertes', '/stocks', '/pertes', '/commandes', '/livraisons',
    '/cave', '/inventaire', '/marges', '/recettes', '/previsions',
    '/equipe', '/planning', '/fiches-paie', '/hygiene', '/assistant', '/bilan',
  ],
  employe: [
    '/dashboard', '/stocks', '/planning', '/hygiene',
  ],
  livreur: [
    '/dashboard', '/livraisons', '/stocks',
  ],
}

export const DEFAULT_ROLE_ACTIONS: Record<string, string[]> = {
  patron: ['*'],
  manager: ['stocks.write', 'commandes.write', 'livraisons.write', 'recettes.write', 'inventaire.write', 'haccp.write', 'equipe.read', 'planning.write', 'retours.write'],
  employe: ['stocks.read', 'planning.read', 'haccp.write'],
  livreur: ['livraisons.write', 'stocks.read'],
}

export interface CurrentStaff {
  orgId: string
  staffId: string
  role: 'patron' | 'manager' | 'employe' | 'livreur'
  nom: string
  prenom: string
}

// Cached per-request staff lookup
export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  try {
    const { userId, orgId, orgRole } = await auth()
    if (!userId || !orgId) return null

    const supabase = await createServerSupabaseClient()

    // Get org UUID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', orgId)
      .returns<{ id: string }[]>()
      .single()
    if (!org) return null

    // Find staff by clerk_user_id within this org
    const { data: staff } = await (supabase as any)
      .from('staff')
      .select('id, role, nom, prenom')
      .eq('organization_id', org.id)
      .eq('clerk_user_id', userId)
      .eq('actif', true)
      .single()

    if (!staff) {
      // Only grant patron if Clerk confirms org:admin role
      if (orgRole === 'org:admin') {
        return { orgId: org.id, staffId: '', role: 'patron', nom: '', prenom: '' }
      }
      return null
    }

    return {
      orgId: org.id,
      staffId: staff.id,
      role: staff.role,
      nom: staff.nom,
      prenom: staff.prenom,
    }
  } catch {
    return null
  }
})

export async function canAccessRoute(route: string): Promise<boolean> {
  const staff = await getCurrentStaff()
  if (!staff) return false
  if (staff.role === 'patron') return true

  const supabase = await createServerSupabaseClient()
  const { data: perms } = await (supabase as any)
    .from('role_permissions')
    .select('allowed_routes')
    .eq('organization_id', staff.orgId)
    .eq('role', staff.role)
    .single()

  const allowedRoutes: string[] = perms?.allowed_routes ?? DEFAULT_ROLE_ROUTES[staff.role] ?? []
  if (allowedRoutes.includes('*')) return true

  return allowedRoutes.some(r => route === r || route.startsWith(r + '/'))
}

export async function getAllowedRoutes(role: string, orgId: string): Promise<string[]> {
  if (role === 'patron') return ['*']

  const supabase = await createServerSupabaseClient()
  const { data: perms } = await (supabase as any)
    .from('role_permissions')
    .select('allowed_routes')
    .eq('organization_id', orgId)
    .eq('role', role)
    .single()

  return perms?.allowed_routes ?? DEFAULT_ROLE_ROUTES[role] ?? []
}

export async function requireRole(requiredRoles: string[]): Promise<CurrentStaff> {
  const staff = await getCurrentStaff()
  if (!staff) throw new Error('Non authentifie')
  if (!requiredRoles.includes(staff.role) && staff.role !== 'patron') {
    throw new Error('Acces refuse')
  }
  return staff
}
