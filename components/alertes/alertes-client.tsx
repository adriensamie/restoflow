'use client'

import { useState } from 'react'
import { Bell, AlertTriangle, Package, Thermometer, ShieldAlert, TrendingDown, TrendingUp, CheckCircle } from 'lucide-react'

export function AlertesClient({ stocksCritiques, pertes, nonConformes, annulationsSuspectes, previsions, haussesPrix = [] }: {
  stocksCritiques: any[]
  pertes: any[]
  nonConformes: any[]
  annulationsSuspectes: any[]
  previsions: any[]
  haussesPrix?: any[]
}) {
  const [onglet, setOnglet] = useState<'toutes' | 'stocks' | 'haccp' | 'caisse' | 'pertes' | 'prix'>('toutes')

  const totalAlertes = stocksCritiques.length + nonConformes.length + annulationsSuspectes.length + haussesPrix.length
  const totalPertes = pertes.reduce((a: number, p: any) => a + ((p.quantite || 0) * (p.prix_unitaire || 0)), 0)

  const ONGLETS = [
    { key: 'toutes', label: 'Toutes', count: totalAlertes },
    { key: 'stocks', label: 'Stocks', count: stocksCritiques.length },
    { key: 'haccp', label: 'HACCP', count: nonConformes.length },
    { key: 'caisse', label: 'Caisse', count: annulationsSuspectes.length },
    { key: 'pertes', label: 'Pertes', count: pertes.length },
    { key: 'prix', label: 'Prix', count: haussesPrix.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}>
          <Bell size={20} className="text-white" />
          {totalAlertes > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
              style={{ background: '#dc2626' }}>{totalAlertes}</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Alertes</h1>
          <p className="text-sm" style={{ color: '#4a6fa5' }}>
            {totalAlertes === 0 ? 'Aucune alerte active — tout est en ordre ✓' : `${totalAlertes} alerte${totalAlertes > 1 ? 's' : ''} à traiter`}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Stocks critiques', value: stocksCritiques.length, icon: Package, color: stocksCritiques.length > 0 ? '#f87171' : '#4ade80' },
          { label: 'Non-conformités HACCP', value: nonConformes.length, icon: Thermometer, color: nonConformes.length > 0 ? '#f87171' : '#4ade80' },
          { label: 'Annulations suspectes', value: annulationsSuspectes.length, icon: ShieldAlert, color: annulationsSuspectes.length > 0 ? '#fbbf24' : '#4ade80' },
          { label: 'Pertes 30j (€)', value: `${Math.round(totalPertes)} €`, icon: TrendingDown, color: totalPertes > 500 ? '#f87171' : '#fbbf24' },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <k.icon size={18} style={{ color: k.color }} />
            <div>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>{k.label}</p>
              <p className="text-lg font-bold" style={{ color: k.color }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0a1120', width: 'fit-content' }}>
        {ONGLETS.map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key as any)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
            style={{ background: onglet === o.key ? '#1e2d4a' : 'transparent', color: onglet === o.key ? '#f87171' : '#4a6fa5' }}>
            {o.label}
            {o.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: '#1a0505', color: '#f87171' }}>{o.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* STOCKS CRITIQUES */}
      {(onglet === 'toutes' || onglet === 'stocks') && stocksCritiques.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: '#f87171' }}>
            <Package size={12} />Stocks critiques — {stocksCritiques.length} produit{stocksCritiques.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {stocksCritiques.map((p: any) => (
              <div key={p.produit_id} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: '#1a0505', border: '1px solid #7f1d1d' }}>
                <AlertTriangle size={16} style={{ color: '#f87171' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{p.nom}</p>
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>{p.categorie}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#f87171' }}>{p.quantite_actuelle} {p.unite}</p>
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>seuil : {p.seuil_alerte} {p.unite}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HACCP */}
      {(onglet === 'toutes' || onglet === 'haccp') && nonConformes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: '#fbbf24' }}>
            <Thermometer size={12} />Non-conformités HACCP — {nonConformes.length}
          </p>
          <div className="space-y-2">
            {nonConformes.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: '#1a1505', border: '1px solid #78350f' }}>
                <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{r.nom_controle}</p>
                  {r.action_corrective && (
                    <p className="text-xs" style={{ color: '#fbbf24' }}>→ {r.action_corrective}</p>
                  )}
                </div>
                <p className="text-xs" style={{ color: '#4a6fa5' }}>
                  {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CAISSE */}
      {(onglet === 'toutes' || onglet === 'caisse') && annulationsSuspectes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: '#a78bfa' }}>
            <ShieldAlert size={12} />Annulations suspectes — {annulationsSuspectes.length}
          </p>
          <div className="space-y-2">
            {annulationsSuspectes.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: '#0f051a', border: '1px solid #4c1d95' }}>
                <ShieldAlert size={16} style={{ color: '#a78bfa' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                    Annulation {a.employe_nom || 'inconnu'}
                  </p>
                  {a.motif && <p className="text-xs" style={{ color: '#4a6fa5' }}>{a.motif}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#a78bfa' }}>{a.montant} €</p>
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PERTES */}
      {(onglet === 'toutes' || onglet === 'pertes') && pertes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: '#f97316' }}>
            <TrendingDown size={12} />Pertes 30 derniers jours — {Math.round(totalPertes)} €
          </p>
          <div className="space-y-2">
            {pertes.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: '#1a0a00', border: '1px solid #7c2d12' }}>
                <TrendingDown size={16} style={{ color: '#f97316' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                    {(p.produits as any)?.nom || 'Produit inconnu'}
                  </p>
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>{p.motif || 'Sans motif'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#f97316' }}>
                    {Math.round(p.quantite * (p.prix_unitaire || 0))} €
                  </p>
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>
                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRIX */}
      {(onglet === 'toutes' || onglet === 'prix') && haussesPrix.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: '#f87171' }}>
            <TrendingUp size={12} />Hausses de prix — {haussesPrix.length}
          </p>
          <div className="space-y-2">
            {haussesPrix.map((h: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: '#1a0505', border: '1px solid #7f1d1d' }}>
                <TrendingUp size={16} style={{ color: '#f87171' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                    {h.produits?.nom ?? 'Produit'}
                  </p>
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>
                    {h.prix_precedent?.toFixed(2)} → {h.prix?.toFixed(2)} EUR
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: '#f87171' }}>
                  +{h.variation_pct?.toFixed(1)}%
                </span>
                <p className="text-xs" style={{ color: '#4a6fa5' }}>
                  {new Date(h.date_releve).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tout ok */}
      {totalAlertes === 0 && pertes.length === 0 && (
        <div className="rounded-xl p-12 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <CheckCircle size={40} className="mx-auto mb-3" style={{ color: '#4ade80' }} />
          <p className="text-sm font-medium" style={{ color: '#4ade80' }}>Tout est en ordre</p>
          <p className="text-xs mt-1" style={{ color: '#2d4a7a' }}>Aucune alerte active sur les 30 derniers jours</p>
        </div>
      )}
    </div>
  )
}
