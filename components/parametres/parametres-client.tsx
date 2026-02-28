'use client'

import { useState, useTransition } from 'react'
import { Settings, Save, Check, Building2, FileText, Globe, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import { sauvegarderParametres } from '@/lib/actions/parametres'
import { reinitialiserApplication } from '@/lib/actions/reset'

const ONGLETS = [
  { key: 'general', label: 'Général', icon: Building2 },
  { key: 'fiscal', label: 'Fiscal', icon: FileText },
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
    email: organisation?.email_contact || '',
    siret: organisation?.siret || '',
    timezone: organisation?.timezone || 'Europe/Paris',
    devise: organisation?.devise || 'EUR',
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
              </div>
            </>
          )}

          {/* FISCAL */}
          {onglet === 'fiscal' && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>Informations fiscales</h2>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>SIRET</label>
                  <input value={form.siret} onChange={e => set('siret', e.target.value)} style={inputStyle} placeholder="123 456 789 00010" />
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
