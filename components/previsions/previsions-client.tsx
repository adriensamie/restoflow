'use client'

import { useState } from 'react'
import { Sparkles, Calendar, TrendingUp, Users, AlertTriangle, Sun, Cloud, CloudRain, Snowflake, X, ChevronRight } from 'lucide-react'
import { sauvegarderPrevision } from '@/lib/actions/previsions'

const METEO_CONFIG = {
  ensoleille: { label: 'Ensoleillé', icon: Sun, color: '#fbbf24', impact: '+15% couverts' },
  nuageux:    { label: 'Nuageux',    icon: Cloud, color: '#94a3b8', impact: 'Normal' },
  pluie:      { label: 'Pluie',      icon: CloudRain, color: '#60a5fa', impact: '-10% terrasse' },
  neige:      { label: 'Neige',      icon: Snowflake, color: '#a5b4fc', impact: '-25% couverts' },
}

const CONFIANCE_CONFIG = {
  haute:   { color: '#4ade80', bg: '#0a2d1a' },
  moyenne: { color: '#fbbf24', bg: '#1a1505' },
  basse:   { color: '#f87171', bg: '#1a0505' },
}

interface Prevision {
  id: string; date_prevision: string
  couverts_midi: number | null; couverts_soir: number | null; ca_prevu: number | null
  meteo_condition: string | null; meteo_temperature: number | null
  est_ferie: boolean; est_vacances: boolean; evenement_local: string | null
  confiance: string; produits_prioritaires: unknown
  couverts_reel_midi: number | null; couverts_reel_soir: number | null; ca_reel: number | null
}

interface Produit { produit_id: string; nom: string; categorie: string; quantite_actuelle: number; seuil_alerte: number; unite: string }

export function PrevisionsClient({ previsions, historiqueCA, produits }: {
  previsions: Prevision[], historiqueCA: any[], produits: Produit[]
}) {
  const [loading, setLoading] = useState(false)
  const [showGenerateur, setShowGenerateur] = useState(false)
  const [resultatIA, setResultatIA] = useState<any>(null)
  const [previsionSelectee, setPrevisionSelectee] = useState<Prevision | null>(null)
  const [form, setForm] = useState({
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // demain
    meteo: 'ensoleille',
    temperature: '18',
    estFerie: false,
    estVacances: false,
    evenementLocal: '',
  })
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const produitsAlerte = produits.filter(p => p.quantite_actuelle <= p.seuil_alerte)

  const handleGenerer = async () => {
    setLoading(true)
    setResultatIA(null)
    try {
      // Construire historique simplifié
      const historique = previsions
        .filter(p => p.ca_reel || p.couverts_reel_midi)
        .slice(0, 10)
        .map(p => ({
          date: p.date_prevision,
          couverts: (p.couverts_reel_midi || 0) + (p.couverts_reel_soir || 0),
          ca: p.ca_reel,
          meteo: p.meteo_condition,
          ferie: p.est_ferie,
          vacances: p.est_vacances,
        }))

      // Historique CA mensuel
      const histCA = historiqueCA.map(s => ({
        mois: s.mois, ca: s.ca_total, couverts: s.nb_couverts
      }))

      const res = await fetch('/api/ia/previsions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          historique: { journalier: historique, mensuel: histCA },
          meteo: { condition: form.meteo, temperature: parseInt(form.temperature) },
          estFerie: form.estFerie,
          estVacances: form.estVacances,
          evenementLocal: form.evenementLocal || null,
          produitsStock: produits.slice(0, 20),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setResultatIA(json.data)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSauvegarder = async () => {
    if (!resultatIA) return
    setLoading(true)
    try {
      await sauvegarderPrevision({
        date_prevision: form.date,
        couverts_midi: resultatIA.couverts_midi,
        couverts_soir: resultatIA.couverts_soir,
        ca_prevu: resultatIA.ca_prevu,
        meteo_condition: form.meteo,
        meteo_temperature: parseInt(form.temperature),
        est_ferie: form.estFerie,
        est_vacances: form.estVacances,
        evenement_local: form.evenementLocal || undefined,
        confiance: resultatIA.confiance,
        produits_prioritaires: resultatIA.produits_prioritaires,
      })
      setShowGenerateur(false)
      setResultatIA(null)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }

  const jourSemaine = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Prévisions IA</h1>
            <p className="text-sm" style={{ color: '#4a6fa5' }}>
              Météo · Historique · Événements · Stock
            </p>
          </div>
        </div>
        <button onClick={() => setShowGenerateur(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          <Sparkles size={15} />Générer une prévision
        </button>
      </div>

      {/* Alertes stocks */}
      {produitsAlerte.length > 0 && (
        <div className="p-4 rounded-xl" style={{ background: '#1a0a00', border: '1px solid #f97316' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} style={{ color: '#f97316' }} />
            <span className="text-sm font-semibold" style={{ color: '#f97316' }}>
              {produitsAlerte.length} produit{produitsAlerte.length > 1 ? 's' : ''} en stock critique
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {produitsAlerte.slice(0, 6).map(p => (
              <span key={p.produit_id} className="text-xs px-2 py-1 rounded-full"
                style={{ background: '#1a1505', color: '#fbbf24' }}>
                {p.nom} — {p.quantite_actuelle} {p.unite}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prévisions existantes */}
      {previsions.length === 0 ? (
        <div className="rounded-xl p-16 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <Sparkles size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#a5b4fc' }} />
          <p className="text-sm mb-1" style={{ color: '#4a6fa5' }}>Aucune prévision générée</p>
          <p className="text-xs" style={{ color: '#2d4a7a' }}>
            Cliquez sur "Générer une prévision" pour commencer
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: '#4a6fa5' }}>Prévisions récentes</h2>
          {previsions.slice(0, 14).map(p => {
            const conf = CONFIANCE_CONFIG[p.confiance as keyof typeof CONFIANCE_CONFIG] ?? CONFIANCE_CONFIG.moyenne
            const MeteoIcon = p.meteo_condition ? METEO_CONFIG[p.meteo_condition as keyof typeof METEO_CONFIG]?.icon : Sun
            const totalCouverts = (p.couverts_midi || 0) + (p.couverts_soir || 0)
            const totalReel = (p.couverts_reel_midi || 0) + (p.couverts_reel_soir || 0)
            const aReel = p.ca_reel || p.couverts_reel_midi

            return (
              <div key={p.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:border-blue-500/50 transition-all"
                style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}
                onClick={() => setPrevisionSelectee(p)}>

                {/* Date */}
                <div className="w-24 flex-shrink-0">
                  <p className="text-xs font-medium capitalize" style={{ color: '#e2e8f0' }}>
                    {jourSemaine(p.date_prevision)}
                  </p>
                  {p.est_ferie && (
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: '#1a1505', color: '#fbbf24' }}>Férié</span>
                  )}
                  {p.est_vacances && (
                    <span className="text-xs px-1.5 py-0.5 rounded ml-1"
                      style={{ background: '#0a1f3d', color: '#60a5fa' }}>Vacances</span>
                  )}
                </div>

                {/* Météo */}
                {MeteoIcon && <MeteoIcon size={16} style={{ color: p.meteo_condition ? METEO_CONFIG[p.meteo_condition as keyof typeof METEO_CONFIG]?.color : '#94a3b8' }} />}

                {/* Couverts prévus vs réels */}
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs" style={{ color: '#2d4a7a' }}>Couverts prévus</p>
                      <p className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                        {p.couverts_midi ?? '—'} + {p.couverts_soir ?? '—'}
                        <span className="text-xs ml-1" style={{ color: '#4a6fa5' }}>= {totalCouverts}</span>
                      </p>
                    </div>
                    {aReel && (
                      <div>
                        <p className="text-xs" style={{ color: '#2d4a7a' }}>Réel</p>
                        <p className="text-sm font-bold" style={{ color: '#4ade80' }}>
                          {totalReel} couverts
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CA */}
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#60a5fa' }}>
                    {p.ca_prevu ? `${p.ca_prevu.toLocaleString('fr-FR')} €` : '—'}
                  </p>
                  {p.ca_reel && (
                    <p className="text-xs" style={{ color: '#4ade80' }}>
                      Réel : {p.ca_reel.toLocaleString('fr-FR')} €
                    </p>
                  )}
                </div>

                {/* Confiance */}
                <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                  style={{ background: conf.bg, color: conf.color }}>
                  {p.confiance}
                </span>

                <ChevronRight size={14} style={{ color: '#2d4a7a' }} />
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL GÉNÉRATEUR */}
      {showGenerateur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a', maxHeight: '90vh' }}>

            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <div className="flex items-center gap-3">
                <Sparkles size={18} style={{ color: '#a5b4fc' }} />
                <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Générer une prévision</h2>
              </div>
              <button onClick={() => { setShowGenerateur(false); setResultatIA(null) }}
                style={{ color: '#4a6fa5' }}><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Date */}
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Date de prévision</label>
                <input type="date" value={form.date} onChange={e => setF('date', e.target.value)}
                  style={inputStyle} />
              </div>

              {/* Météo */}
              <div>
                <label className="text-xs block mb-2" style={{ color: '#4a6fa5' }}>Météo prévue</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(METEO_CONFIG).map(([k, v]) => (
                    <button key={k} onClick={() => setF('meteo', k)}
                      className="p-2.5 rounded-xl flex flex-col items-center gap-1 transition-all"
                      style={{
                        background: form.meteo === k ? '#0a1120' : 'transparent',
                        border: `1px solid ${form.meteo === k ? v.color : '#1e2d4a'}`,
                      }}>
                      <v.icon size={18} style={{ color: v.color }} />
                      <span className="text-xs" style={{ color: form.meteo === k ? v.color : '#4a6fa5' }}>
                        {v.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Température */}
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Température (°C)</label>
                <input type="number" value={form.temperature} onChange={e => setF('temperature', e.target.value)}
                  style={{ ...inputStyle, width: '120px' }} />
              </div>

              {/* Contexte */}
              <div className="flex gap-4">
                {[
                  { key: 'estFerie', label: 'Jour férié' },
                  { key: 'estVacances', label: 'Vacances scolaires' },
                ].map(item => (
                  <button key={item.key}
                    onClick={() => setF(item.key, !(form as any)[item.key])}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      background: (form as any)[item.key] ? '#0a1f3d' : '#0a1120',
                      border: `1px solid ${(form as any)[item.key] ? '#3b82f6' : '#1e2d4a'}`,
                      color: (form as any)[item.key] ? '#60a5fa' : '#4a6fa5',
                    }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center"
                      style={{ background: (form as any)[item.key] ? '#3b82f6' : '#1e2d4a' }}>
                      {(form as any)[item.key] && <span className="text-white text-xs">✓</span>}
                    </div>
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>
                  Événement local (optionnel)
                </label>
                <input value={form.evenementLocal} onChange={e => setF('evenementLocal', e.target.value)}
                  placeholder="Concert, match, marché..." style={inputStyle} />
              </div>

              {/* Résultat IA */}
              {resultatIA && (
                <div className="space-y-3 p-4 rounded-xl"
                  style={{ background: '#0a0d1a', border: '1px solid #4f46e5' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: '#a5b4fc' }}>
                      ✦ Prévision générée par Claude
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: CONFIANCE_CONFIG[resultatIA.confiance as keyof typeof CONFIANCE_CONFIG]?.bg, color: CONFIANCE_CONFIG[resultatIA.confiance as keyof typeof CONFIANCE_CONFIG]?.color }}>
                      Confiance : {resultatIA.confiance}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg" style={{ background: '#0d1526' }}>
                      <p className="text-xs mb-1" style={{ color: '#2d4a7a' }}>Midi</p>
                      <p className="text-xl font-bold" style={{ color: '#e2e8f0' }}>{resultatIA.couverts_midi}</p>
                      <p className="text-xs" style={{ color: '#4a6fa5' }}>couverts</p>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ background: '#0d1526' }}>
                      <p className="text-xs mb-1" style={{ color: '#2d4a7a' }}>Soir</p>
                      <p className="text-xl font-bold" style={{ color: '#e2e8f0' }}>{resultatIA.couverts_soir}</p>
                      <p className="text-xs" style={{ color: '#4a6fa5' }}>couverts</p>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ background: '#0d1526' }}>
                      <p className="text-xs mb-1" style={{ color: '#2d4a7a' }}>CA prévu</p>
                      <p className="text-lg font-bold" style={{ color: '#4ade80' }}>
                        {resultatIA.ca_prevu?.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                  </div>

                  {resultatIA.analyse && (
                    <p className="text-xs p-3 rounded-lg" style={{ background: '#0d1526', color: '#94a3b8', lineHeight: '1.6' }}>
                      {resultatIA.analyse}
                    </p>
                  )}

                  {resultatIA.produits_prioritaires?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: '#f97316' }}>
                        Produits à commander en priorité :
                      </p>
                      <div className="space-y-1.5">
                        {resultatIA.produits_prioritaires.map((p: any, i: number) => (
                          <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                            style={{ background: '#0d1526' }}>
                            <span className="text-xs font-medium" style={{ color: '#e2e8f0' }}>{p.nom}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: '#4a6fa5' }}>{p.raison}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: p.urgence === 'haute' ? '#1a0505' : '#0a1120', color: p.urgence === 'haute' ? '#f87171' : '#4a6fa5' }}>
                                {p.urgence}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resultatIA.alertes?.length > 0 && (
                    <div className="space-y-1">
                      {resultatIA.alertes.map((a: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs"
                          style={{ color: '#fbbf24' }}>
                          <AlertTriangle size={11} />
                          {a}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => { setShowGenerateur(false); setResultatIA(null) }}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Fermer</button>

              {!resultatIA ? (
                <button onClick={handleGenerer} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', opacity: loading ? 0.6 : 1 }}>
                  <Sparkles size={14} />
                  {loading ? 'Claude analyse...' : 'Générer avec Claude'}
                </button>
              ) : (
                <button onClick={handleSauvegarder} disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #15803d, #4ade80)', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Sauvegarde...' : '✓ Sauvegarder'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
