'use client'

import { useState, useTransition } from 'react'
import { ClipboardList, Plus, AlertTriangle, CheckCircle, X, Thermometer, Droplets, Package, Calendar, Flame, Bug, MoreHorizontal, Download } from 'lucide-react'
import { creerReleve, initTemplatesDefaut, creerTemplate } from '@/lib/actions/haccp'

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  temperature:   { label: 'Température',    icon: Thermometer, color: '#f97316', bg: '#1a0a00' },
  nettoyage:     { label: 'Nettoyage',      icon: Droplets,    color: '#60a5fa', bg: '#0a1f3d' },
  reception:     { label: 'Réception',      icon: Package,     color: '#4ade80', bg: '#0a2d1a' },
  dlc:           { label: 'DLC',            icon: Calendar,    color: '#fbbf24', bg: '#1a1505' },
  huile_friture: { label: 'Huile friture',  icon: Flame,       color: '#f87171', bg: '#1a0505' },
  pest_control:  { label: 'Nuisibles',      icon: Bug,         color: '#a78bfa', bg: '#0f051a' },
  autre:         { label: 'Autre',          icon: MoreHorizontal, color: '#94a3b8', bg: '#1e2d4a' },
}

const RESULTAT_CONFIG = {
  conforme:         { label: 'Conforme',          color: '#4ade80', bg: '#0a2d1a', icon: CheckCircle },
  non_conforme:     { label: 'Non conforme',       color: '#f87171', bg: '#1a0505', icon: AlertTriangle },
  action_corrective:{ label: 'Action corrective',  color: '#fbbf24', bg: '#1a1505', icon: AlertTriangle },
}

interface Template {
  id: string; nom: string; type: string; description: string | null
  frequence: string; valeur_min: number | null; valeur_max: number | null
  unite: string | null
}
interface Releve {
  id: string; nom_controle: string; type: string; valeur: number | null
  unite: string | null; resultat: string; action_corrective: string | null
  zone: string | null; employe_nom: string | null; created_at: string
}

export function HaccpClient({ templates, releves }: {
  templates: Template[], releves: Releve[]
}) {
  const [isPending, startTransition] = useTransition()
  const [onglet, setOnglet] = useState<'checklist' | 'historique' | 'plan'>('checklist')
  const [showReleve, setShowReleve] = useState(false)
  const [templateSelectionne, setTemplateSelectionne] = useState<Template | null>(null)
  const [relevesLocaux, setRelevesLocaux] = useState<Releve[]>(releves)
  const [initLoading, setInitLoading] = useState(false)
  const [msgInit, setMsgInit] = useState('')

  // Form relevé
  const [form, setForm] = useState({
    nom_controle: '', type: 'temperature', valeur: '',
    unite: '°C', resultat: 'conforme', action_corrective: '',
    zone: '', employe_nom: '',
  })
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const ouvrirReleve = (t: Template | null) => {
    setTemplateSelectionne(t)
    if (t) {
      setForm(f => ({
        ...f,
        nom_controle: t.nom,
        type: t.type,
        unite: t.unite || '°C',
        resultat: 'conforme',
        valeur: '', action_corrective: '', zone: '', employe_nom: '',
      }))
    } else {
      setForm({ nom_controle: '', type: 'temperature', valeur: '', unite: '°C', resultat: 'conforme', action_corrective: '', zone: '', employe_nom: '' })
    }
    setShowReleve(true)
  }

  // Vérification conformité température
  const checkConformite = () => {
    if (!templateSelectionne || !form.valeur) return null
    const val = parseFloat(form.valeur)
    const { valeur_min, valeur_max } = templateSelectionne
    if (valeur_min !== null && val < valeur_min) return 'non_conforme'
    if (valeur_max !== null && val > valeur_max) return 'non_conforme'
    return 'conforme'
  }
  const autoResultat = checkConformite()

  const handleSaveReleve = () => {
    if (!form.nom_controle) return
    startTransition(async () => {
      try {
        const resultat = autoResultat || form.resultat
        const result = await creerReleve({
          template_id: templateSelectionne?.id,
          nom_controle: form.nom_controle,
          type: form.type,
          valeur: form.valeur ? parseFloat(form.valeur) : undefined,
          unite: form.unite || undefined,
          resultat,
          action_corrective: form.action_corrective || undefined,
          zone: form.zone || undefined,
          employe_nom: form.employe_nom || undefined,
        })
        if (result) setRelevesLocaux(prev => [result, ...prev])
        setShowReleve(false)
      } catch (e) {
        console.error(e)
      }
    })
  }

  const handleInitTemplates = async () => {
    setInitLoading(true)
    try {
      await initTemplatesDefaut()
      setMsgInit('✓ Templates par défaut créés')
    } catch (e: any) {
      setMsgInit('Erreur : ' + e.message)
    } finally {
      setInitLoading(false)
    }
  }

  // Stats du jour
  const aujourd = new Date().toISOString().slice(0, 10)
  const relevesAujourdhui = relevesLocaux.filter(r => r.created_at?.startsWith(aujourd))
  const nonConformes = relevesLocaux.filter(r => r.resultat === 'non_conforme' || r.resultat === 'action_corrective')
  const taux = relevesLocaux.length > 0
    ? Math.round((relevesLocaux.filter(r => r.resultat === 'conforme').length / relevesLocaux.length) * 100) : 100

  // Templates par fréquence
  const quotidiens = templates.filter(t => t.frequence === 'quotidien')
  const hebdos = templates.filter(t => t.frequence === 'hebdo')
  const autres = templates.filter(t => !['quotidien', 'hebdo'].includes(t.frequence))

  // Relevés déjà faits aujourd'hui
  const templatesFaitsAujourdhui = new Set(
    relevesAujourdhui.map(r => r.nom_controle)
  )

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }

  // Export CSV
  const handleExport = () => {
    const rows = [
      ['Date', 'Contrôle', 'Type', 'Valeur', 'Unité', 'Résultat', 'Action corrective', 'Zone', 'Employé'],
      ...relevesLocaux.map(r => [
        new Date(r.created_at).toLocaleString('fr-FR'),
        r.nom_controle, r.type,
        r.valeur ?? '', r.unite ?? '',
        r.resultat, r.action_corrective ?? '',
        r.zone ?? '', r.employe_nom ?? ''
      ])
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `haccp_${aujourd}.csv`; a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
            <ClipboardList size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>HACCP</h1>
            <p className="text-sm" style={{ color: '#4a6fa5' }}>Traçabilité & Conformité alimentaire</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>
            <Download size={14} />Export CSV
          </button>
          <button onClick={() => ouvrirReleve(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
            <Plus size={16} />Nouveau relevé
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Taux conformité 7j', value: `${taux}%`, color: taux >= 95 ? '#4ade80' : taux >= 80 ? '#fbbf24' : '#f87171' },
          { label: 'Relevés aujourd\'hui', value: relevesAujourdhui.length, color: '#60a5fa' },
          { label: 'Non conformes 7j', value: nonConformes.length, color: nonConformes.length > 0 ? '#f87171' : '#4ade80' },
          { label: 'Total relevés 7j', value: relevesLocaux.length, color: '#a5b4fc' },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-xl"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <p className="text-xs mb-1" style={{ color: '#4a6fa5' }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Alertes non conformes */}
      {nonConformes.length > 0 && (
        <div className="p-4 rounded-xl" style={{ background: '#1a0505', border: '1px solid #dc2626' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} style={{ color: '#f87171' }} />
            <span className="text-sm font-semibold" style={{ color: '#f87171' }}>
              {nonConformes.length} non-conformité{nonConformes.length > 1 ? 's' : ''} sur 7 jours
            </span>
          </div>
          {nonConformes.slice(0, 3).map(r => (
            <p key={r.id} className="text-xs mb-1" style={{ color: '#fca5a5' }}>
              {new Date(r.created_at).toLocaleDateString('fr-FR')} · {r.nom_controle}
              {r.valeur !== null && ` · ${r.valeur}${r.unite || ''}`}
              {r.action_corrective && ` → ${r.action_corrective}`}
            </p>
          ))}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0a1120', width: 'fit-content' }}>
        {[
          { key: 'checklist', label: 'Checklist du jour' },
          { key: 'historique', label: 'Historique' },
          { key: 'plan', label: 'Plan HACCP' },
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key as any)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: onglet === o.key ? '#1e2d4a' : 'transparent',
              color: onglet === o.key ? '#4ade80' : '#4a6fa5',
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* CHECKLIST DU JOUR */}
      {onglet === 'checklist' && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <ClipboardList size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#4ade80' }} />
              <p className="text-sm mb-3" style={{ color: '#4a6fa5' }}>Aucun plan HACCP configuré</p>
              <button onClick={handleInitTemplates} disabled={initLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                {initLoading ? 'Initialisation...' : '✦ Créer les contrôles par défaut'}
              </button>
              {msgInit && <p className="text-xs mt-2" style={{ color: '#4ade80' }}>{msgInit}</p>}
            </div>
          ) : (
            <>
              {/* Quotidiens */}
              {quotidiens.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#3b5280' }}>
                    Contrôles quotidiens — {relevesAujourdhui.length}/{quotidiens.length} effectués
                  </p>
                  <div className="space-y-2">
                    {quotidiens.map(t => {
                      const fait = templatesFaitsAujourdhui.has(t.nom)
                      const typeConf = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.autre
                      const Icon = typeConf.icon
                      return (
                        <div key={t.id}
                          className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:border-green-500/30 transition-all"
                          style={{ background: fait ? '#0a1a0a' : '#0d1526', border: `1px solid ${fait ? '#15803d' : '#1e2d4a'}` }}
                          onClick={() => !fait && ouvrirReleve(t)}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: fait ? '#0a2d1a' : typeConf.bg }}>
                            {fait
                              ? <CheckCircle size={16} style={{ color: '#4ade80' }} />
                              : <Icon size={16} style={{ color: typeConf.color }} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: fait ? '#4ade80' : '#e2e8f0' }}>
                              {t.nom}
                            </p>
                            <p className="text-xs" style={{ color: '#4a6fa5' }}>
                              {t.description}
                              {t.valeur_min !== null && t.valeur_max !== null && ` · ${t.valeur_min} à ${t.valeur_max}${t.unite}`}
                              {t.valeur_max !== null && t.valeur_min === null && ` · max ${t.valeur_max}${t.unite}`}
                            </p>
                          </div>
                          {fait
                            ? <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#0a2d1a', color: '#4ade80' }}>✓ Fait</span>
                            : <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#1e2d4a', color: '#94a3b8' }}>À faire</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Hebdos */}
              {hebdos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#3b5280' }}>
                    Contrôles hebdomadaires
                  </p>
                  <div className="space-y-2">
                    {hebdos.map(t => {
                      const typeConf = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.autre
                      const Icon = typeConf.icon
                      return (
                        <div key={t.id}
                          className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all"
                          style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}
                          onClick={() => ouvrirReleve(t)}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: typeConf.bg }}>
                            <Icon size={16} style={{ color: typeConf.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{t.nom}</p>
                            <p className="text-xs" style={{ color: '#4a6fa5' }}>{t.description}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#1e2d4a', color: '#60a5fa' }}>Hebdo</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* HISTORIQUE */}
      {onglet === 'historique' && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#0a1628', borderBottom: '1px solid #1e2d4a' }}>
                {['Date/heure', 'Contrôle', 'Type', 'Valeur', 'Résultat', 'Action corrective', 'Employé'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#3b5280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relevesLocaux.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: '#2d4a7a' }}>
                  Aucun relevé cette semaine
                </td></tr>
              )}
              {relevesLocaux.map((r, i) => {
                const resConf = RESULTAT_CONFIG[r.resultat as keyof typeof RESULTAT_CONFIG] ?? RESULTAT_CONFIG.conforme
                const typeConf = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.autre
                const ResIcon = resConf.icon
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderBottom: '1px solid #1a2540' }}>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#4a6fa5' }}>
                      {new Date(r.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium" style={{ color: '#e2e8f0' }}>{r.nom_controle}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: typeConf.bg, color: typeConf.color }}>{typeConf.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold"
                      style={{ color: r.valeur !== null ? '#e2e8f0' : '#2d4a7a' }}>
                      {r.valeur !== null ? `${r.valeur}${r.unite || ''}` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <ResIcon size={12} style={{ color: resConf.color }} />
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: resConf.bg, color: resConf.color }}>{resConf.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs max-w-32 truncate" style={{ color: '#fbbf24' }}>
                      {r.action_corrective || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#4a6fa5' }}>{r.employe_nom || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PLAN HACCP */}
      {onglet === 'plan' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>
              {templates.length} contrôles configurés
            </p>
            {templates.length === 0 && (
              <button onClick={handleInitTemplates} disabled={initLoading}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                {initLoading ? '...' : 'Initialiser par défaut'}
              </button>
            )}
          </div>
          {templates.map(t => {
            const typeConf = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.autre
            const Icon = typeConf.icon
            return (
              <div key={t.id} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: typeConf.bg }}>
                  <Icon size={16} style={{ color: typeConf.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{t.nom}</p>
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>{t.description}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {t.valeur_min !== null || t.valeur_max !== null ? (
                    <span style={{ color: '#fbbf24' }}>
                      {t.valeur_min !== null && `${t.valeur_min}`}
                      {t.valeur_min !== null && t.valeur_max !== null && ' → '}
                      {t.valeur_max !== null && `${t.valeur_max}`}
                      {t.unite}
                    </span>
                  ) : null}
                  <span className="px-2 py-0.5 rounded-full capitalize"
                    style={{ background: '#1e2d4a', color: '#60a5fa' }}>{t.frequence}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL RELEVÉ */}
      {showReleve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>
                {templateSelectionne ? templateSelectionne.nom : 'Nouveau relevé'}
              </h2>
              <button onClick={() => setShowReleve(false)} style={{ color: '#4a6fa5' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {!templateSelectionne && (
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Nom du contrôle *</label>
                  <input value={form.nom_controle} onChange={e => setF('nom_controle', e.target.value)} style={inputStyle} />
                </div>
              )}

              {!templateSelectionne && (
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Type</label>
                  <select value={form.type} onChange={e => setF('type', e.target.value)} style={inputStyle}>
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Valeur mesurée */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>
                    Valeur mesurée
                    {templateSelectionne && templateSelectionne.valeur_min !== null && templateSelectionne.valeur_max !== null &&
                      ` (${templateSelectionne.valeur_min}–${templateSelectionne.valeur_max}${templateSelectionne.unite})`}
                  </label>
                  <input type="number" step="0.1" value={form.valeur}
                    onChange={e => setF('valeur', e.target.value)}
                    placeholder={templateSelectionne?.unite || ''}
                    style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Unité</label>
                  <input value={form.unite} onChange={e => setF('unite', e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Auto-conformité */}
              {autoResultat && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: autoResultat === 'conforme' ? '#0a2d1a' : '#1a0505', border: `1px solid ${autoResultat === 'conforme' ? '#15803d' : '#dc2626'}` }}>
                  {autoResultat === 'conforme'
                    ? <CheckCircle size={16} style={{ color: '#4ade80' }} />
                    : <AlertTriangle size={16} style={{ color: '#f87171' }} />}
                  <span className="text-sm font-medium" style={{ color: autoResultat === 'conforme' ? '#4ade80' : '#f87171' }}>
                    {autoResultat === 'conforme' ? '✓ Conforme' : '⚠ Hors plage — non conforme'}
                  </span>
                </div>
              )}

              {/* Résultat manuel si pas de template */}
              {!templateSelectionne && (
                <div>
                  <label className="text-xs block mb-2" style={{ color: '#4a6fa5' }}>Résultat</label>
                  <div className="flex gap-2">
                    {Object.entries(RESULTAT_CONFIG).map(([k, v]) => (
                      <button key={k} onClick={() => setF('resultat', k)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: form.resultat === k ? v.bg : '#0a1120',
                          color: form.resultat === k ? v.color : '#4a6fa5',
                          border: `1px solid ${form.resultat === k ? v.color : '#1e2d4a'}`
                        }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(autoResultat === 'non_conforme' || form.resultat !== 'conforme') && (
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#fbbf24' }}>Action corrective *</label>
                  <input value={form.action_corrective}
                    onChange={e => setF('action_corrective', e.target.value)}
                    placeholder="Décrivez l'action prise..." style={inputStyle} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Zone / Équipement</label>
                  <input value={form.zone} onChange={e => setF('zone', e.target.value)}
                    placeholder="Cuisine, Frigo 1..." style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Employé</label>
                  <input value={form.employe_nom} onChange={e => setF('employe_nom', e.target.value)}
                    placeholder="Votre nom" style={inputStyle} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => setShowReleve(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
              <button onClick={handleSaveReleve} disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                {isPending ? 'Enregistrement...' : '✓ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
