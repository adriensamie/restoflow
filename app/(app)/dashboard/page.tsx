import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type OrgData = {
  nom: string
  plan: string
  trial_ends_at: string | null
}

export default async function DashboardPage() {
  const { orgId, userId } = await auth()

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('nom, plan, trial_ends_at')
    .single()

  const org = data as OrgData | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>
          {org ? `Bonjour — ${org.nom}` : 'Dashboard'}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
          {org?.plan === 'trial' ? "Période d'essai active" : `Plan ${org?.plan}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Carte Auth */}
        <div className="rounded-xl p-5" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <p className="text-sm mb-1" style={{ color: '#4a6fa5' }}>Auth Clerk</p>
          <p className="text-lg font-semibold" style={{ color: '#4ade80' }}>✅ Connecté</p>
        </div>

        {/* Carte Organisation */}
        <div className="rounded-xl p-5" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <p className="text-sm mb-1" style={{ color: '#4a6fa5' }}>Organisation</p>
          <p className="text-lg font-semibold" style={{ color: org ? '#4ade80' : '#f87171' }}>
            {org ? '✅ ' + org.nom : '❌ Non trouvée'}
          </p>
        </div>

        {/* Carte Base de données */}
        <div className="rounded-xl p-5" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <p className="text-sm mb-1" style={{ color: '#4a6fa5' }}>Base de données</p>
          <p className="text-lg font-semibold" style={{ color: error ? '#f87171' : '#4ade80' }}>
            {error ? '❌ Erreur RLS' : '✅ Isolation active'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg p-4" style={{ background: '#1a0a0a', border: '1px solid #7f1d1d' }}>
          <p className="text-sm" style={{ color: '#f87171' }}>Erreur : {error.message}</p>
        </div>
      )}

      {/* Placeholder modules à venir */}
      <div className="rounded-xl p-6 mt-4" style={{ background: '#0d1526', border: '1px dashed #1e2d4a' }}>
        <p className="text-sm font-medium mb-1" style={{ color: '#4a6fa5' }}>Prochaines étapes</p>
        <p className="text-sm" style={{ color: '#2d4a7a' }}>
          Module 02 — Stocks en cours de développement...
        </p>
      </div>
    </div>
  )
}
