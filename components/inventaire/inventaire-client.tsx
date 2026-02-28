'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Plus, Check, X, ChevronRight, AlertTriangle, Wifi, WifiOff, Clock } from 'lucide-react'
import { creerSessionInventaire, sauvegarderLigneInventaire, validerInventaire, annulerInventaire } from '@/lib/actions/inventaire'

const ZONES = [
  { value: 'cuisine', label: 'Cuisine' },
  { value: 'bar', label: 'Bar' },
  { value: 'cave', label: 'Cave' },
  { value: 'reserve', label: 'Réserve' },
  { value: 'congelateur', label: 'Congélateur' },
]

interface Produit {
  id: string; nom: string; categorie: string; unite: string; stock_actuel: number
}
interface Vin {
  id: string; nom: string; appellation: string | null; categorie: string; stock_bouteilles: number
}
interface Session {
  id: string; nom: string; zone: string; statut: string; created_at: string
  lignes_inventaire: { count: number }[]
}

type LigneLocale = {
  id: string // produit_id ou vin_id
  type: 'produit' | 'vin'
  nom: string
  sous_titre: string
  unite: string
  stock_theorique: number
  quantite_comptee: string
  saved: boolean
}

export function InventaireClient({ produits, vins, sessions }: {
  produits: Produit[], vins: Vin[], sessions: Session[]
}) {
  const [vue, setVue] = useState<'accueil' | 'session'>('accueil')
  const [sessionActive, setSessionActive] = useState<{ id: string; nom: string; zone: string } | null>(null)
  const [lignes, setLignes] = useState<LigneLocale[]>([])
  const [showNouvelle, setShowNouvelle] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [filtreZone, setFiltreZone] = useState('cuisine')
  const [recherche, setRecherche] = useState('')
  const [validating, setValidating] = useState(false)
  const [erreurValidation, setErreurValidation] = useState('')

  // Détection offline
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    setIsOnline(navigator.onLine)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const demarrerSession = async (nom: string, zone: string) => {
    setLoading(true)
    try {
      const session = await creerSessionInventaire({ nom, zone })
      setSessionActive({ id: session.id, nom: session.nom, zone: session.zone })

      // Construire les lignes selon la zone
      const lignesInit: LigneLocale[] = []

      if (zone !== 'cave') {
        produits.forEach(p => {
          lignesInit.push({
            id: p.id, type: 'produit',
            nom: p.nom, sous_titre: p.categorie,
            unite: p.unite || 'unité',
            stock_theorique: p.stock_actuel || 0,
            quantite_comptee: '', saved: false,
          })
        })
      } else {
        vins.forEach(v => {
          lignesInit.push({
            id: v.id, type: 'vin',
            nom: v.nom, sous_titre: v.appellation || v.categorie,
            unite: 'btl',
            stock_theorique: v.stock_bouteilles || 0,
            quantite_comptee: '', saved: false,
          })
        })
      }

      setLignes(lignesInit)
      setVue('session')
    } catch (e) { console.error(e) }
    finally { setLoading(false); setShowNouvelle(false) }
  }

  const updateQuantite = (id: string, val: string) => {
    setLignes(prev => prev.map(l => l.id === id ? { ...l, quantite_comptee: val, saved: false } : l))
  }

  const saveLigne = async (ligne: LigneLocale) => {
    if (!sessionActive || ligne.quantite_comptee === '') return
    try {
      await sauvegarderLigneInventaire({
        session_id: sessionActive.id,
        produit_id: ligne.type === 'produit' ? ligne.id : undefined,
        vin_id: ligne.type === 'vin' ? ligne.id : undefined,
        stock_theorique: ligne.stock_theorique,
        quantite_comptee: parseFloat(ligne.quantite_comptee),
        unite: ligne.unite,
      })
      setLignes(prev => prev.map(l => l.id === ligne.id ? { ...l, saved: true } : l))
    } catch (e) {
      // Stockage local si offline
      const offline = JSON.parse(localStorage.getItem('inv_offline') || '[]')
      offline.push({ ...ligne, session_id: sessionActive.id, ts: Date.now() })
      localStorage.setItem('inv_offline', JSON.stringify(offline))
      setLignes(prev => prev.map(l => l.id === ligne.id ? { ...l, saved: true } : l))
    }
  }

  const handleValider = async () => {
    if (!sessionActive) return
    setValidating(true)
    try {
      await validerInventaire(sessionActive.id)
      setVue('accueil')
      setSessionActive(null)
      setLignes([])
    } catch (e) {
      setErreurValidation(e instanceof Error ? e.message : 'Erreur lors de la validation')
    } finally { setValidating(false) }
  }

  const lignesFiltrees = lignes.filter(l => {
    if (recherche && !l.nom.toLowerCase().includes(recherche.toLowerCase())) return false
    return true
  })

  const nbSaisies = lignes.filter(l => l.quantite_comptee !== '').length
  const nbEcarts = lignes.filter(l => {
    if (l.quantite_comptee === '') return false
    return Math.abs(parseFloat(l.quantite_comptee) - l.stock_theorique) > 0.01
  }).length
  const progression = lignes.length > 0 ? Math.round(nbSaisies / lignes.length * 100) : 0

  // VUE SESSION (mode inventaire)
  if (vue === 'session' && sessionActive) {
    return (
      <div className="flex flex-col h-full" style={{ maxWidth: '100%' }}>
        {/* Header session */}
        <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
          style={{ background: '#080d1a', borderBottom: '1px solid #1e2d4a' }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm" style={{ color: '#e2e8f0' }}>{sessionActive.nom}</h2>
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isOnline ? '' : 'opacity-80'}`}
                style={{ background: isOnline ? '#0a2d1a' : '#1a0505', color: isOnline ? '#4ade80' : '#f87171' }}>
                {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#4a6fa5' }}>
              {nbSaisies}/{lignes.length} · {nbEcarts} écart{nbEcarts > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setVue('accueil'); setSessionActive(null); setLignes([]) }}
              className="p-2 rounded-lg" style={{ background: '#1e2d4a', color: '#f87171' }}>
              <X size={16} />
            </button>
            <button onClick={handleValider} disabled={validating || nbSaisies === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #15803d, #4ade80)', opacity: nbSaisies === 0 ? 0.4 : 1 }}>
              <Check size={14} />
              {validating ? 'Validation...' : 'Valider'}
            </button>
          </div>
        </div>

        {erreurValidation && (
          <div className="px-4 py-2" style={{ background: '#1a0505', borderBottom: '1px solid #7f1d1d' }}>
            <p className="text-sm" style={{ color: '#f87171' }}>{erreurValidation}</p>
          </div>
        )}

        {/* Barre de progression */}
        <div className="px-4 py-2" style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a' }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#1e2d4a' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progression}%`, background: progression === 100 ? '#4ade80' : 'linear-gradient(90deg, #3b82f6, #0ea5e9)' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: progression === 100 ? '#4ade80' : '#60a5fa' }}>
              {progression}%
            </span>
          </div>
        </div>

        {/* Recherche */}
        <div className="px-4 py-2" style={{ background: '#0a1120', borderBottom: '1px solid #1e2d4a' }}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }} />
        </div>

        {/* Liste produits */}
        <div className="flex-1 overflow-y-auto">
          {lignesFiltrees.map((ligne, i) => {
            const val = ligne.quantite_comptee !== '' ? parseFloat(ligne.quantite_comptee) : null
            const ecart = val !== null ? val - ligne.stock_theorique : null
            const hasEcart = ecart !== null && Math.abs(ecart) > 0.01

            return (
              <div key={ligne.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: '1px solid #1a2540',
                  background: ligne.saved ? (hasEcart ? '#0f0810' : '#080f08') : i % 2 === 0 ? '#0d1526' : '#0a1120'
                }}>
                {/* Info produit */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#e2e8f0' }}>{ligne.nom}</p>
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>
                    Théorique : {ligne.stock_theorique} {ligne.unite}
                    {hasEcart && (
                      <span style={{ color: ecart! > 0 ? '#4ade80' : '#f87171', marginLeft: '6px' }}>
                        ({ecart! > 0 ? '+' : ''}{ecart!.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>

                {/* Saisie quantité */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ligne.quantite_comptee}
                    onChange={e => updateQuantite(ligne.id, e.target.value)}
                    onBlur={() => saveLigne(ligne)}
                    placeholder="0"
                    className="w-20 text-center rounded-lg py-2 text-sm font-medium outline-none"
                    style={{
                      background: ligne.saved ? (hasEcart ? '#1a0820' : '#0a1f0a') : '#0a1120',
                      border: `1px solid ${ligne.saved ? (hasEcart ? '#7c3aed' : '#15803d') : '#1e2d4a'}`,
                      color: '#e2e8f0'
                    }}
                  />
                  <span className="text-xs w-8" style={{ color: '#2d4a7a' }}>{ligne.unite}</span>

                  {ligne.saved && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: hasEcart ? '#4c1d95' : '#14532d' }}>
                      {hasEcart
                        ? <AlertTriangle size={10} style={{ color: '#c4b5fd' }} />
                        : <Check size={10} style={{ color: '#4ade80' }} />
                      }
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {lignesFiltrees.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: '#2d4a7a' }}>Aucun produit trouvé</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // VUE ACCUEIL
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Inventaire</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            Comptage rapide · Mobile-first · Hors-ligne
          </p>
        </div>
        <button onClick={() => setShowNouvelle(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          <Plus size={16} />Nouveau
        </button>
      </div>

      {/* Sessions récentes */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#4a6fa5' }}>Sessions récentes</h2>
        <div className="space-y-2">
          {sessions.length === 0 && (
            <div className="rounded-xl p-8 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <ClipboardList size={32} className="mx-auto mb-2 opacity-20" style={{ color: '#60a5fa' }} />
              <p className="text-sm" style={{ color: '#2d4a7a' }}>Aucun inventaire effectué</p>
            </div>
          )}
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: '#0a1120' }}>
                  <ClipboardList size={15} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{s.nom}</p>
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>
                    {ZONES.find(z => z.value === s.zone)?.label} ·{' '}
                    {s.lignes_inventaire?.[0]?.count ?? 0} lignes ·{' '}
                    {new Date(s.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    background: s.statut === 'valide' ? '#0a2d1a' : s.statut === 'annule' ? '#1a0505' : '#0a1f3d',
                    color: s.statut === 'valide' ? '#4ade80' : s.statut === 'annule' ? '#f87171' : '#60a5fa'
                  }}>
                  {s.statut === 'valide' ? 'Validé' : s.statut === 'annule' ? 'Annulé' : 'En cours'}
                </span>
                <ChevronRight size={14} style={{ color: '#2d4a7a' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nouvelle session */}
      {showNouvelle && (
        <NouvelleSessionModal
          onStart={demarrerSession}
          onClose={() => setShowNouvelle(false)}
          loading={loading}
        />
      )}
    </div>
  )
}

function NouvelleSessionModal({ onStart, onClose, loading }: {
  onStart: (nom: string, zone: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [nom, setNom] = useState(`Inventaire ${new Date().toLocaleDateString('fr-FR')}`)
  const [zone, setZone] = useState('cuisine')

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '10px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #1e2d4a' }}>
          <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Nouvel inventaire</h2>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Nom</label>
            <input value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs block mb-2" style={{ color: '#4a6fa5' }}>Zone</label>
            <div className="grid grid-cols-3 gap-2">
              {ZONES.map(z => (
                <button key={z.value} onClick={() => setZone(z.value)}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: zone === z.value ? 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' : '#0a1120',
                    border: `1px solid ${zone === z.value ? '#3b82f6' : '#1e2d4a'}`,
                    color: zone === z.value ? 'white' : '#4a6fa5'
                  }}>
                  {z.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={() => onStart(nom, zone)} disabled={loading || !nom}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Démarrage...' : '▶ Démarrer l\'inventaire'}
          </button>
        </div>
      </div>
    </div>
  )
}
