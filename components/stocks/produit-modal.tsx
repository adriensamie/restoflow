'use client'

import { useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { creerProduit, modifierProduit } from '@/lib/actions/stocks'

const CATEGORIES = ['Viande', 'Poisson', 'Légumes', 'Fruits', 'Épicerie', 'Boissons', 'Produits laitiers', 'Autre']
const UNITES = ['kg', 'g', 'L', 'cl', 'pièce', 'boîte', 'sachet', 'bouteille', 'portion']

interface Props {
  produit?: {
    produit_id: string
    nom: string
    categorie: string
    unite: string
    prix_unitaire: number | null
    seuil_alerte: number
  }
  onClose: () => void
}

export function ProduitModal({ produit, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nom: produit?.nom ?? '',
    categorie: produit?.categorie ?? 'Autre',
    unite: produit?.unite ?? 'kg',
    prix_unitaire: produit?.prix_unitaire?.toString() ?? '',
    seuil_alerte: produit?.seuil_alerte?.toString() ?? '0',
    description: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.nom.trim()) { setError('Le nom est requis'); return }
    setError('')

    startTransition(async () => {
      try {
        const data = {
          nom: form.nom.trim(),
          categorie: form.categorie,
          unite: form.unite,
          prix_unitaire: form.prix_unitaire ? parseFloat(form.prix_unitaire) : undefined,
          seuil_alerte: parseFloat(form.seuil_alerte) || 0,
          description: form.description || undefined,
        }
        if (produit) {
          await modifierProduit(produit.produit_id, data)
        } else {
          await creerProduit(data)
        }
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
            {produit ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={20} /></button>
        </div>

        {/* Champs */}
        <div className="space-y-4">
          <Field label="Nom du produit *">
            <input
              value={form.nom}
              onChange={e => set('nom', e.target.value)}
              placeholder="Ex: Tomates cerises"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select
                value={form.categorie}
                onChange={e => set('categorie', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Unité">
              <select
                value={form.unite}
                onChange={e => set('unite', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              >
                {UNITES.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix unitaire (€)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.prix_unitaire}
                onChange={e => set('prix_unitaire', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              />
            </Field>

            <Field label="Seuil d'alerte">
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.seuil_alerte}
                onChange={e => set('seuil_alerte', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              />
            </Field>
          </div>
        </div>

        {error && (
          <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {produit ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>{label}</label>
      {children}
    </div>
  )
}
