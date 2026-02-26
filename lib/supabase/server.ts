// lib/supabase/server.ts
// Client Supabase pour les SERVER COMPONENTS et SERVER ACTIONS
// Utilise les cookies pour lire le JWT Clerk côté serveur

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import type { Database } from '@/types/database'

// À utiliser dans les Server Components et Server Actions
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const { getToken } = await auth()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll appelé depuis un Server Component — ignoré
          }
        },
      },
      global: {
        fetch: async (url, options = {}) => {
          // Récupère le JWT Clerk avec le template supabase (contient org_id)
          const clerkToken = await getToken({ template: 'supabase' })
          const headers = new Headers(options?.headers)
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`)
          }
          return fetch(url, { ...options, headers })
        },
      },
    }
  )
}