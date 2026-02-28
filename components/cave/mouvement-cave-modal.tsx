'use client'

import { useState } from 'react'
import { X, ArrowUp, ArrowDown, RotateCcw, AlertTriangle } from 'lucide-react'
import { ajouterMouvementCave } from '@/lib/actions/cave'

const TYPES = [
  { value: 'entree', label: 'Entrée', icon: ArrowUp, color: '#4ade80', desc: 'Réception bouteilles' },
  { value: 'sortie_bouteille', label: 'Sortie bouteille', icon: ArrowDown, color: '#f87171', desc: 'Vente ou consommation' },
  { value: 'sortie_verre', label: 'Sortie verre', icon: ArrowDown, color: '#fbbf24', desc: 'Vente au verre' },
  { value: 'casse', label: 'Casse', icon: AlertTriangle, color: '#f97316', desc: 'Bouteille cassée/perdue' },
  { value: 'inventaire', label: 'Inventaire', icon: RotateCcw, color: '#a5b4fc', desc: 'Correction de stock' },
]

interface Vin {
  id: string; nom: string; appellation: string | null
  stock_bouteilles: number; vendu_au_verre: boolean
  prix_achat_ht: number | null; prix_verre_ttc: number | null
}

export function MouvementCaveModal({ vin, onClose }: { vin: Vin; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState('entree')
  const [quantite, setQuantite] = useState('1')
  const [note, setNote] = useState('')

  const typeConfig = TYPES.find(t => t.value === type)!
  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }

  const handleSubmit = async () => {
    if (!quantite || parseInt(quantite) <= 0) return
    setLoading(true)
    try {
      await ajouterMouvementCave({
        vin_id: vin.id,
        type,
        quantite: parseInt(quantite),
        prix_unitaire: type === 'entree' ? (vin.prix_achat_ht ?? undefined)
                     : type === 'sortie_verre' ? (vin.prix_verre_ttc ?? undefined) : undefined,
        note: note || undefined,
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally { setLoading(false) }
  }

  // Stock après opération
  const stockApres = () => {
    const q = parseInt(quantite) || 0
    if (type === 'entree') return vin.stock_bouteilles + q
    if (type === 'inventaire') return q
    if (type === 'sortie_verre') return vin.stock_bouteilles // verre ne change pas les bouteilles
    return Math.max(0, vin.stock_bouteilles - q)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div>
            <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Mouvement cave</h2>
            <p className="text-sm" style={{ color: '#4a6fa5' }}>
              {vin.nom} {vin.appellation ? `· ${vin.appellation}` : ''} · {vin.stock_bouteilles} bouteilles
            </p>
          </div>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {TYPES.filter(t => t.value !== 'sortie_verre' || vin.vendu_au_verre).map(t => (
              <button key={t.value} onClick={() => setType(t.value)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: type === t.value ? '#0a1120' : 'transparent',
                  border: `1px solid ${type === t.value ? t.color : '#1e2d4a'}`,
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <t.icon size={14} style={{ color: t.color }} />
                  <span className="text-sm font-medium" style={{ color: type === t.value ? t.color : '#94a3b8' }}>
                    {t.label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#2d4a7a' }}>{t.desc}</p>
              </button>
            ))}
          </div>

          {/* Quantité */}
          <div>
            <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>
              Quantité ({type === 'inventaire' ? 'stock final' : type === 'sortie_verre' ? 'verres' : 'bouteilles'})
            </label>
            <input type="number" min="0" value={quantite} onChange={e => setQuantite(e.target.value)}
              style={inputStyle} />
          </div>

          {/* Aperçu stock après */}
          {type !== 'sortie_verre' && (
            <div className="px-4 py-3 rounded-lg flex items-center justify-between"
              style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
              <span className="text-sm" style={{ color: '#4a6fa5' }}>Stock après opération</span>
              <span className="text-sm font-bold"
                style={{ color: stockApres() <= 3 ? '#f87171' : '#4ade80' }}>
                {stockApres()} bouteilles
              </span>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Note (optionnel)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Raison, fournisseur, service..." style={inputStyle} />
          </div>
        </div>

        <div className="px-6 space-y-3" style={{ borderTop: '1px solid #1e2d4a', paddingTop: '16px' }}>
          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading || !quantite}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: `linear-gradient(135deg, ${typeConfig.color}88, ${typeConfig.color})`, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}
