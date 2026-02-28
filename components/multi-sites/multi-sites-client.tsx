'use client'

import { useState, useEffect } from 'react'
import { Building2, TrendingUp, Users, UtensilsCrossed, Loader2 } from 'lucide-react'
import { getConsolidatedKPIs, getComparaisonSites } from '@/lib/actions/multi-sites'

type Tab = 'dashboard' | 'comparaison'

interface SiteKPI {
  site_id: string
  site_nom: string
  ca_total: number
  food_cost_pct: number
  nb_couverts: number
  nb_employes: number
}

interface ComparaisonSite extends SiteKPI {
  ca_par_couvert: number
}

export function MultiSitesClient() {
  const now = new Date()
  const defaultMois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [mois, setMois] = useState(defaultMois)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [sites, setSites] = useState<SiteKPI[]>([])
  const [totals, setTotals] = useState<{ ca_total: number; food_cost_pct: number; nb_couverts: number; nb_employes: number } | null>(null)
  const [comparaison, setComparaison] = useState<ComparaisonSite[]>([])

  useEffect(() => {
    setLoading(true)
    if (tab === 'dashboard') {
      getConsolidatedKPIs(mois).then(data => {
        setSites(data.sites)
        setTotals(data.totals)
      }).finally(() => setLoading(false))
    } else {
      getComparaisonSites(mois).then(data => {
        setComparaison(data)
      }).finally(() => setLoading(false))
    }
  }, [mois, tab])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button onClick={() => setTab('dashboard')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={tab === 'dashboard'
              ? { background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', color: 'white' }
              : { background: '#0f1729', border: '1px solid #1e2d4a', color: '#6b8cc7' }
            }>
            Dashboard
          </button>
          <button onClick={() => setTab('comparaison')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={tab === 'comparaison'
              ? { background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', color: 'white' }
              : { background: '#0f1729', border: '1px solid #1e2d4a', color: '#6b8cc7' }
            }>
            Comparaison
          </button>
        </div>
        <input type="month" value={mois} onChange={e => setMois(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: '#0f1729', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-400" size={32} />
        </div>
      ) : tab === 'dashboard' ? (
        <>
          {/* KPI totals */}
          {totals && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'CA Total', value: `${totals.ca_total.toLocaleString('fr-FR')} EUR`, icon: TrendingUp, color: '#4ade80' },
                { label: 'Food Cost Moy.', value: `${totals.food_cost_pct}%`, icon: UtensilsCrossed, color: '#fbbf24' },
                { label: 'Couverts', value: totals.nb_couverts.toLocaleString('fr-FR'), icon: UtensilsCrossed, color: '#60a5fa' },
                { label: 'Employes', value: String(totals.nb_employes), icon: Users, color: '#a78bfa' },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-xl p-5"
                  style={{ background: '#0f1729', border: '1px solid #1e2d4a' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon size={14} style={{ color: kpi.color }} />
                    <span className="text-xs text-gray-500">{kpi.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sites table */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0a1225' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Site</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>CA</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Food Cost</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Couverts</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Employes</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(site => (
                  <tr key={site.site_id} style={{ borderTop: '1px solid #1e2d4a' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-blue-400" />
                        <span className="text-sm text-white font-medium">{site.site_nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">{site.ca_total.toLocaleString('fr-FR')} EUR</td>
                    <td className="px-4 py-3 text-right text-sm" style={{ color: site.food_cost_pct > 35 ? '#f87171' : site.food_cost_pct > 30 ? '#fbbf24' : '#4ade80' }}>{site.food_cost_pct}%</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">{site.nb_couverts.toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">{site.nb_employes}</td>
                  </tr>
                ))}
                {sites.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucun site lie. Ajoutez des etablissements enfants pour voir les donnees consolidees.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Comparaison tab */
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#0a1225' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Site</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>CA</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Food Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Couverts</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>CA/Couvert</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Employes</th>
              </tr>
            </thead>
            <tbody>
              {comparaison.map((site, i) => (
                <tr key={site.site_id} style={{ borderTop: '1px solid #1e2d4a', background: i === 0 ? 'rgba(14, 165, 233, 0.05)' : undefined }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-yellow-400 text-xs">1er</span>}
                      <span className="text-sm text-white font-medium">{site.site_nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-300">{site.ca_total.toLocaleString('fr-FR')} EUR</td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: site.food_cost_pct > 35 ? '#f87171' : site.food_cost_pct > 30 ? '#fbbf24' : '#4ade80' }}>{site.food_cost_pct}%</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-300">{site.nb_couverts.toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-right text-sm text-blue-400">{site.ca_par_couvert.toFixed(2)} EUR</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-300">{site.nb_employes}</td>
                </tr>
              ))}
              {comparaison.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucun site a comparer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
