'use client'

import { useState, useTransition } from 'react'
import { Users, Plus, X, Phone, Mail, Edit2 } from 'lucide-react'
import { creerEmploye, modifierEmploye, archiverEmploye } from '@/lib/actions/planning'

const POSTES: Record<string, { label: string; color: string; bg: string }> = {
  cuisine:   { label: 'Cuisine',   color: '#f97316', bg: '#1a0a00' },
  salle:     { label: 'Salle',     color: '#60a5fa', bg: '#0a1f3d' },
  bar:       { label: 'Bar',       color: '#a78bfa', bg: '#0f051a' },
  plonge:    { label: 'Plonge',    color: '#94a3b8', bg: '#0a1120' },
  livraison: { label: 'Livraison', color: '#4ade80', bg: '#0a2d1a' },
  direction: { label: 'Direction', color: '#fbbf24', bg: '#1a1505' },
  autre:     { label: 'Autre',     color: '#e2e8f0', bg: '#1e2d4a' },
}

const COULEURS = [
  '#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6',
  '#ec4899','#06b6d4','#84cc16','#f97316','#6366f1',
]

interface Employe {
  id: string; prenom: string; nom: string; poste: string
  email: string | null; telephone: string | null
  couleur: string | null; taux_horaire: number | null
  heures_contrat: number; actif: boolean
}

export function EquipeClient({ employes: init }: { employes: Employe[] }) {
  const [employes, setEmployes] = useState(init)
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [editEmploye, setEditEmploye] = useState<Employe | null>(null)
  const [filtrePoste, setFiltrePoste] = useState('tous')

  const [form, setForm] = useState({
    prenom: '', nom: '', poste: 'salle', email: '', telephone: '',
    couleur: COULEURS[0], taux_horaire: '', heures_contrat: '35',
  })
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openEdit = (emp: Employe) => {
    setEditEmploye(emp)
    setForm({
      prenom: emp.prenom, nom: emp.nom, poste: emp.poste,
      email: emp.email || '', telephone: emp.telephone || '',
      couleur: emp.couleur || COULEURS[0], taux_horaire: emp.taux_horaire?.toString() || '',
      heures_contrat: emp.heures_contrat?.toString() || '35',
    })
    setShowModal(true)
  }

  const openNew = () => {
    setEditEmploye(null)
    setForm({ prenom: '', nom: '', poste: 'salle', email: '', telephone: '', couleur: COULEURS[0], taux_horaire: '', heures_contrat: '35' })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.prenom || !form.nom) return
    startTransition(async () => {
      try {
        const actionPayload = {
          prenom: form.prenom, nom: form.nom, poste: form.poste,
          email: form.email || undefined, telephone: form.telephone || undefined,
          couleur: form.couleur,
          taux_horaire: form.taux_horaire ? parseFloat(form.taux_horaire) : undefined,
          heures_contrat: parseFloat(form.heures_contrat) || 35,
        }
        if (editEmploye) {
          await modifierEmploye(editEmploye.id, actionPayload)
          setEmployes(prev => prev.map(e => e.id === editEmploye.id ? {
            ...e, ...actionPayload,
            email: actionPayload.email ?? null,
            telephone: actionPayload.telephone ?? null,
            taux_horaire: actionPayload.taux_horaire ?? null,
          } : e))
        } else {
          await creerEmploye(actionPayload)
        }
        setShowModal(false)
      } catch (e) { console.error(e) }
    })
  }

  const handleArchiver = (id: string) => {
    startTransition(async () => {
      try {
        await archiverEmploye(id)
        setEmployes(prev => prev.filter(e => e.id !== id))
      } catch (e) { console.error(e) }
    })
  }

  const employesFiltres = employes.filter(e =>
    filtrePoste === 'tous' || e.poste === filtrePoste
  )

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Équipe</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            {employes.filter(e => e.actif).length} employé{employes.filter(e => e.actif).length > 1 ? 's' : ''} actif{employes.filter(e => e.actif).length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          <Plus size={16} />Ajouter
        </button>
      </div>

      {/* Filtres postes */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltrePoste('tous')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: filtrePoste === 'tous' ? '#1e2d4a' : '#0a1120', color: filtrePoste === 'tous' ? '#60a5fa' : '#4a6fa5', border: '1px solid #1e2d4a' }}>
          Tous ({employes.length})
        </button>
        {Object.entries(POSTES).map(([k, v]) => {
          const count = employes.filter(e => e.poste === k).length
          if (count === 0) return null
          return (
            <button key={k} onClick={() => setFiltrePoste(k)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filtrePoste === k ? v.bg : '#0a1120',
                color: filtrePoste === k ? v.color : '#4a6fa5',
                border: `1px solid ${filtrePoste === k ? v.color : '#1e2d4a'}`
              }}>
              {v.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Grille employés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employesFiltres.length === 0 && (
          <div className="col-span-3 rounded-xl p-12 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <Users size={32} className="mx-auto mb-2 opacity-20" style={{ color: '#60a5fa' }} />
            <p className="text-sm" style={{ color: '#2d4a7a' }}>Aucun employé</p>
          </div>
        )}
        {employesFiltres.map(emp => {
          const posteConf = POSTES[emp.poste] ?? POSTES.autre
          return (
            <div key={emp.id} className="rounded-xl p-4"
              style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: emp.couleur || '#6366f1' }}>
                    {emp.prenom.charAt(0)}{emp.nom.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
                      {emp.prenom} {emp.nom}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: posteConf.bg, color: posteConf.color }}>
                      {posteConf.label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(emp)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ background: '#1e2d4a', color: '#60a5fa' }}>
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleArchiver(emp.id)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ background: '#1a0505', color: '#f87171' }}>
                    <X size={12} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {emp.taux_horaire && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#4a6fa5' }}>Taux horaire</span>
                    <span style={{ color: '#e2e8f0' }}>{emp.taux_horaire} €/h</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#4a6fa5' }}>Contrat</span>
                  <span style={{ color: '#e2e8f0' }}>{emp.heures_contrat}h/sem</span>
                </div>
                {emp.email && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4a6fa5' }}>
                    <Mail size={10} />{emp.email}
                  </div>
                )}
                {emp.telephone && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4a6fa5' }}>
                    <Phone size={10} />{emp.telephone}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>
                {editEmploye ? 'Modifier' : 'Nouvel employé'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: '#4a6fa5' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Prénom *</label>
                  <input value={form.prenom} onChange={e => setF('prenom', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Nom *</label>
                  <input value={form.nom} onChange={e => setF('nom', e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Poste</label>
                  <select value={form.poste} onChange={e => setF('poste', e.target.value)} style={inputStyle}>
                    {Object.entries(POSTES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Taux horaire (€)</label>
                  <input type="number" step="0.01" value={form.taux_horaire}
                    onChange={e => setF('taux_horaire', e.target.value)} placeholder="12.50" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Téléphone</label>
                  <input value={form.telephone} onChange={e => setF('telephone', e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Heures/semaine</label>
                <input type="number" value={form.heures_contrat}
                  onChange={e => setF('heures_contrat', e.target.value)} style={{ ...inputStyle, width: '120px' }} />
              </div>
              <div>
                <label className="text-xs block mb-2" style={{ color: '#4a6fa5' }}>Couleur</label>
                <div className="flex gap-2">
                  {COULEURS.map(c => (
                    <button key={c} onClick={() => setF('couleur', c)}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{ background: c, border: form.couleur === c ? '3px solid white' : '2px solid transparent', transform: form.couleur === c ? 'scale(1.2)' : 'scale(1)' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
              <button onClick={handleSave} disabled={isPending || !form.prenom}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: !form.prenom ? 0.4 : 1 }}>
                {isPending ? 'Sauvegarde...' : editEmploye ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
