'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Target, AlertTriangle, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { sauvegarderObjectifs, sauvegarderSnapshot } from '@/lib/actions/marges'

const moisLabel = (mois: string) => {
  const d = new Date(mois)
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

const fcColor = (fc: number | null, cible: number = 30) => {
  if (!fc) return '#4a6fa5'
  if (fc <= cible) return '#4ade80'
  if (fc <= cible + 5) return '#fbbf24'
  return '#f87171'
}

interface Snapshot {
  id: string; mois: string; ca_total: number; cout_matieres: number
  masse_salariale: number; food_cost_reel: number | null; marge_brute: number | null
  marge_nette: number | null; nb_couverts: number | null; ticket_moyen: number | null
}
interface Objectif {
  mois: string; food_cost_cible: number; masse_salariale_cible: number
  marge_nette_cible: number; ca_cible: number | null
}
interface Recette {
  id: string; nom: string; type: string; prix_vente_ttc: number | null
  cout_matiere: number | null; food_cost_pct: number | null
  marge_pct: number | null; coefficient: number | null
}

export function MargesClient({ snapshots, objectifs, recettes }: {
  snapshots: Snapshot[], objectifs: Objectif[], recettes: Recette[]
}) {
  const [onglet, setOnglet] = useState<'apercu' | 'recettes' | 'saisie' | 'objectifs'>('apercu')
  const [showSaisie, setShowSaisie] = useState(false)
  const [loading, setLoading] = useState(false)

  const dernierSnapshot = snapshots[0]
  const objectifActuel = objectifs[0]
  const cibleFC = objectifActuel?.food_cost_cible ?? 30

  // Données graphe (12 derniers mois, ordre chrono)
  const dataGraphe = [...snapshots].reverse().map(s => ({
    mois: moisLabel(s.mois),
    foodCost: s.food_cost_reel,
    marge: s.marge_nette,
    ca: s.ca_total,
    cible: cibleFC,
  }))

  // Stats globales recettes
  const recettesAvecFC = recettes.filter(r => r.food_cost_pct !== null)
  const fcMoyen = recettesAvecFC.length > 0
    ? Math.round(recettesAvecFC.reduce((a, r) => a + (r.food_cost_pct || 0), 0) / recettesAvecFC.length * 10) / 10
    : null
  const recettesAlertes = recettes.filter(r => r.food_cost_pct && r.food_cost_pct > 35)

  // Formulaire saisie mensuelle
  const moisCourant = new Date().toISOString().slice(0, 7) + '-01'
  const [formSaisie, setFormSaisie] = useState({
    mois: moisCourant,
    ca_total: '',
    cout_matieres: '',
    masse_salariale: '',
    nb_couverts: '',
  })
  const setS = (k: string, v: string) => setFormSaisie(f => ({ ...f, [k]: v }))

  // Calculs live saisie
  const ca = parseFloat(formSaisie.ca_total) || 0
  const cm = parseFloat(formSaisie.cout_matieres) || 0
  const ms = parseFloat(formSaisie.masse_salariale) || 0
  const fcLive = ca > 0 ? Math.round(cm / ca * 1000) / 10 : null
  const margeLive = ca > 0 ? Math.round((ca - cm - ms) / ca * 1000) / 10 : null

  const handleSaisie = async () => {
    if (!formSaisie.ca_total) return
    setLoading(true)
    try {
      await sauvegarderSnapshot({
        mois: formSaisie.mois,
        ca_total: ca, cout_matieres: cm,
        masse_salariale: ms,
        nb_couverts: parseInt(formSaisie.nb_couverts) || undefined,
      })
      setShowSaisie(false)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Formulaire objectifs
  const [formObj, setFormObj] = useState({
    mois: moisCourant,
    food_cost_cible: objectifActuel?.food_cost_cible?.toString() ?? '30',
    masse_salariale_cible: objectifActuel?.masse_salariale_cible?.toString() ?? '35',
    marge_nette_cible: objectifActuel?.marge_nette_cible?.toString() ?? '15',
    ca_cible: objectifActuel?.ca_cible?.toString() ?? '',
  })
  const setO = (k: string, v: string) => setFormObj(f => ({ ...f, [k]: v }))

  const handleObjectifs = async () => {
    setLoading(true)
    try {
      await sauvegarderObjectifs({
        mois: formObj.mois,
        food_cost_cible: parseFloat(formObj.food_cost_cible),
        masse_salariale_cible: parseFloat(formObj.masse_salariale_cible),
        marge_nette_cible: parseFloat(formObj.marge_nette_cible),
        ca_cible: formObj.ca_cible ? parseFloat(formObj.ca_cible) : undefined,
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }

  const tooltipStyle = {
    background: '#0d1526', border: '1px solid #1e2d4a',
    borderRadius: '8px', color: '#e2e8f0', fontSize: '12px'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Marges & Food Cost</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            Analyse de rentabilité · Suivi mensuel
          </p>
        </div>
        <button onClick={() => setShowSaisie(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          <Plus size={16} />Saisie mensuelle
        </button>
      </div>

      {/* KPIs dernier mois */}
      {dernierSnapshot && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'CA ce mois', value: `${dernierSnapshot.ca_total?.toLocaleString('fr-FR')} €`,
              sub: objectifActuel?.ca_cible ? `Objectif : ${objectifActuel.ca_cible.toLocaleString('fr-FR')} €` : null,
              color: '#60a5fa',
            },
            {
              label: 'Food cost réel', value: dernierSnapshot.food_cost_reel ? `${dernierSnapshot.food_cost_reel}%` : '—',
              sub: `Cible : ${cibleFC}%`,
              color: fcColor(dernierSnapshot.food_cost_reel, cibleFC),
              alerte: dernierSnapshot.food_cost_reel && dernierSnapshot.food_cost_reel > cibleFC,
            },
            {
              label: 'Marge nette', value: dernierSnapshot.marge_nette ? `${dernierSnapshot.marge_nette}%` : '—',
              sub: `Cible : ${objectifActuel?.marge_nette_cible ?? 15}%`,
              color: dernierSnapshot.marge_nette
                ? dernierSnapshot.marge_nette >= (objectifActuel?.marge_nette_cible ?? 15) ? '#4ade80' : '#f87171'
                : '#4a6fa5',
            },
            {
              label: 'Ticket moyen', value: dernierSnapshot.ticket_moyen ? `${dernierSnapshot.ticket_moyen} €` : '—',
              sub: dernierSnapshot.nb_couverts ? `${dernierSnapshot.nb_couverts} couverts` : null,
              color: '#a5b4fc',
            },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-4 relative overflow-hidden"
              style={{ background: '#0d1526', border: `1px solid ${(k as any).alerte ? '#dc2626' : '#1e2d4a'}` }}>
              {(k as any).alerte && (
                <div className="absolute top-2 right-2">
                  <AlertTriangle size={14} style={{ color: '#f87171' }} />
                </div>
              )}
              <p className="text-xs mb-1" style={{ color: '#4a6fa5' }}>{k.label}</p>
              <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
              {k.sub && <p className="text-xs mt-1" style={{ color: '#2d4a7a' }}>{k.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0a1120', width: 'fit-content' }}>
        {[
          { key: 'apercu', label: 'Évolution' },
          { key: 'recettes', label: `Recettes (${recettes.length})` },
          { key: 'objectifs', label: 'Objectifs' },
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key as any)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: onglet === o.key ? '#1e2d4a' : 'transparent',
              color: onglet === o.key ? '#60a5fa' : '#4a6fa5',
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ONGLET ÉVOLUTION */}
      {onglet === 'apercu' && (
        <div className="space-y-4">
          {dataGraphe.length === 0 ? (
            <div className="rounded-xl p-16 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <TrendingUp size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#60a5fa' }} />
              <p className="text-sm mb-1" style={{ color: '#4a6fa5' }}>Aucune donnée mensuelle</p>
              <p className="text-xs" style={{ color: '#2d4a7a' }}>
                Utilisez "Saisie mensuelle" pour ajouter vos données
              </p>
            </div>
          ) : (
            <>
              {/* Graphe food cost */}
              <div className="rounded-xl p-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
                <p className="text-sm font-medium mb-4" style={{ color: '#e2e8f0' }}>Food cost % — 12 mois</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dataGraphe}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis dataKey="mois" tick={{ fill: '#4a6fa5', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#4a6fa5', fontSize: 11 }} unit="%" domain={[0, 50]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`]} />
                    <ReferenceLine y={cibleFC} stroke="#fbbf24" strokeDasharray="4 4"
                      label={{ value: `Cible ${cibleFC}%`, fill: '#fbbf24', fontSize: 11 }} />
                    <Line type="monotone" dataKey="foodCost" stroke="#60a5fa" strokeWidth={2}
                      dot={{ fill: '#60a5fa', r: 4 }} name="Food cost" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Graphe marge nette */}
              <div className="rounded-xl p-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
                <p className="text-sm font-medium mb-4" style={{ color: '#e2e8f0' }}>Marge nette % — 12 mois</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dataGraphe}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis dataKey="mois" tick={{ fill: '#4a6fa5', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#4a6fa5', fontSize: 11 }} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`]} />
                    <ReferenceLine y={objectifActuel?.marge_nette_cible ?? 15}
                      stroke="#4ade80" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="marge" stroke="#4ade80" strokeWidth={2}
                      dot={{ fill: '#4ade80', r: 4 }} name="Marge nette" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Tableau historique */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#0a1628', borderBottom: '1px solid #1e2d4a' }}>
                      {['Mois', 'CA', 'Coût matières', 'Masse sal.', 'Food cost', 'Marge nette', 'Couverts'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: '#3b5280' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderBottom: '1px solid #1a2540' }}>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: '#e2e8f0' }}>{moisLabel(s.mois)}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#60a5fa' }}>{s.ca_total?.toLocaleString('fr-FR')} €</td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>{s.cout_matieres?.toLocaleString('fr-FR')} €</td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>{s.masse_salariale?.toLocaleString('fr-FR')} €</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: fcColor(s.food_cost_reel, cibleFC) }}>
                          {s.food_cost_reel ? `${s.food_cost_reel}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold"
                          style={{ color: s.marge_nette && s.marge_nette >= (objectifActuel?.marge_nette_cible ?? 15) ? '#4ade80' : '#f87171' }}>
                          {s.marge_nette ? `${s.marge_nette}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>{s.nb_couverts ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ONGLET RECETTES */}
      {onglet === 'recettes' && (
        <div className="space-y-3">
          {recettesAlertes.length > 0 && (
            <div className="p-3 rounded-xl flex items-center gap-2"
              style={{ background: '#1a0505', border: '1px solid #dc2626' }}>
              <AlertTriangle size={14} style={{ color: '#f87171' }} />
              <span className="text-sm" style={{ color: '#f87171' }}>
                {recettesAlertes.length} recette{recettesAlertes.length > 1 ? 's' : ''} avec food cost {'>'} 35%
              </span>
            </div>
          )}

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0a1628', borderBottom: '1px solid #1e2d4a' }}>
                  {['Recette', 'Type', 'Coût/portion', 'Prix vente', 'Food cost', 'Marge', 'Coeff.'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#3b5280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recettes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: '#2d4a7a' }}>
                    Aucune recette avec food cost calculé
                  </td></tr>
                )}
                {recettes.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderBottom: '1px solid #1a2540' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#e2e8f0' }}>{r.nom}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#4a6fa5' }}>{r.type}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>
                      {r.cout_matiere ? `${r.cout_matiere.toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#60a5fa' }}>
                      {r.prix_vente_ttc ? `${r.prix_vente_ttc.toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: fcColor(r.food_cost_pct, cibleFC) }}>
                      {r.food_cost_pct ? `${r.food_cost_pct}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold"
                      style={{ color: r.marge_pct && r.marge_pct >= 60 ? '#4ade80' : r.marge_pct && r.marge_pct >= 40 ? '#fbbf24' : '#f87171' }}>
                      {r.marge_pct ? `${r.marge_pct}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#a5b4fc' }}>
                      {r.coefficient ? `×${r.coefficient}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ONGLET OBJECTIFS */}
      {onglet === 'objectifs' && (
        <div className="max-w-md space-y-4">
          <p className="text-sm" style={{ color: '#4a6fa5' }}>
            Définissez vos objectifs mensuels. Ils seront utilisés comme références dans tous les graphes.
          </p>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Mois</label>
            <input type="month" value={formObj.mois.slice(0, 7)}
              onChange={e => setO('mois', e.target.value + '-01')} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Food cost cible (%)</label>
              <input type="number" step="0.5" value={formObj.food_cost_cible}
                onChange={e => setO('food_cost_cible', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Masse salariale cible (%)</label>
              <input type="number" step="0.5" value={formObj.masse_salariale_cible}
                onChange={e => setO('masse_salariale_cible', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Marge nette cible (%)</label>
              <input type="number" step="0.5" value={formObj.marge_nette_cible}
                onChange={e => setO('marge_nette_cible', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>CA cible (€)</label>
              <input type="number" value={formObj.ca_cible}
                onChange={e => setO('ca_cible', e.target.value)}
                placeholder="Optionnel" style={inputStyle} />
            </div>
          </div>
          <button onClick={handleObjectifs} disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Sauvegarde...' : 'Enregistrer les objectifs'}
          </button>
        </div>
      )}

      {/* Modal saisie mensuelle */}
      {showSaisie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Saisie mensuelle</h2>
              <button onClick={() => setShowSaisie(false)} style={{ color: '#4a6fa5' }}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Mois</label>
                <input type="month" value={formSaisie.mois.slice(0, 7)}
                  onChange={e => setS('mois', e.target.value + '-01')} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>CA total (€) *</label>
                  <input type="number" value={formSaisie.ca_total}
                    onChange={e => setS('ca_total', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Coût matières (€)</label>
                  <input type="number" value={formSaisie.cout_matieres}
                    onChange={e => setS('cout_matieres', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Masse salariale (€)</label>
                  <input type="number" value={formSaisie.masse_salariale}
                    onChange={e => setS('masse_salariale', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Nb couverts</label>
                  <input type="number" value={formSaisie.nb_couverts}
                    onChange={e => setS('nb_couverts', e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Calcul live */}
              {ca > 0 && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl"
                  style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: '#2d4a7a' }}>Food cost calculé</p>
                    <p className="text-lg font-bold" style={{ color: fcColor(fcLive, cibleFC) }}>
                      {fcLive ? `${fcLive}%` : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: '#2d4a7a' }}>Marge nette calculée</p>
                    <p className="text-lg font-bold"
                      style={{ color: margeLive && margeLive > 0 ? '#4ade80' : '#f87171' }}>
                      {margeLive ? `${margeLive}%` : '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => setShowSaisie(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
              <button onClick={handleSaisie} disabled={loading || !formSaisie.ca_total}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: !formSaisie.ca_total ? 0.4 : 1 }}>
                {loading ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
