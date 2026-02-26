'use client'

import { useState } from 'react'
import { Plus, ShoppingCart, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { AnalyserBLModal } from './analyser-bl-modal'
import { NouvelleCommandeModal } from './nouvelle-commande-modal'

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  brouillon:        { label: 'Brouillon',        color: '#94a3b8', bg: '#1e293b' },
  envoyee:          { label: 'Envoyée',           color: '#fbbf24', bg: '#2d1f00' },
  confirmee:        { label: 'Confirmée',         color: '#60a5fa', bg: '#0a1f3d' },
  recue_partielle:  { label: 'Reçue (partielle)', color: '#f97316', bg: '#2d1200' },
  recue:            { label: 'Reçue',             color: '#4ade80', bg: '#0a2d1a' },
  annulee:          { label: 'Annulée',           color: '#f87171', bg: '#1a0a0a' },
}

interface Commande {
  id: string; numero: string; statut: string; date_commande: string
  date_livraison_prevue: string | null; total_ht: number | null
  fournisseurs: { nom: string } | null
  commande_lignes: { count: number }[]
}

interface Props {
  commandes: Commande[]
  fournisseurs: { id: string; nom: string }[]
}

export function CommandesClient({ commandes, fournisseurs }: Props) {
  const [showBL, setShowBL] = useState(false)
  const [showNouvelle, setShowNouvelle] = useState(false)
  const [blResultat, setBlResultat] = useState<any>(null)

  const handleBLResultat = (resultat: any) => {
    setBlResultat(resultat)
    setShowNouvelle(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Commandes</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            {commandes.length} commande{commandes.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowBL(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white' }}>
            <Sparkles size={15} />Import IA (photo BL)
          </button>
          <button onClick={() => setShowNouvelle(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <Plus size={16} />Nouvelle commande
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0a1628', borderBottom: '1px solid #1e2d4a' }}>
              {['Numéro', 'Fournisseur', 'Date', 'Livraison prévue', 'Lignes', 'Total HT', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#3b5280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commandes.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: '#2d4a7a' }}>
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                Aucune commande
              </td></tr>
            )}
            {commandes.map((c, i) => {
              const statut = STATUT_CONFIG[c.statut] ?? STATUT_CONFIG.brouillon
              return (
                <tr key={c.id} style={{ background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderBottom: '1px solid #1a2540' }}>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: '#60a5fa' }}>{c.numero}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#e2e8f0' }}>{c.fournisseurs?.nom ?? '—'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>{new Date(c.date_commande).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>{c.date_livraison_prevue ? new Date(c.date_livraison_prevue).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>{c.commande_lignes?.[0]?.count ?? 0} ligne{(c.commande_lignes?.[0]?.count ?? 0) > 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#60a5fa' }}>{c.total_ht ? `${c.total_ht.toFixed(2)} €` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: statut.bg, color: statut.color }}>{statut.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {['brouillon', 'envoyee', 'confirmee'].includes(c.statut) && (
                      <Link href={`/commandes/${c.id}`} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: '#1e2d4a', color: '#60a5fa' }}>
                        {c.statut === 'brouillon' ? 'Modifier' : 'Réceptionner'}
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showBL && <AnalyserBLModal onResultat={handleBLResultat} onClose={() => setShowBL(false)} />}
      {showNouvelle && (
        <NouvelleCommandeModal
          fournisseurs={fournisseurs}
          blPreRempli={blResultat}
          onClose={() => { setShowNouvelle(false); setBlResultat(null) }}
        />
      )}
    </div>
  )
}