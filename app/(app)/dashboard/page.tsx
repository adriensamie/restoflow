import { getPageContext } from '@/lib/page-context'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Users,
  ClipboardList,
  Package,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Circle,
} from 'lucide-react'

type OrgData = {
  nom: string
  plan: string
  trial_ends_at: string | null
}

export default async function DashboardPage() {
  const { supabase, orgId } = await getPageContext()

  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: org },
    { count: stockAlerts },
    { count: haccpNonConforme },
    { count: activeStaff },
    { count: pendingOrders },
    { data: previsions },
    { count: totalProducts },
    { data: pertes },
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('nom, plan, trial_ends_at')
      .eq('id', orgId)
      .single(),
    supabase
      .from('stock_actuel')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('en_alerte', true),
    supabase
      .from('haccp_releves')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('resultat', 'non_conforme')
      .gte('created_at', todayISO),
    supabase
      .from('employes')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('actif', true),
    supabase
      .from('commandes')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('statut', ['brouillon', 'envoyee']),
    supabase
      .from('previsions')
      .select('ca_reel')
      .eq('organization_id', orgId)
      .gte('date_prevision', monthStart)
      .lte('date_prevision', todayISO),
    supabase
      .from('produits')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('actif', true),
    supabase
      .from('mouvements_stock')
      .select('quantite, prix_unitaire')
      .eq('organization_id', orgId)
      .eq('type', 'perte')
      .gte('created_at', monthStart),
  ])

  const typedOrg = org as OrgData | null
  const caMonth = (previsions ?? []).reduce((sum, p) => sum + (p.ca_reel ?? 0), 0)
  const pertesMonth = (pertes ?? []).reduce(
    (sum, p) => sum + p.quantite * (p.prix_unitaire ?? 0),
    0
  )
  const isNewUser = (totalProducts ?? 0) === 0

  const formatEur = (v: number) =>
    v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' \u20AC'

  const dateLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>
          {typedOrg ? `Bonjour \u2014 ${typedOrg.nom}` : 'Dashboard'}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
          Plan {typedOrg?.plan ?? 'inconnu'} &middot; {dateLabel}
        </p>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="CA du mois"
          value={formatEur(caMonth)}
          icon={<TrendingUp size={20} />}
          color="#60a5fa"
        />
        <KpiCard
          label="Alertes stock"
          value={`${stockAlerts ?? 0} produits`}
          icon={<AlertTriangle size={20} />}
          color={(stockAlerts ?? 0) > 0 ? '#f59e0b' : '#4ade80'}
        />
        <KpiCard
          label="Commandes en cours"
          value={`${pendingOrders ?? 0}`}
          icon={<ShoppingCart size={20} />}
          color="#60a5fa"
        />
        <KpiCard
          label="\u00C9quipe"
          value={`${activeStaff ?? 0} employ\u00E9s actifs`}
          icon={<Users size={20} />}
          color="#60a5fa"
        />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard
          label="HACCP"
          value={`${haccpNonConforme ?? 0} non-conformit\u00E9s aujourd\u2019hui`}
          icon={<ClipboardList size={20} />}
          color={(haccpNonConforme ?? 0) > 0 ? '#f87171' : '#4ade80'}
        />
        <KpiCard
          label="Pertes du mois"
          value={formatEur(pertesMonth)}
          icon={<TrendingDown size={20} />}
          color="#f87171"
        />
      </div>

      {/* Onboarding Checklist */}
      {isNewUser && (
        <div
          className="rounded-xl p-6"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#e2e8f0' }}>
            Premiers pas avec RestoFlow
          </h2>
          <ul className="space-y-3">
            {[
              { label: 'Ajouter vos produits', href: '/stocks' },
              { label: 'Configurer vos fournisseurs', href: '/commandes' },
              { label: 'Cr\u00E9er vos recettes', href: '/recettes' },
              { label: 'Planifier votre \u00E9quipe', href: '/planning' },
              { label: 'Configurer HACCP', href: '/hygiene' },
            ].map((step) => (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className="flex items-center gap-3 group transition-colors"
                >
                  <Circle
                    size={18}
                    style={{ color: '#4a6fa5' }}
                    className="group-hover:hidden"
                  />
                  <CheckCircle2
                    size={18}
                    style={{ color: '#4ade80' }}
                    className="hidden group-hover:block"
                  />
                  <span
                    className="text-sm group-hover:underline"
                    style={{ color: '#e2e8f0' }}
                  >
                    {step.label}
                  </span>
                  <span className="text-xs" style={{ color: '#4a6fa5' }}>
                    {step.href}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Stocks', href: '/stocks', icon: <Package size={20} /> },
          { label: 'Commandes', href: '/commandes', icon: <ShoppingCart size={20} /> },
          { label: 'Planning', href: '/planning', icon: <CalendarDays size={20} /> },
          { label: 'HACCP', href: '/hygiene', icon: <ShieldCheck size={20} /> },
        ].map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}
          >
            <span style={{ color: '#60a5fa' }}>{m.icon}</span>
            <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
              {m.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm" style={{ color: '#4a6fa5' }}>
          {label}
        </p>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-lg font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
