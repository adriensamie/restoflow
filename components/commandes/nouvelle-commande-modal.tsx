'use client'

import { useState, useTransition } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { creerCommande } from '@/lib/actions/commandes'

interface Ligne {
  produit_id: string
  nom: string
  quantite_commandee: number
  prix_unitaire: number | undefined
  unite: string
}

interface Props {
  fournisseurs: { id: string; nom: string }[]
  blPreRempli?: {
    fournisseur: { nom: string }
    lignes: { nom_normalise: string; quantite: number; unite: string; prix_unitaire_ht: number | null }[]
    date: string | null
  } | null
  onClose: () => void
}

const inputStyle = { background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }

export function NouvelleCommandeModal({ fournisseurs, blPreRempli, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [fournisseurId, setFournisseurId] = useState('')
  const [dateLivraison, setDateLivraison] = useState('')
  const [note, setNote] = useState('')

  // Pré-remplir depuis le BL analysé
  const [lignes, setLignes] = useState<Ligne[]>(() => {
    if (blPreRempli?.lignes) {
      return blPreRempli.lignes.map(l => ({
        produit_id: '',
        nom: l.nom_normalise,
        quantite_commandee: l.quantite,
        prix_unitaire: l.prix_unitaire_ht ?? undefined,
        unite: l.unite,
      }))
    }
    return [{ produit_id: '', nom: '', quantite_commandee: 1, prix_unitaire: undefined, unite: 'kg' }]
  })

  const addLigne = () => setLignes(l => [...l, { produit_id: '', nom: '', quantite_commandee: 1, prix_unitaire: undefined, unite: 'kg' }])
  const removeLigne = (i: number) => setLignes(l => l.filter((_, idx) => idx !== i))
  const updateLigne = (i: number, key: string, value: string | number) =>
    setLignes(l => l.map((item, idx) => idx === i ? { ...item, [key]: value } : item))

  const totalHT = lignes.reduce((acc, l) => acc + l.quantite_commandee * (l.prix_unitaire ?? 0), 0)

  const handleSubmit = () => {
    if (!fournisseurId) { setError('Sélectionnez un fournisseur'); return }
    if (lignes.some(l => !l.nom.trim() || l.quantite_commandee <= 0)) {
      setError('Vérifiez les lignes — nom et quantité requis')
      return
    }
    setError('')

    startTransition(async () => {
      try {
        await creerCommande({
          fournisseur_id: fournisseurId,
          date_livraison_prevue: dateLivraison || undefined,
          note: note || undefined,
          lignes: lignes.filter(l => l.produit_id).map(l => ({
            produit_id: l.produit_id,
            quantite_commandee: l.quantite_commandee,
            prix_unitaire: l.prix_unitaire,
          })),
        })
        onClose()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #1e2d4a' }}>
          <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
            {blPreRempli ? 'Commande depuis BL importé' : 'Nouvelle commande'}
          </h2>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={20} /></button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {blPreRempli && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: '#0a1f3d', border: '1px solid #1d4ed8', color: '#60a5fa' }}>
              ✨ {blPreRempli.lignes.length} produits importés depuis le BL de {blPreRempli.fournisseur.nom}
            </div>
          )}

          {/* Fournisseur + date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Fournisseur *</label>
              <select value={fournisseurId} onChange={e => setFournisseurId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="">Sélectionner...</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Livraison prévue</label>
              <input type="date" value={dateLivraison} onChange={e => setDateLivraison(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Lignes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Lignes de commande</label>
              <button onClick={addLigne}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                style={{ color: '#60a5fa', background: '#0a1f3d' }}>
                <Plus size={12} /> Ajouter
              </button>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold uppercase"
                style={{ background: '#0a1628', color: '#3b5280' }}>
                <span className="col-span-4">Produit</span>
                <span className="col-span-2">Qté</span>
                <span className="col-span-2">Unité</span>
                <span className="col-span-3">Prix HT (€)</span>
                <span className="col-span-1"></span>
              </div>

              {lignes.map((ligne, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 items-center"
                  style={{ background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderTop: '1px solid #1a2540' }}>
                  <input className="col-span-4 px-2 py-1.5 rounded text-sm outline-none"
                    style={inputStyle} placeholder="Nom produit"
                    value={ligne.nom}
                    onChange={e => updateLigne(i, 'nom', e.target.value)} />
                  <input type="number" min="0" step="0.1"
                    className="col-span-2 px-2 py-1.5 rounded text-sm outline-none"
                    style={inputStyle} value={ligne.quantite_commandee}
                    onChange={e => updateLigne(i, 'quantite_commandee', parseFloat(e.target.value) || 0)} />
                  <select className="col-span-2 px-2 py-1.5 rounded text-sm outline-none"
                    style={inputStyle} value={ligne.unite}
                    onChange={e => updateLigne(i, 'unite', e.target.value)}>
                    {['kg', 'g', 'L', 'cl', 'pièce', 'boîte', 'carton', 'sachet'].map(u => <option key={u}>{u}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01"
                    className="col-span-3 px-2 py-1.5 rounded text-sm outline-none"
                    style={inputStyle} placeholder="0.00"
                    value={ligne.prix_unitaire ?? ''}
                    onChange={e => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value) || 0)} />
                  <button onClick={() => removeLigne(i)} className="col-span-1 flex justify-center"
                    style={{ color: '#f87171' }} disabled={lignes.length === 1}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          {totalHT > 0 && (
            <div className="flex justify-end">
              <div className="text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: '#0a1f3d', color: '#60a5fa' }}>
                Total HT : {totalHT.toFixed(2)} €
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Note (optionnel)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Instructions spéciales..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0 space-y-3" style={{ borderTop: '1px solid #1e2d4a' }}>
          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Créer la commande
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
