'use client'

import { useState, useTransition } from 'react'
import { X, FileText, Mail, Loader2, Download } from 'lucide-react'
import { creerRetour } from '@/lib/actions/retours'

interface Ecart {
  ligne_id: string
  produit_id: string
  produit_nom: string
  unite: string
  quantite_commandee: number
  quantite_recue: number
  prix_unitaire?: number
  note_ecart?: string
}

interface Props {
  commandeId: string
  fournisseurId: string
  fournisseurEmail: string | null
  ecarts: Ecart[]
  onClose: () => void
}

export function RetourModal({ commandeId, fournisseurId, fournisseurEmail, ecarts, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [lignes, setLignes] = useState(
    ecarts.map(e => ({
      produit_id: e.produit_id,
      produit_nom: e.produit_nom,
      unite: e.unite,
      quantite_retournee: Math.max(0, e.quantite_commandee - e.quantite_recue),
      prix_unitaire: e.prix_unitaire ?? 0,
      motif: e.note_ecart ?? '',
    }))
  )
  const [retourId, setRetourId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const totalHt = lignes.reduce((acc, l) => acc + l.quantite_retournee * l.prix_unitaire, 0)

  const handleCreer = () => {
    startTransition(async () => {
      try {
        const result = await creerRetour({
          commande_id: commandeId,
          fournisseur_id: fournisseurId,
          lignes: lignes.filter(l => l.quantite_retournee > 0).map(l => ({
            produit_id: l.produit_id,
            quantite_retournee: l.quantite_retournee,
            prix_unitaire: l.prix_unitaire,
            motif: l.motif,
          })),
        })
        setRetourId(result.id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  const handleSendEmail = () => {
    if (!retourId) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/retours/envoyer-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ retourId }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error)
        }
        setEmailSent(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur envoi email')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>Bon de retour fournisseur</h2>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={18} /></button>
        </div>

        {/* Lines */}
        <div className="space-y-2">
          {lignes.map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-lg"
              style={{ background: '#0a1120', border: '1px solid #1a2540' }}>
              <div className="col-span-4">
                <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{l.produit_nom}</p>
                <p className="text-xs" style={{ color: '#4a6fa5' }}>{l.unite}</p>
              </div>
              <div className="col-span-2">
                <input type="number" min="0" step="0.1"
                  value={l.quantite_retournee}
                  onChange={e => setLignes(prev => prev.map((p, j) => j === i ? { ...p, quantite_retournee: parseFloat(e.target.value) || 0 } : p))}
                  className="w-full px-2 py-1 rounded text-sm outline-none"
                  style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }} />
              </div>
              <div className="col-span-2">
                <input type="number" min="0" step="0.01"
                  value={l.prix_unitaire}
                  onChange={e => setLignes(prev => prev.map((p, j) => j === i ? { ...p, prix_unitaire: parseFloat(e.target.value) || 0 } : p))}
                  className="w-full px-2 py-1 rounded text-sm outline-none"
                  style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }} />
              </div>
              <div className="col-span-4">
                <input value={l.motif} placeholder="Motif..."
                  onChange={e => setLignes(prev => prev.map((p, j) => j === i ? { ...p, motif: e.target.value } : p))}
                  className="w-full px-2 py-1 rounded text-xs outline-none"
                  style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: '#60a5fa' }}>Total HT : {totalHt.toFixed(2)} EUR</p>
        </div>

        {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
        {emailSent && <p className="text-sm" style={{ color: '#4ade80' }}>Email envoye au fournisseur !</p>}

        <div className="flex gap-3 justify-end">
          {!retourId ? (
            <button onClick={handleCreer} disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Creer le bon de retour
            </button>
          ) : (
            <>
              {fournisseurEmail && !emailSent && (
                <button onClick={handleSendEmail} disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  Envoyer par email
                </button>
              )}
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#1e2d4a', color: '#94a3b8' }}>
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
