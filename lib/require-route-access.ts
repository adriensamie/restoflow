'use server'

import { redirect } from 'next/navigation'
import { canAccessRoute } from '@/lib/rbac'

/**
 * Server-side route access guard. Call at the top of each page.tsx.
 * Redirects to /dashboard if the current user lacks access.
 */
export async function requireRouteAccess(route: string): Promise<void> {
  const allowed = await canAccessRoute(route)
  if (!allowed) {
    redirect('/dashboard')
  }
}
