// lib/supabase/admin.ts
// Client ADMIN — bypasse complètement la RLS
// À utiliser UNIQUEMENT dans les webhooks (Clerk, Stripe)
// JAMAIS dans du code accessible par les utilisateurs

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Ce client utilise la service_role key qui bypasse la RLS
// Il a accès à TOUTES les données de TOUTES les orgs
// C'est voulu : les webhooks doivent pouvoir créer/modifier
// des organisations sans être authentifiés en tant qu'utilisateur

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante — vérifier les env vars')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}