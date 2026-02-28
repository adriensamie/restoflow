'use client'

import { useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { creerFournisseur, modifierFournisseur } from '@/lib/actions/commandes'

interface Props {
  fournisseur?: {
    id: string; nom: string; contact_nom?: string | null
    contact_email?: string | null; contact_telephone?: string | null
    adresse?: string | null; delai_livraison?: number | null; conditions_paiement?: string | null
  }
  onClose: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0'
}

export function FournisseurModal({ fournisseur, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nom: fournisseur?.nom ?? '',
    contact_nom: fournisseur?.contact_nom ?? '',
    contact_email: fournisseur?.contact_email ?? '',
    contact_telephone: fournisseur?.contact_telephone ?? '',
    adresse: fournisseur?.adresse ?? '',
    delai_livraison: fournisseur?.delai_livraison?.toString() ?? '2',
    conditions_paiement: fournisseur?.conditions_paiement ?? '30 jours',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.nom.trim()) { setError('Le nom est requis'); return }
    setError('')
    startTransition(async () => {
      try {
        const data = {
          nom: form.nom.trim(),
          contact_nom: form.contact_nom || undefined,
          contact_email: form.contact_email || undefined,
          contact_telephone: form.contact_telephone || undefined,
          adresse: form.adresse || undefined,
          delai_livraison: parseInt(form.delai_livraison) || 2,
          conditions_paiement: form.conditions_paiement || undefined,
        }
        if (fournisseur) await modifierFournisseur(fournisseur.id, data)
        else await creerFournisseur(data)
        onClose()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-5" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
            {fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </h2>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <Field label="Nom du fournisseur *">
            <input value={form.nom} onChange={e => set('nom', e.target.value)}
              placeholder="Ex: Metro, Pomona, Transgourmet..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact (nom)">
              <input value={form.contact_nom} onChange={e => set('contact_nom', e.target.value)}
                placeholder="Jean Dupont"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Téléphone">
              <input value={form.contact_telephone} onChange={e => set('contact_telephone', e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </Field>
          </div>

          <Field label="Email">
            <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
              placeholder="commandes@fournisseur.fr"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Délai livraison (jours)">
              <input type="number" min="1" max="30" value={form.delai_livraison}
                onChange={e => set('delai_livraison', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Conditions paiement">
              <select value={form.conditions_paiement} onChange={e => set('conditions_paiement', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                {['Comptant', '15 jours', '30 jours', '45 jours', '60 jours'].map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {fournisseur ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
