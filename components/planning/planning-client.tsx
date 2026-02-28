'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Plus, Users, Clock, Euro, Copy, X, Check } from 'lucide-react'
import { creerCreneau, supprimerCreneau, modifierStatutCreneau, creerEmploye, dupliquerSemaine } from '@/lib/actions/planning'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const POSTES: Record<string, { label: string; color: string; bg: string }> = {
  cuisine:    { label: 'Cuisine',    color: '#f97316', bg: '#1a0a00' },
  salle:      { label: 'Salle',      color: '#60a5fa', bg: '#0a1f3d' },
  bar:        { label: 'Bar',        color: '#a78bfa', bg: '#0f051a' },
  plonge:     { label: 'Plonge',     color: '#94a3b8', bg: '#0a1120' },
  livraison:  { label: 'Livraison',  color: '#4ade80', bg: '#0a2d1a' },
  direction:  { label: 'Direction',  color: '#fbbf24', bg: '#1a1505' },
  autre:      { label: 'Autre',      color: '#e2e8f0', bg: '#1e2d4a' },
}

const COULEURS_EMPLOYE = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

interface Employe {
  id: string; prenom: string; nom: string; poste: string
  couleur: string | null; taux_horaire: number | null; heures_contrat: number
}
interface Creneau {
  id: string; employe_id: string; date: string
  heure_debut: string; heure_fin: string; poste: string | null
  service: string | null; statut: string; note: string | null
  cout_prevu: number | null
  employes: { prenom: string; nom: string; couleur: string | null; poste: string } | null
}

export function PlanningClient({ employes, creneaux, dateDebut, dateFin }: {
  employes: Employe[], creneaux: Creneau[], dateDebut: string, dateFin: string
}) {
  const [isPending, startTransition] = useTransition()
  const [semaineOffset, setSemaineOffset] = useState(0)
  const [creneauxLocaux, setCreneauxLocaux] = useState<Creneau[]>(creneaux)
  const [showCreneau, setShowCreneau] = useState(false)
  const [showEmploye, setShowEmploye] = useState(false)
  const [showDupliquer, setShowDupliquer] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEmploye, setSelectedEmploye] = useState<string>('')
  const [vue, setVue] = useState<'semaine' | 'employes'>('semaine')

  // Génère les 7 dates de la semaine affichée
  const getLundi = (offset: number) => {
    const d = new Date(dateDebut)
    d.setDate(d.getDate() + offset * 7)
    return d
  }
  const lundi = getLundi(semaineOffset)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi)
    d.setDate(lundi.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const labelSemaine = `${lundi.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${new Date(dates[6]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`

  // Creneaux par date
  const creneauxParDate = (date: string) =>
    creneauxLocaux.filter(c => c.date === date)

  // Calc hours from heure_debut/heure_fin
  const calcHeures = (c: Creneau) => {
    const [hd, md] = (c.heure_debut || '0:0').split(':').map(Number)
    const [hf, mf] = (c.heure_fin || '0:0').split(':').map(Number)
    let mins = hf * 60 + mf - (hd * 60 + md)
    if (mins < 0) mins += 24 * 60
    return mins / 60
  }

  // Stats semaine
  const totalHeures = creneauxLocaux.reduce((a, c) => a + calcHeures(c), 0)
  const totalCout = creneauxLocaux.reduce((a, c) => a + (c.cout_prevu || 0), 0)
  const nbPresents = new Set(creneauxLocaux.map(c => c.employe_id)).size

  // Form creneau
  const [formC, setFormC] = useState({
    employe_id: '', heure_debut: '09:00', heure_fin: '17:00',
    poste: 'salle', service: 'midi', note: ''
  })
  const setFC = (k: string, v: string) => setFormC(f => ({ ...f, [k]: v }))

  const handleAddCreneau = () => {
    if (!formC.employe_id || !selectedDate) return
    startTransition(async () => {
      try {
        const result = await creerCreneau({
          employe_id: formC.employe_id,
          date: selectedDate,
          heure_debut: formC.heure_debut,
          heure_fin: formC.heure_fin,
          poste: formC.poste,
          service: formC.service,
          note: formC.note || undefined,
        })
        const emp = employes.find(e => e.id === formC.employe_id)
        setCreneauxLocaux(prev => [...prev, {
          ...result,
          employes: emp ? { prenom: emp.prenom, nom: emp.nom, couleur: emp.couleur, poste: emp.poste } : null
        }])
        setShowCreneau(false)
      } catch (e) { console.error(e) }
    })
  }

  const handleDeleteCreneau = (id: string) => {
    startTransition(async () => {
      try {
        await supprimerCreneau(id)
        setCreneauxLocaux(prev => prev.filter(c => c.id !== id))
      } catch (e) { console.error(e) }
    })
  }

  // Form employé
  const [formE, setFormE] = useState({
    prenom: '', nom: '', poste: 'salle', email: '',
    telephone: '', couleur: COULEURS_EMPLOYE[0],
    taux_horaire: '', heures_contrat: '35'
  })
  const setFE = (k: string, v: string) => setFormE(f => ({ ...f, [k]: v }))

  const handleAddEmploye = () => {
    if (!formE.prenom || !formE.nom) return
    startTransition(async () => {
      try {
        await creerEmploye({
          prenom: formE.prenom, nom: formE.nom,
          poste: formE.poste, email: formE.email || undefined,
          telephone: formE.telephone || undefined,
          couleur: formE.couleur,
          taux_horaire: formE.taux_horaire ? parseFloat(formE.taux_horaire) : undefined,
          heures_contrat: parseFloat(formE.heures_contrat) || 35,
        })
        setShowEmploye(false)
      } catch (e) { console.error(e) }
    })
  }

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Planning</h1>
          <p className="text-sm mt-0.5" style={{ color: '#4a6fa5' }}>{labelSemaine}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDupliquer(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>
            <Copy size={14} />Dupliquer
          </button>
          <button onClick={() => setShowEmploye(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>
            <Users size={14} />Employé
          </button>
          <button onClick={() => { setSelectedDate(dates[0]); setShowCreneau(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <Plus size={16} />Créneau
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        {[
          { label: 'Employés semaine', value: nbPresents, icon: Users, color: '#60a5fa' },
          { label: 'Heures planifiées', value: `${Math.round(totalHeures * 10) / 10}h`, icon: Clock, color: '#4ade80' },
          { label: 'Coût masse sal.', value: totalCout > 0 ? `${Math.round(totalCout)} €` : '—', icon: Euro, color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <s.icon size={18} style={{ color: s.color }} />
            <div>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>{s.label}</p>
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation semaine */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => setSemaineOffset(s => s - 1)}
          className="p-2 rounded-lg" style={{ background: '#1e2d4a', color: '#94a3b8' }}>
          <ChevronLeft size={16} />
        </button>
        <button onClick={() => setSemaineOffset(0)}
          className="px-3 py-1.5 rounded-lg text-xs"
          style={{ background: semaineOffset === 0 ? '#1e2d4a' : 'transparent', color: '#60a5fa' }}>
          Cette semaine
        </button>
        <button onClick={() => setSemaineOffset(s => s + 1)}
          className="p-2 rounded-lg" style={{ background: '#1e2d4a', color: '#94a3b8' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grille planning */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[900px]">
          {/* Headers jours */}
          {dates.map((date, i) => {
            const d = new Date(date)
            const isToday = date === new Date().toISOString().slice(0, 10)
            const nbCreneaux = creneauxParDate(date).length
            return (
              <div key={date} className="text-center">
                <div className="py-2 rounded-lg mb-2"
                  style={{ background: isToday ? '#0a1f3d' : '#0a1120', border: `1px solid ${isToday ? '#3b82f6' : '#1e2d4a'}` }}>
                  <p className="text-xs font-medium" style={{ color: isToday ? '#60a5fa' : '#4a6fa5' }}>
                    {JOURS[i]}
                  </p>
                  <p className="text-sm font-bold" style={{ color: isToday ? '#60a5fa' : '#e2e8f0' }}>
                    {d.getDate()}
                  </p>
                  {nbCreneaux > 0 && (
                    <p className="text-xs" style={{ color: '#2d4a7a' }}>{nbCreneaux} créneaux</p>
                  )}
                </div>

                {/* Creneaux du jour */}
                <div className="space-y-1.5 min-h-32">
                  {creneauxParDate(date).map(c => {
                    const posteConf = POSTES[c.poste || c.employes?.poste || 'autre']
                    return (
                      <div key={c.id}
                        className="relative px-2 py-1.5 rounded-lg text-left group cursor-pointer"
                        style={{
                          background: c.employes?.couleur ? `${c.employes.couleur}22` : '#0d1526',
                          border: `1px solid ${c.employes?.couleur || '#1e2d4a'}44`,
                        }}>
                        <p className="text-xs font-semibold truncate" style={{ color: c.employes?.couleur || '#e2e8f0' }}>
                          {c.employes?.prenom} {c.employes?.nom?.charAt(0)}.
                        </p>
                        <p className="text-xs" style={{ color: '#4a6fa5' }}>
                          {c.heure_debut.slice(0, 5)}–{c.heure_fin.slice(0, 5)}
                        </p>
                        <span className="text-xs px-1 py-0.5 rounded"
                          style={{ background: posteConf?.bg, color: posteConf?.color, fontSize: '10px' }}>
                          {posteConf?.label}
                        </span>
                        {/* Bouton supprimer */}
                        <button
                          onClick={() => handleDeleteCreneau(c.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: '#f87171' }}>
                          <X size={10} />
                        </button>
                      </div>
                    )
                  })}
                  {/* Bouton ajouter */}
                  <button
                    onClick={() => { setSelectedDate(date); setShowCreneau(true) }}
                    className="w-full py-1.5 rounded-lg text-xs opacity-0 hover:opacity-100 transition-opacity"
                    style={{ border: '1px dashed #1e2d4a', color: '#2d4a7a' }}>
                    + Ajouter
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Vue par employé */}
        {employes.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>
              Récap par employé
            </p>
            {employes.map(emp => {
              const creneauxEmp = creneauxLocaux.filter(c => c.employe_id === emp.id)
              const heures = creneauxEmp.reduce((a, c) => a + calcHeures(c), 0)
              const cout = creneauxEmp.reduce((a, c) => a + (c.cout_prevu || 0), 0)
              const diff = heures - (emp.heures_contrat / 5) * 7 / 7 * creneauxEmp.length
              return (
                <div key={emp.id} className="flex items-center gap-4 px-4 py-2.5 rounded-xl"
                  style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: emp.couleur ?? '#94a3b8' }} />
                  <div className="w-32 flex-shrink-0">
                    <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{emp.prenom} {emp.nom}</p>
                    <p className="text-xs" style={{ color: '#4a6fa5' }}>{POSTES[emp.poste]?.label}</p>
                  </div>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2d4a' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, (heures / (emp.heures_contrat || 35)) * 100)}%`,
                      background: emp.couleur ?? '#94a3b8'
                    }} />
                  </div>
                  <p className="text-sm font-bold w-16 text-right" style={{ color: emp.couleur ?? '#94a3b8' }}>
                    {Math.round(heures * 10) / 10}h
                  </p>
                  <p className="text-xs w-20 text-right" style={{ color: '#4a6fa5' }}>
                    {cout > 0 ? `${Math.round(cout)} €` : '—'}
                  </p>
                  <p className="text-xs w-16 text-right" style={{ color: '#2d4a7a' }}>
                    / {emp.heures_contrat}h
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL CRÉNEAU */}
      {showCreneau && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Nouveau créneau</h2>
              <button onClick={() => setShowCreneau(false)} style={{ color: '#4a6fa5' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Date</label>
                <input type="date" value={selectedDate || ''} onChange={e => setSelectedDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Employé *</label>
                <select value={formC.employe_id} onChange={e => setFC('employe_id', e.target.value)} style={inputStyle}>
                  <option value="">— Choisir —</option>
                  {employes.map(e => (
                    <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Début</label>
                  <input type="time" value={formC.heure_debut} onChange={e => setFC('heure_debut', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Fin</label>
                  <input type="time" value={formC.heure_fin} onChange={e => setFC('heure_fin', e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Poste</label>
                  <select value={formC.poste} onChange={e => setFC('poste', e.target.value)} style={inputStyle}>
                    {Object.entries(POSTES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Service</label>
                  <select value={formC.service} onChange={e => setFC('service', e.target.value)} style={inputStyle}>
                    <option value="midi">Midi</option>
                    <option value="soir">Soir</option>
                    <option value="journee">Journée</option>
                    <option value="coupure">Coupure</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Note</label>
                <input value={formC.note} onChange={e => setFC('note', e.target.value)}
                  placeholder="Optionnel..." style={inputStyle} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => setShowCreneau(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
              <button onClick={handleAddCreneau} disabled={isPending || !formC.employe_id}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: !formC.employe_id ? 0.4 : 1 }}>
                {isPending ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EMPLOYÉ */}
      {showEmploye && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Nouvel employé</h2>
              <button onClick={() => setShowEmploye(false)} style={{ color: '#4a6fa5' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Prénom *</label>
                  <input value={formE.prenom} onChange={e => setFE('prenom', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Nom *</label>
                  <input value={formE.nom} onChange={e => setFE('nom', e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Poste</label>
                  <select value={formE.poste} onChange={e => setFE('poste', e.target.value)} style={inputStyle}>
                    {Object.entries(POSTES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Taux horaire (€)</label>
                  <input type="number" step="0.01" value={formE.taux_horaire}
                    onChange={e => setFE('taux_horaire', e.target.value)}
                    placeholder="12.50" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="text-xs block mb-2" style={{ color: '#4a6fa5' }}>Couleur planning</label>
                <div className="flex gap-2">
                  {COULEURS_EMPLOYE.map(c => (
                    <button key={c} onClick={() => setFE('couleur', c)}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{
                        background: c,
                        border: formE.couleur === c ? '3px solid white' : '2px solid transparent',
                        transform: formE.couleur === c ? 'scale(1.2)' : 'scale(1)'
                      }} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Email</label>
                  <input type="email" value={formE.email}
                    onChange={e => setFE('email', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Heures contrat/sem</label>
                  <input type="number" value={formE.heures_contrat}
                    onChange={e => setFE('heures_contrat', e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => setShowEmploye(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
              <button onClick={handleAddEmploye} disabled={isPending || !formE.prenom || !formE.nom}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: !formE.prenom ? 0.4 : 1 }}>
                {isPending ? 'Ajout...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DUPLIQUER */}
      {showDupliquer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Dupliquer la semaine</h2>
              <button onClick={() => setShowDupliquer(false)} style={{ color: '#4a6fa5' }}><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm mb-4" style={{ color: '#4a6fa5' }}>
                Copier tous les créneaux de cette semaine vers la semaine suivante ?
              </p>
              <p className="text-xs p-3 rounded-lg" style={{ background: '#0a1120', color: '#60a5fa' }}>
                {creneauxLocaux.length} créneau{creneauxLocaux.length > 1 ? 'x' : ''} seront copiés
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
              <button onClick={() => setShowDupliquer(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
              <button onClick={() => {
                startTransition(async () => {
                  try {
                    await dupliquerSemaine(dates[0], dates[6], 7)
                    setShowDupliquer(false)
                  } catch (e) { console.error(e) }
                })
              }} disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                <Copy size={14} />Dupliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
