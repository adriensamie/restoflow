'use client'

import { useState } from 'react'
import { Plus, Wine, AlertTriangle, TrendingUp, Package, Filter } from 'lucide-react'
import { VinModal } from './vin-modal'
import { MouvementCaveModal } from './mouvement-cave-modal'

const CATEGORIE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  rouge:   { label: 'Rouge',    color: '#f87171', bg: '#1a0505', dot: '#dc2626' },
  blanc:   { label: 'Blanc',    color: '#fbbf24', bg: '#1a1505', dot: '#d97706' },
  rose:    { label: 'Rosé',     color: '#f9a8d4', bg: '#1a0510', dot: '#ec4899' },
  bulles:  { label: 'Bulles',   color: '#a5b4fc', bg: '#0a0a1a', dot: '#6366f1' },
  dessert: { label: 'Dessert',  color: '#86efac', bg: '#051a0a', dot: '#22c55e' },
  digestif:{ label: 'Digestif', color: '#c4b5fd', bg: '#0f051a', dot: '#8b5cf6' },
  autre:   { label: 'Autre',    color: '#94a3b8', bg: '#0d1526', dot: '#64748b' },
}

const ZONE_LABELS: Record<string, string> = {
  cave_principale: 'Cave principale',
  reserve: 'Réserve',
  bar: 'Bar',
}

interface Vin {
  id: string; nom: string; appellation: string | null; categorie: string; zone: string
  prix_achat_ht: number | null; prix_vente_ttc: number | null
  prix_verre_ttc: number | null; contenance_verre: number | null; vendu_au_verre: boolean
  stock_bouteilles: number; seuil_alerte: number
  fournisseurs: { nom: string } | null
}

interface Stats {
  totalRefs: number; alertes: number; valeurTotale: number; totalBouteilles: number
}

export function CaveClient({ vins, stats }: { vins: Vin[], stats: Stats }) {
  const [showModal, setShowModal] = useState(false)
  const [editVin, setEditVin] = useState<Vin | null>(null)
  const [mouvementVin, setMouvementVin] = useState<Vin | null>(null)
  const [filtreCategorie, setFiltreCategorie] = useState<string>('tous')
  const [filtreZone, setFiltreZone] = useState<string>('tous')
  const [filtreAlertes, setFiltreAlertes] = useState(false)
  const [recherche, setRecherche] = useState('')

  const vinsFiltres = vins.filter(v => {
    if (filtreCategorie !== 'tous' && v.categorie !== filtreCategorie) return false
    if (filtreZone !== 'tous' && v.zone !== filtreZone) return false
    if (filtreAlertes && v.stock_bouteilles > v.seuil_alerte) return false
    if (recherche && !v.nom.toLowerCase().includes(recherche.toLowerCase()) &&
        !v.appellation?.toLowerCase().includes(recherche.toLowerCase())) return false
    return true
  })

  const margeVin = (v: Vin) => {
    if (!v.prix_achat_ht || !v.prix_vente_ttc) return null
    return Math.round(((v.prix_vente_ttc / 1.2) - v.prix_achat_ht) / (v.prix_vente_ttc / 1.2) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Cave à Vins</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            {stats.totalRefs} référence{stats.totalRefs > 1 ? 's' : ''} · {stats.totalBouteilles} bouteilles
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #7c2d12, #dc2626)' }}>
          <Plus size={16} />Nouveau vin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Références', value: stats.totalRefs, icon: Wine, color: '#a5b4fc' },
          { label: 'Bouteilles', value: stats.totalBouteilles, icon: Package, color: '#60a5fa' },
          { label: 'Valeur cave', value: `${stats.valeurTotale.toFixed(0)} €`, icon: TrendingUp, color: '#4ade80' },
          { label: 'Alertes', value: stats.alertes, icon: AlertTriangle, color: stats.alertes > 0 ? '#f87171' : '#4a6fa5' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: '#0a1120' }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>{s.label}</p>
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <input value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher un vin..."
          className="px-3 py-2 rounded-lg text-sm outline-none w-48"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }} />

        <select value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }}>
          <option value="tous">Toutes catégories</option>
          {Object.entries(CATEGORIE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select value={filtreZone} onChange={e => setFiltreZone(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }}>
          <option value="tous">Toutes zones</option>
          {Object.entries(ZONE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <button onClick={() => setFiltreAlertes(!filtreAlertes)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: filtreAlertes ? '#1a0505' : '#0d1526',
            border: `1px solid ${filtreAlertes ? '#dc2626' : '#1e2d4a'}`,
            color: filtreAlertes ? '#f87171' : '#4a6fa5'
          }}>
          <AlertTriangle size={14} />
          Alertes {stats.alertes > 0 && `(${stats.alertes})`}
        </button>
      </div>

      {/* Tableau */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0a1628', borderBottom: '1px solid #1e2d4a' }}>
              {['Vin', 'Catégorie', 'Zone', 'Stock', 'Prix achat', 'Prix vente', 'Marge', 'Au verre', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#3b5280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vinsFiltres.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: '#2d4a7a' }}>
                <Wine size={32} className="mx-auto mb-2 opacity-30" />
                Aucun vin
              </td></tr>
            )}
            {vinsFiltres.map((v, i) => {
              const cat = CATEGORIE_CONFIG[v.categorie] ?? CATEGORIE_CONFIG.autre
              const enAlerte = v.stock_bouteilles <= v.seuil_alerte
              const marge = margeVin(v)
              return (
                <tr key={v.id} style={{
                  background: enAlerte ? '#0f0505' : i % 2 === 0 ? '#0d1526' : '#0a1120',
                  borderBottom: '1px solid #1a2540'
                }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.dot }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{v.nom}</p>
                        {v.appellation && <p className="text-xs" style={{ color: '#4a6fa5' }}>{v.appellation}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>
                    {ZONE_LABELS[v.zone] ?? v.zone}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: enAlerte ? '#f87171' : '#e2e8f0' }}>
                        {v.stock_bouteilles}
                      </span>
                      {enAlerte && <AlertTriangle size={12} style={{ color: '#f87171' }} />}
                      <span className="text-xs" style={{ color: '#2d4a7a' }}>/ {v.seuil_alerte} min</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>
                    {v.prix_achat_ht ? `${v.prix_achat_ht.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#60a5fa' }}>
                    {v.prix_vente_ttc ? `${v.prix_vente_ttc.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium"
                    style={{ color: marge ? (marge >= 60 ? '#4ade80' : marge >= 40 ? '#fbbf24' : '#f87171') : '#2d4a7a' }}>
                    {marge ? `${marge}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>
                    {v.vendu_au_verre ? `${v.prix_verre_ttc?.toFixed(2) ?? '—'} € / ${v.contenance_verre ?? '?'}cl` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setMouvementVin(v)}
                        className="text-xs px-2 py-1.5 rounded-lg font-medium"
                        style={{ background: '#1e2d4a', color: '#60a5fa' }}>
                        Mouvement
                      </button>
                      <button onClick={() => setEditVin(v)}
                        className="text-xs px-2 py-1.5 rounded-lg font-medium"
                        style={{ background: '#1e2d4a', color: '#94a3b8' }}>
                        Éditer
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {(showModal || editVin) && (
        <VinModal vin={editVin ?? undefined} onClose={() => { setShowModal(false); setEditVin(null) }} />
      )}
      {mouvementVin && (
        <MouvementCaveModal vin={mouvementVin} onClose={() => setMouvementVin(null)} />
      )}
    </div>
  )
}
