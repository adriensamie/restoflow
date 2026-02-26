'use client'

import { useState, useTransition } from 'react'
import { FileText, Plus, Check, Euro, Clock, Sparkles, X, ChevronDown } from 'lucide-react'
import { creerFichePaie, validerFichePaie, marquerPaye, genererFichesDepuisPlanning } from '@/lib/actions/equipe'

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', color: '#94a3b8', bg: '#1e2d4a' },
  valide:    { label: 'Validé',    color: '#60a5fa', bg: '#0a1f3d' },
  paye:      { label: 'Payé',      color: '#4ade80', bg: '#0a2d1a' },
}

interface FichePaie {
  id: string; employe_id: string; mois: string
  heures_normales: number; heures_sup: number; heures_absences: number
  salaire_brut: number; salaire_net: number | null; cotisations: number | null
  primes: number; avantages: number; statut: string
  employes: { prenom: string; nom: string; poste: string; couleur: string } | null
}
interface Employe {
  id: string; prenom: string; nom: string; poste: string
  taux_horaire: number | null; heures_contrat: number; couleur: string
}

export function FichesPaieClient({ fiches: init, employes, moisCourant }: {
  fiches: FichePaie[], employes: Employe[], moisCourant: string
}) {
  const [fiches, setFiches] = useState(init)
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [moisFiltre, setMoisFiltre] = useState(moisCourant.slice(0, 7))
  const [loading, setLoading] = useState(false)
  const [msgGeneration, setMsgGeneration] = useState('')

  const [form, setForm] = useState({
    employe_id: '', mois: moisCourant.slice(0, 7),
    heures_normales: '', heures_sup: '0', heures_absences: '0',
    salaire_brut: '', primes: '0', avantages: '0',
  })
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Calcul live
  const brut = parseFloat(form.salaire_brut) || 0
  const cotis = Math.round(brut * 0.22 * 100) / 100
  const net = Math.round((brut - cotis) * 100) / 100

  const fichesFiltrees = fiches.filter(f => f.mois.startsWith(moisFiltre))

  const totalBrut = fichesFiltrees.reduce((a, f) => a + (f.salaire_brut || 0), 0)
  const totalNet = fichesFiltrees.reduce((a, f) => a + (f.salaire_net || 0), 0)
  const totalHeures = fichesFiltrees.reduce((a, f) => a + (f.heures_normales || 0) + (f.heures_sup || 0), 0)

  const handleSave = () => {
    if (!form.employe_id || !form.salaire_brut) return
    startTransition(async () => {
      try {
        await creerFichePaie({
          employe_id: form.employe_id,
          mois: form.mois + '-01',
          heures_normales: parseFloat(form.heures_normales) || 0,
          heures_sup: parseFloat(form.heures_sup) || 0,
          heures_absences: parseFloat(form.heures_absences) || 0,
          salaire_brut: parseFloat(form.salaire_brut),
          primes: parseFloat(form.primes) || 0,
          avantages: parseFloat(form.avantages) || 0,
        })
        setShowModal(false)
      } catch (e) { console.error(e) }
    })
  }

  const handleValider = (id: string) => {
    startTransition(async () => {
      try {
        await validerFichePaie(id)
        setFiches(prev => prev.map(f => f.id === id ? { ...f, statut: 'valide' } : f))
      } catch (e) { console.error(e) }
    })
  }

  const handlePayer = (id: string) => {
    startTransition(async () => {
      try {
        await marquerPaye(id)
        setFiches(prev => prev.map(f => f.id === id ? { ...f, statut: 'paye' } : f))
      } catch (e) { console.error(e) }
    })
  }

  const handleGenerer = async () => {
    setLoading(true)
    setMsgGeneration('')
    try {
      const nb = await genererFichesDepuisPlanning(moisFiltre + '-01')
      setMsgGeneration(`✓ ${nb} fiche${nb > 1 ? 's' : ''} générée${nb > 1 ? 's' : ''} depuis le planning`)
    } catch (e: any) {
      setMsgGeneration('Erreur : ' + e.message)
    } finally {
      setLoading(false)
    }
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
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Fiches de paie</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>Suivi mensuel masse salariale</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerer} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', opacity: loading ? 0.6 : 1 }}>
            <Sparkles size={14} />{loading ? 'Génération...' : 'Générer depuis planning'}
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <Plus size={16} />Manuelle
          </button>
        </div>
      </div>

      {msgGeneration && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: msgGeneration.startsWith('✓') ? '#0a2d1a' : '#1a0505', color: msgGeneration.startsWith('✓') ? '#4ade80' : '#f87171', border: `1px solid ${msgGeneration.startsWith('✓') ? '#15803d' : '#dc2626'}` }}>
          {msgGeneration}
        </div>
      )}

      {/* Filtre mois + stats */}
      <div className="flex items-center gap-4">
        <input type="month" value={moisFiltre} onChange={e => setMoisFiltre(e.target.value)}
          style={{ ...inputStyle, width: '180px' }} />
        <div className="flex gap-3">
          {[
            { label: 'Masse brute', value: `${Math.round(totalBrut).toLocaleString('fr-FR')} €`, color: '#f97316' },
            { label: 'Masse nette', value: `${Math.round(totalNet).toLocaleString('fr-FR')} €`, color: '#4ade80' },
            { label: 'Heures totales', value: `${Math.round(totalHeures)}h`, color: '#60a5fa' },
          ].map(s => (
            <div key={s.label} className="px-3 py-2 rounded-lg"
              style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>{s.label}</p>
              <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Table fiches */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0a1628', borderBottom: '1px solid #1e2d4a' }}>
              {['Employé', 'Heures', 'Heures sup', 'Salaire brut', 'Cotisations', 'Salaire net', 'Primes', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#3b5280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fichesFiltrees.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm" style={{ color: '#2d4a7a' }}>
                Aucune fiche pour ce mois — utilisez "Générer depuis planning"
              </td></tr>
            )}
            {fichesFiltrees.map((f, i) => {
              const statConf = STATUT_CONFIG[f.statut as keyof typeof STATUT_CONFIG] ?? STATUT_CONFIG.brouillon
              return (
                <tr key={f.id} style={{ background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderBottom: '1px solid #1a2540' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: f.employes?.couleur || '#3b82f6', color: 'white' }}>
                        {f.employes?.prenom?.charAt(0)}{f.employes?.nom?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                        {f.employes?.prenom} {f.employes?.nom}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#60a5fa' }}>{f.heures_normales}h</td>
                  <td className="px-4 py-3 text-sm" style={{ color: f.heures_sup > 0 ? '#fbbf24' : '#2d4a7a' }}>
                    {f.heures_sup > 0 ? `+${f.heures_sup}h` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: '#f97316' }}>
                    {f.salaire_brut?.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>
                    {f.cotisations?.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: '#4ade80' }}>
                    {f.salaire_net?.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>
                    {f.primes > 0 ? `+${f.primes} €` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: statConf.bg, color: statConf.color }}>
                      {statConf.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {f.statut === 'brouillon' && (
                        <button onClick={() => handleValider(f.id)}
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ background: '#0a1f3d', color: '#60a5fa' }}>
                          Valider
                        </button>
                      )}
                      {f.statut === 'valide' && (
                        <button onClick={() => handlePayer(f.id)}
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ background: '#0a2d1a', color: '#4ade80' }}>
                          Marquer payé
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL SAISIE MANUELLE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Saisie manuelle</h2>
              <button onClick={() => setShowModal(false)} style={{ color: '#4a6fa5' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Employé *</label>
                  <select value={form.employe_id} onChange={e => setF('employe_id', e.target.value)} style={inputStyle}>
                    <option value="">— Choisir —</option>
                    {employes.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Mois</label>
                  <input type="month" value={form.mois} onChange={e => setF('mois', e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Heures normales</label>
                  <input type="number" value={form.heures_normales} onChange={e => setF('heures_normales', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Heures sup</label>
                  <input type="number" value={form.heures_sup} onChange={e => setF('heures_sup', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Absences</label>
                  <input type="number" value={form.heures_absences} onChange={e => setF('heures_absences', e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Salaire brut (€) *</label>
                <input type="number" step="0.01" value={form.salaire_brut} onChange={e => setF('salaire_brut', e.target.value)} style={inputStyle} />
              </div>
              {brut > 0 && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl" style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: '#2d4a7a' }}>Cotisations (~22%)</p>
                    <p className="text-base font-bold" style={{ color: '#f97316' }}>{cotis.toFixed(2)} €</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: '#2d4a7a' }}>Salaire net estimé</p>
                    <p className="text-base font-bold" style={{ color: '#4ade80' }}>{net.toFixed(2)} €</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Primes (€)</label>
                  <input type="number" value={form.primes} onChange={e => setF('primes', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Avantages (€)</label>
                  <input type="number" value={form.avantages} onChange={e => setF('avantages', e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
              <button onClick={handleSave} disabled={isPending || !form.employe_id || !form.salaire_brut}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: !form.employe_id ? 0.4 : 1 }}>
                {isPending ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
