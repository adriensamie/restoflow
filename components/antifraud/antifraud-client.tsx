'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, TrendingDown, Users, Clock, Settings, Plus, X, CheckCircle } from 'lucide-react'
import { sauvegarderConfigCaisse, ajouterEventManuel } from '@/lib/actions/antifraud'

const EVENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  annulation_ticket: { label: 'Annulation',    color: '#f87171', bg: '#1a0505' },
  remise:            { label: 'Remise',         color: '#fbbf24', bg: '#1a1505' },
  paiement:          { label: 'Paiement',       color: '#4ade80', bg: '#0a2d1a' },
  ouverture_ticket:  { label: 'Ouverture',      color: '#60a5fa', bg: '#0a1f3d' },
  ouverture_caisse:  { label: 'Ouv. caisse',    color: '#f97316', bg: '#1a0a00' },
  correction:        { label: 'Correction',     color: '#c4b5fd', bg: '#0f051a' },
  offert:            { label: 'Offert',         color: '#a5b4fc', bg: '#0a0a1a' },
}

const SOURCES = [
  { value: 'manuel', label: 'Saisie manuelle' },
  { value: '6xpos', label: '6Xpos' },
  { value: 'zelty', label: 'Zelty' },
  { value: 'laddition', label: "L'Addition" },
  { value: 'lightspeed', label: 'Lightspeed' },
  { value: 'ticketack', label: 'Ticketack' },
  { value: 'sunday', label: 'Sunday' },
  { value: 'sumeria', label: 'Sumeria' },
]

interface Event {
  id: string; event_type: string; montant: number; mode_paiement: string | null
  employe_nom: string | null; service: string | null; motif: string | null
  nb_couverts: number | null; source: string; terminal_id: string | null
  event_at: string
}

export function AntifraudClient({ events, config }: { events: Event[], config: any }) {
  const [onglet, setOnglet] = useState<'journal' | 'stats' | 'config'>('journal')
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois'>('mois')
  const [showManuel, setShowManuel] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [loading, setLoading] = useState(false)

  // Calculs stats
  const annulations = events.filter(e => e.event_type === 'annulation_ticket')
  const remises = events.filter(e => e.event_type === 'remise')
  const paiements = events.filter(e => e.event_type === 'paiement')
  const montantAnnulations = annulations.reduce((a, e) => a + (e.montant || 0), 0)
  const montantRemises = remises.reduce((a, e) => a + (e.montant || 0), 0)
  const caTotalPaiements = paiements.reduce((a, e) => a + (e.montant || 0), 0)
  const seuil = config?.seuil_alerte_annulation ?? 50

  // Stats par employé
  const parEmploye: Record<string, { nom: string; annulations: number; montant: number }> = {}
  annulations.forEach(e => {
    const key = e.employe_nom || 'Inconnu'
    if (!parEmploye[key]) parEmploye[key] = { nom: key, annulations: 0, montant: 0 }
    parEmploye[key].annulations++
    parEmploye[key].montant += e.montant || 0
  })
  const classementEmployes = Object.values(parEmploye).sort((a, b) => b.montant - a.montant)

  // Alertes : annulations > seuil
  const alertes = annulations.filter(e => e.montant >= seuil)

  // Filtre journal par type
  const [filtreType, setFiltreType] = useState('tous')
  const eventsFiltres = events.filter(e => filtreType === 'tous' || e.event_type === filtreType)

  // Form manuel
  const [formManuel, setFormManuel] = useState({
    event_type: 'annulation_ticket', montant: '', employe_nom: '',
    motif: '', service: 'midi', nb_couverts: ''
  })
  const setM = (k: string, v: string) => setFormManuel(f => ({ ...f, [k]: v }))

  // Form config
  const [formConfig, setFormConfig] = useState({
    source: config?.source ?? 'manuel',
    api_key: config?.api_key ?? '',
    webhook_secret: config?.webhook_secret ?? '',
    api_endpoint: config?.api_endpoint ?? '',
    seuil_alerte_annulation: config?.seuil_alerte_annulation?.toString() ?? '50',
    alertes_actives: config?.alertes_actives ?? true,
  })
  const setC = (k: string, v: any) => setFormConfig(f => ({ ...f, [k]: v }))

  const handleSaveConfig = async () => {
    setLoading(true)
    try {
      await sauvegarderConfigCaisse({
        source: formConfig.source,
        api_key: formConfig.api_key || undefined,
        webhook_secret: formConfig.webhook_secret || undefined,
        api_endpoint: formConfig.api_endpoint || undefined,
        seuil_alerte_annulation: parseFloat(formConfig.seuil_alerte_annulation),
        alertes_actives: formConfig.alertes_actives,
      })
      setShowConfig(false)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleManuel = async () => {
    if (!formManuel.montant) return
    setLoading(true)
    try {
      await ajouterEventManuel({
        event_type: formManuel.event_type,
        montant: parseFloat(formManuel.montant),
        employe_nom: formManuel.employe_nom || undefined,
        motif: formManuel.motif || undefined,
        service: formManuel.service,
        nb_couverts: formManuel.nb_couverts ? parseInt(formManuel.nb_couverts) : undefined,
      })
      setShowManuel(false)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c0000, #dc2626)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Anti-Fraude Caisse</h1>
            <p className="text-sm" style={{ color: '#4a6fa5' }}>
              Traçabilité temps réel · {events.length} événements
              {config?.statut_connexion === 'connecte' && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#0a2d1a', color: '#4ade80' }}>
                  ● Caisse connectée
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>
            <Settings size={14} />Config caisse
          </button>
          <button onClick={() => setShowManuel(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <Plus size={14} />Saisie manuelle
          </button>
        </div>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="p-4 rounded-xl" style={{ background: '#1a0505', border: '1px solid #dc2626' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} style={{ color: '#f87171' }} />
            <span className="text-sm font-semibold" style={{ color: '#f87171' }}>
              {alertes.length} alerte{alertes.length > 1 ? 's' : ''} — Annulation(s) {'>'} {seuil}€
            </span>
          </div>
          <div className="space-y-1">
            {alertes.slice(0, 3).map(a => (
              <p key={a.id} className="text-xs" style={{ color: '#fca5a5' }}>
                {new Date(a.event_at).toLocaleString('fr-FR')} ·{' '}
                <strong>{a.montant.toFixed(2)} €</strong>
                {a.employe_nom && ` · ${a.employe_nom}`}
                {a.motif && ` · "${a.motif}"`}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'CA total', value: `${caTotalPaiements.toLocaleString('fr-FR')} €`, color: '#4ade80', icon: TrendingDown },
          { label: 'Annulations', value: `${montantAnnulations.toFixed(2)} €`, sub: `${annulations.length} opération${annulations.length > 1 ? 's' : ''}`, color: '#f87171', icon: AlertTriangle },
          { label: 'Remises', value: `${montantRemises.toFixed(2)} €`, sub: `${remises.length} opération${remises.length > 1 ? 's' : ''}`, color: '#fbbf24', icon: TrendingDown },
          { label: 'Pct. annulations', value: caTotalPaiements > 0 ? `${((montantAnnulations / caTotalPaiements) * 100).toFixed(1)}%` : '—', color: montantAnnulations / caTotalPaiements > 0.05 ? '#f87171' : '#4ade80', icon: Shield },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <p className="text-xs mb-1" style={{ color: '#4a6fa5' }}>{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            {(k as any).sub && <p className="text-xs mt-0.5" style={{ color: '#2d4a7a' }}>{(k as any).sub}</p>}
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0a1120', width: 'fit-content' }}>
        {[
          { key: 'journal', label: 'Journal temps réel' },
          { key: 'stats', label: 'Stats par employé' },
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

      {/* JOURNAL */}
      {onglet === 'journal' && (
        <div className="space-y-3">
          {/* Filtre type */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFiltreType('tous')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: filtreType === 'tous' ? '#1e2d4a' : '#0a1120', color: filtreType === 'tous' ? '#60a5fa' : '#4a6fa5', border: '1px solid #1e2d4a' }}>
              Tous ({events.length})
            </button>
            {['annulation_ticket', 'remise', 'paiement', 'correction', 'offert'].map(t => {
              const conf = EVENT_CONFIG[t]
              const count = events.filter(e => e.event_type === t).length
              if (count === 0) return null
              return (
                <button key={t} onClick={() => setFiltreType(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: filtreType === t ? conf.bg : '#0a1120',
                    color: filtreType === t ? conf.color : '#4a6fa5',
                    border: `1px solid ${filtreType === t ? conf.color : '#1e2d4a'}`
                  }}>
                  {conf.label} ({count})
                </button>
              )
            })}
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0a1628', borderBottom: '1px solid #1e2d4a' }}>
                  {['Heure', 'Type', 'Montant', 'Employé', 'Service', 'Motif', 'Source'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#3b5280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eventsFiltres.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: '#2d4a7a' }}>
                    Aucun événement
                  </td></tr>
                )}
                {eventsFiltres.slice(0, 100).map((e, i) => {
                  const conf = EVENT_CONFIG[e.event_type] ?? EVENT_CONFIG.paiement
                  const isAlerte = e.event_type === 'annulation_ticket' && e.montant >= seuil
                  return (
                    <tr key={e.id} style={{
                      background: isAlerte ? '#0f0505' : i % 2 === 0 ? '#0d1526' : '#0a1120',
                      borderBottom: '1px solid #1a2540'
                    }}>
                      <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#4a6fa5' }}>
                        {new Date(e.event_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {isAlerte && <AlertTriangle size={11} style={{ color: '#f87171' }} />}
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: conf.bg, color: conf.color }}>{conf.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm font-bold"
                        style={{ color: e.event_type === 'paiement' ? '#4ade80' : e.event_type === 'annulation_ticket' ? '#f87171' : '#fbbf24' }}>
                        {e.montant > 0 ? `${e.montant.toFixed(2)} €` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: '#e2e8f0' }}>{e.employe_nom || '—'}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: '#4a6fa5' }}>{e.service || '—'}</td>
                      <td className="px-4 py-2.5 text-xs max-w-32 truncate" style={{ color: '#4a6fa5' }}>{e.motif || '—'}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: '#2d4a7a' }}>{e.source}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATS EMPLOYÉS */}
      {onglet === 'stats' && (
        <div className="space-y-3">
          {classementEmployes.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <Users size={32} className="mx-auto mb-2 opacity-20" style={{ color: '#60a5fa' }} />
              <p className="text-sm" style={{ color: '#2d4a7a' }}>Aucune annulation sur cette période</p>
            </div>
          ) : (
            <>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>
                Classement par montant total annulé — plus élevé = plus suspect
              </p>
              {classementEmployes.map((emp, i) => {
                const pct = montantAnnulations > 0 ? (emp.montant / montantAnnulations) * 100 : 0
                return (
                  <div key={emp.nom} className="p-4 rounded-xl"
                    style={{ background: '#0d1526', border: `1px solid ${i === 0 && emp.montant > seuil * 2 ? '#dc2626' : '#1e2d4a'}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: i === 0 ? '#1a0505' : '#0a1120', color: i === 0 ? '#f87171' : '#4a6fa5' }}>
                          #{i + 1}
                        </div>
                        <span className="font-medium text-sm" style={{ color: '#e2e8f0' }}>{emp.nom}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: '#f87171' }}>
                          {emp.montant.toFixed(2)} €
                        </p>
                        <p className="text-xs" style={{ color: '#4a6fa5' }}>
                          {emp.annulations} annulation{emp.annulations > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {/* Barre progression */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2d4a' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: i === 0 ? '#dc2626' : '#3b82f6' }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#2d4a7a' }}>
                      {Math.round(pct)}% des annulations totales
                    </p>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* MODAL CONFIG */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Configuration caisse</h2>
              <button onClick={() => setShowConfig(false)} style={{ color: '#4a6fa5' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Logiciel de caisse</label>
                <select value={formConfig.source} onChange={e => setC('source', e.target.value)} style={inputStyle}>
                  {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {formConfig.source !== 'manuel' && (
                <>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>URL Webhook RestoFlow</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
                      style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#60a5fa' }}>
                      https://restoflow.fr/api/caisse/webhook?source={formConfig.source}&org=VOTRE_ORG_ID
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#2d4a7a' }}>
                      Copiez cette URL dans votre logiciel de caisse
                    </p>
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Clé API (optionnel)</label>
                    <input type="password" value={formConfig.api_key}
                      onChange={e => setC('api_key', e.target.value)}
                      placeholder="sk_..." style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Webhook Secret (optionnel)</label>
                    <input type="password" value={formConfig.webhook_secret}
                      onChange={e => setC('webhook_secret', e.target.value)}
                      placeholder="whsec_..." style={inputStyle} />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>
                  Seuil alerte annulation (€)
                </label>
                <input type="number" value={formConfig.seuil_alerte_annulation}
                  onChange={e => setC('seuil_alerte_annulation', e.target.value)} style={inputStyle} />
                <p className="text-xs mt-1" style={{ color: '#2d4a7a' }}>
                  Alerte si une annulation dépasse ce montant
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setC('alertes_actives', !formConfig.alertes_actives)}
                  className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: formConfig.alertes_actives ? '#dc2626' : '#1e2d4a' }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: formConfig.alertes_actives ? '22px' : '2px' }} />
                </button>
                <span className="text-sm" style={{ color: '#e2e8f0' }}>Alertes actives</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => setShowConfig(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
              <button onClick={handleSaveConfig} disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #7c0000, #dc2626)', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SAISIE MANUELLE */}
      {showManuel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Saisie manuelle</h2>
              <button onClick={() => setShowManuel(false)} style={{ color: '#4a6fa5' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Type d'événement</label>
                  <select value={formManuel.event_type} onChange={e => setM('event_type', e.target.value)} style={inputStyle}>
                    {Object.entries(EVENT_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Montant (€)</label>
                  <input type="number" step="0.01" value={formManuel.montant}
                    onChange={e => setM('montant', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Employé</label>
                  <input value={formManuel.employe_nom}
                    onChange={e => setM('employe_nom', e.target.value)}
                    placeholder="Nom" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Service</label>
                  <select value={formManuel.service} onChange={e => setM('service', e.target.value)} style={inputStyle}>
                    <option value="midi">Midi</option>
                    <option value="soir">Soir</option>
                    <option value="journee">Journée</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Motif</label>
                <input value={formManuel.motif} onChange={e => setM('motif', e.target.value)}
                  placeholder="Raison de l'annulation..." style={inputStyle} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => setShowManuel(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
              <button onClick={handleManuel} disabled={loading || !formManuel.montant}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: !formManuel.montant ? 0.4 : 1 }}>
                {loading ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
