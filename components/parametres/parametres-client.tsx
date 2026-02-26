'use client'

import { useState, useTransition } from 'react'
import { Settings, Save, Check, Building2, Phone, Mail, FileText, TrendingDown, Globe, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import { sauvegarderParametres } from '@/lib/actions/parametres'
import { reinitialiserApplication } from '@/lib/actions/reset'

const ONGLETS = [
  { key: 'general', label: 'Général', icon: Building2 },
  { key: 'fiscal', label: 'Fiscal & TVA', icon: FileText },
  { key: 'objectifs', label: 'Objectifs', icon: TrendingDown },
  { key: 'regional', label: 'Régional', icon: Globe },
  { key: 'danger', label: 'Zone danger', icon: Trash2 },
]

export function ParametresClient({ organisation }: { organisation: any }) {
  const [onglet, setOnglet] = useState('general')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [resetDone, setResetDone] = useState(false)

  const [form, setForm] = useState({
    nom: organisation?.nom || '',
    adresse: organisation?.adresse || '',
    telephone: organisation?.telephone || '',
    email: organisation?.email || '',
    siret: organisation?.siret || '',
    tva_intracom: organisation?.tva_intracom || '',
    taux_tva_defaut: organisation?.taux_tva_defaut || 10,
    objectif_food_cost: organisation?.objectif_food_cost || 30,
    timezone: organisation?.timezone || 'Europe/Paris',
    devise: organisation?.devise || 'EUR',
    nb_couverts_moyen: organisation?.nb_couverts_moyen || 50,
  })

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    startTransition(async () => {
      try {
        await sauvegarderParametres(form)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (e) { console.error(e) }
    })
  }

  const handleReset = () => {
    if (confirmText !== 'REINITIALISER') return
    startTransition(async () => {
      try {
        await reinitialiserApplication()
        setResetDone(true)
        setConfirmReset(false)
        setConfirmText('')
      } catch (e) { console.error(e) }
    })
  }

  const inputStyle = {
    width: '100%', background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px', padding: '10px 14px',
    outline: 'none', fontSize: '14px',
  }
  const labelStyle = { fontSize: '13px', color: '#4a6fa5', display: 'block', marginBottom: '6px' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Paramètres</h1>
            <p className="text-sm" style={{ color: '#4a6fa5' }}>Configuration de votre restaurant</p>
          </div>
        </div>
        {onglet !== 'danger' && (
          <button onClick={handleSave} disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: saved ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', opacity: isPending ? 0.6 : 1 }}>
            {saved ? <><Check size={14} />Sauvegardé</> : isPending ? 'Sauvegarde...' : <><Save size={14} />Sauvegarder</>}
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="flex flex-col gap-1 flex-shrink-0" style={{ width: '200px' }}>
          {ONGLETS.map(o => {
            const Icon = o.icon
            const isDanger = o.key === 'danger'
            return (
              <button key={o.key} onClick={() => setOnglet(o.key)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all"
                style={{
                  background: onglet === o.key ? (isDanger ? '#1a0505' : '#0a1f3d') : 'transparent',
                  color: onglet === o.key ? (isDanger ? '#f87171' : '#60a5fa') : isDanger ? '#7f1d1d' : '#4a6fa5',
                  border: onglet === o.key ? `1px solid ${isDanger ? '#7f1d1d' : '#1e3a7a'}` : '1px solid transparent',
                  marginTop: isDanger ? '16px' : '0',
                }}>
                <Icon size={15} />
                {o.label}
                {onglet === o.key && <ChevronRight size={12} className="ml-auto" />}
              </button>
            )
          })}
        </div>

        {/* Contenu */}
        <div className="flex-1 rounded-xl p-6 space-y-5"
          style={{ background: onglet === 'danger' ? '#0d0505' : '#0d1526', border: `1px solid ${onglet === 'danger' ? '#7f1d1d' : '#1e2d4a'}` }}>

          {/* GÉNÉRAL */}
          {onglet === 'general' && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Informations générales</h2>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Nom du restaurant *</label>
                  <input value={form.nom} onChange={e => set('nom', e.target.value)} style={inputStyle} placeholder="Le Bistrot de Paris" />
                </div>
                <div>
                  <label style={labelStyle}>Adresse complète</label>
                  <input value={form.adresse} onChange={e => set('adresse', e.target.value)} style={inputStyle} placeholder="12 rue de la Paix, 75001 Paris" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Téléphone</label>
                    <input value={form.telephone} onChange={e => set('telephone', e.target.value)} style={inputStyle} placeholder="01 23 45 67 89" />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="contact@monresto.fr" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Nombre de couverts moyen</label>
                  <input type="number" value={form.nb_couverts_moyen} onChange={e => set('nb_couverts_moyen', parseInt(e.target.value))} style={{ ...inputStyle, width: '160px' }} />
                </div>
              </div>
            </>
          )}

          {/* FISCAL */}
          {onglet === 'fiscal' && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Informations fiscales</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>SIRET</label>
                    <input value={form.siret} onChange={e => set('siret', e.target.value)} style={inputStyle} placeholder="123 456 789 00010" />
                  </div>
                  <div>
                    <label style={labelStyle}>TVA Intracommunautaire</label>
                    <input value={form.tva_intracom} onChange={e => set('tva_intracom', e.target.value)} style={inputStyle} placeholder="FR12 123456789" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Taux TVA par défaut (%)</label>
                  <div className="flex gap-3">
                    {[5.5, 10, 20].map(t => (
                      <button key={t} onClick={() => set('taux_tva_defaut', t)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: form.taux_tva_defaut === t ? '#0a1f3d' : '#0a1120',
                          color: form.taux_tva_defaut === t ? '#60a5fa' : '#4a6fa5',
                          border: `1px solid ${form.taux_tva_defaut === t ? '#1e3a7a' : '#1e2d4a'}`,
                        }}>
                        {t}%
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#2d4a7a' }}>5.5% boissons · 10% restauration · 20% alcool</p>
                </div>
              </div>
            </>
          )}

          {/* OBJECTIFS */}
          {onglet === 'objectifs' && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Objectifs de performance</h2>
              <div className="space-y-6">
                <div>
                  <label style={labelStyle}>Objectif food cost (%)</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="15" max="50" value={form.objectif_food_cost}
                      onChange={e => set('objectif_food_cost', parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: '#60a5fa' }} />
                    <span className="text-2xl font-bold w-16 text-center"
                      style={{ color: form.objectif_food_cost <= 30 ? '#4ade80' : form.objectif_food_cost <= 38 ? '#fbbf24' : '#f87171' }}>
                      {form.objectif_food_cost}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1" style={{ color: '#2d4a7a' }}>
                    <span>Excellent &lt;28%</span><span>Bon 28-33%</span><span>Attention &gt;38%</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#4a6fa5' }}>Référentiels food cost restauration</p>
                  {[
                    { type: 'Gastronomique', val: '25-32%' },
                    { type: 'Brasserie / Bistrot', val: '28-35%' },
                    { type: 'Fast casual', val: '22-30%' },
                    { type: 'Pizza / Italien', val: '25-33%' },
                  ].map(r => (
                    <div key={r.type} className="flex justify-between py-1 text-xs border-b last:border-0" style={{ borderColor: '#1e2d4a' }}>
                      <span style={{ color: '#4a6fa5' }}>{r.type}</span>
                      <span style={{ color: '#60a5fa' }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* RÉGIONAL */}
          {onglet === 'regional' && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Paramètres régionaux</h2>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Fuseau horaire</label>
                  <select value={form.timezone} onChange={e => set('timezone', e.target.value)} style={inputStyle}>
                    <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                    <option value="Europe/Brussels">Europe/Bruxelles (UTC+1/+2)</option>
                    <option value="Europe/Zurich">Europe/Zurich (UTC+1/+2)</option>
                    <option value="Europe/London">Europe/Londres (UTC+0/+1)</option>
                    <option value="America/Montreal">America/Montréal (UTC-5/-4)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Devise</label>
                  <div className="flex gap-3">
                    {[{ code: 'EUR', symbol: '€' }, { code: 'CHF', symbol: 'CHF' }, { code: 'CAD', symbol: 'CA$' }].map(d => (
                      <button key={d.code} onClick={() => set('devise', d.code)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: form.devise === d.code ? '#0a1f3d' : '#0a1120',
                          color: form.devise === d.code ? '#60a5fa' : '#4a6fa5',
                          border: `1px solid ${form.devise === d.code ? '#1e3a7a' : '#1e2d4a'}`,
                        }}>
                        {d.symbol} {d.code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* DANGER */}
          {onglet === 'danger' && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: '#f87171' }}>
                <AlertTriangle size={14} />Zone de danger
              </h2>

              {resetDone ? (
                <div className="p-6 rounded-xl text-center" style={{ background: '#0a2d1a', border: '1px solid #15803d' }}>
                  <Check size={32} className="mx-auto mb-2" style={{ color: '#4ade80' }} />
                  <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>Application réinitialisée</p>
                  <p className="text-xs mt-1" style={{ color: '#2d6a4a' }}>Toutes les données ont été supprimées. Votre compte est intact.</p>
                </div>
              ) : (
                <div className="p-5 rounded-xl space-y-4" style={{ background: '#1a0505', border: '1px solid #7f1d1d' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#f87171' }}>Réinitialiser l'application</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: '#9a3b3b' }}>
                      Cette action supprime définitivement toutes vos données : produits, stocks, recettes, fournisseurs, commandes, planning, fiches de paie, HACCP, prévisions et historique caisse. <strong style={{ color: '#f87171' }}>Cette action est irréversible.</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-lg text-xs space-y-1" style={{ background: '#0d0505', border: '1px solid #450a0a' }}>
                    <p style={{ color: '#9a3b3b' }}>Sera supprimé :</p>
                    {['Tous les produits & stocks', 'Toutes les recettes & fiches techniques', 'Tous les fournisseurs & commandes', 'Tout le planning & les fiches de paie', 'Tout l\'historique HACCP', 'Toutes les prévisions', 'Tout l\'historique caisse & alertes'].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <span style={{ color: '#f87171' }}>×</span>
                        <span style={{ color: '#7f1d1d' }}>{item}</span>
                      </div>
                    ))}
                    <p className="mt-2" style={{ color: '#4ade80' }}>✓ Votre compte et organisation sont conservés</p>
                  </div>

                  {!confirmReset ? (
                    <button onClick={() => setConfirmReset(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d' }}>
                      <Trash2 size={14} />Réinitialiser l'application
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold" style={{ color: '#f87171' }}>
                        Tapez <code style={{ background: '#0d0505', padding: '2px 6px', borderRadius: '4px' }}>REINITIALISER</code> pour confirmer
                      </p>
                      <input
                        value={confirmText}
                        onChange={e => setConfirmText(e.target.value)}
                        placeholder="REINITIALISER"
                        style={{ ...inputStyle, border: '1px solid #7f1d1d', background: '#0d0505' }}
                      />
                      <div className="flex gap-3">
                        <button onClick={handleReset}
                          disabled={confirmText !== 'REINITIALISER' || isPending}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                          style={{
                            background: confirmText === 'REINITIALISER' ? '#dc2626' : '#450a0a',
                            opacity: confirmText !== 'REINITIALISER' || isPending ? 0.5 : 1,
                            cursor: confirmText !== 'REINITIALISER' ? 'not-allowed' : 'pointer',
                          }}>
                          <Trash2 size={14} />
                          {isPending ? 'Suppression...' : 'Confirmer la réinitialisation'}
                        </button>
                        <button onClick={() => { setConfirmReset(false); setConfirmText('') }}
                          className="px-4 py-2 rounded-lg text-sm"
                          style={{ background: '#1a0505', color: '#4a6fa5', border: '1px solid #1e2d4a' }}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
