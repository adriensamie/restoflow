'use client'

import { useState, useTransition, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { ajouterMouvement } from '@/lib/actions/stocks'

const MOTIFS_PERTE = [
  { value: 'dlc', label: 'DLC dépassée' },
  { value: 'casse', label: 'Casse / accident' },
  { value: 'vol', label: 'Vol' },
  { value: 'qualite', label: 'Mauvaise qualité' },
  { value: 'preparation', label: 'Chutes de préparation' },
  { value: 'autre', label: 'Autre' },
]

type TypeMvt = 'entree' | 'sortie' | 'perte' | 'inventaire'

interface ProduitOption {
  produit_id: string
  nom: string
  unite: string
  quantite_actuelle: number
}

interface Props {
  produit?: {
    produit_id: string
    nom: string
    unite: string
    quantite_actuelle: number
  }
  typeForcé?: TypeMvt
  onClose: () => void
}

export function MouvementModal({ produit: produitProp, typeForcé, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [produits, setProduits] = useState<ProduitOption[]>([])
  const [produitId, setProduitId] = useState(produitProp?.produit_id ?? '')
  const [type, setType] = useState<TypeMvt>(typeForcé ?? 'entree')
  const [quantite, setQuantite] = useState('')
  const [prix, setPrix] = useState('')
  const [motif, setMotif] = useState('dlc')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!produitProp) {
      fetch('/api/stocks/produits')
        .then(r => {
          if (!r.ok) throw new Error('Erreur chargement produits')
          return r.json()
        })
        .then((data: ProduitOption[]) => setProduits(Array.isArray(data) ? data : []))
        .catch(() => setError('Impossible de charger les produits'))
    }
  }, [produitProp])

  const produitSelectionne = produitProp ?? produits.find(p => p.produit_id === produitId)

  const handleSubmit = () => {
    if (!produitId) { setError('Sélectionnez un produit'); return }
    if (!quantite || parseFloat(quantite) <= 0) { setError('Quantité invalide'); return }
    setError('')

    startTransition(async () => {
      try {
        await ajouterMouvement({
          produit_id: produitId,
          type,
          quantite: parseFloat(quantite),
          prix_unitaire: prix ? parseFloat(prix) : undefined,
          motif: type === 'perte' ? motif : undefined,
          note: note || undefined,
        })
        onClose()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue')
      }
    })
  }

  const typeColors: Record<TypeMvt, string> = {
    entree: '#4ade80', sortie: '#60a5fa', perte: '#f87171', inventaire: '#fbbf24',
  }
  const typeLabels: Record<TypeMvt, string> = {
    entree: 'Entrée stock', sortie: 'Sortie stock', perte: 'Perte / gaspillage', inventaire: 'Inventaire',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
            {typeForcé === 'perte' ? 'Déclarer une perte' : 'Mouvement de stock'}
          </h2>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          {!produitProp ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Produit</label>
              <select value={produitId} onChange={e => setProduitId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              >
                <option value="">Sélectionner un produit...</option>
                {produits.map(p => (
                  <option key={p.produit_id} value={p.produit_id}>
                    {p.nom} — {p.quantite_actuelle} {p.unite}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg" style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
              <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{produitProp.nom}</p>
              <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>
                Stock actuel : {produitProp.quantite_actuelle} {produitProp.unite}
              </p>
            </div>
          )}

          {!typeForcé && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Type de mouvement</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(typeLabels) as TypeMvt[]).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className="py-2 px-3 rounded-lg text-xs font-medium text-left transition-all"
                    style={{
                      background: type === t ? '#1e2d4a' : '#0a1120',
                      border: `1px solid ${type === t ? typeColors[t] : '#1e2d4a'}`,
                      color: type === t ? typeColors[t] : '#4a6fa5',
                    }}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>
                Quantité ({produitSelectionne?.unite ?? '—'})
              </label>
              <input type="number" step="0.01" min="0" value={quantite}
                onChange={e => setQuantite(e.target.value)} placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Prix unit. (€)</label>
              <input type="number" step="0.01" min="0" value={prix}
                onChange={e => setPrix(e.target.value)} placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              />
            </div>
          </div>

          {type === 'perte' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Motif</label>
              <select value={motif} onChange={e => setMotif(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              >
                {MOTIFS_PERTE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Note (optionnel)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Détails supplémentaires..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
            />
          </div>
        </div>

        {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ background: type === 'perte' ? 'linear-gradient(135deg, #7f1d1d, #dc2626)' : 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
