'use client'

import { useState, useTransition } from 'react'
import { Truck, ChevronDown, ChevronUp, CheckCircle, Package } from 'lucide-react'
import { receptionnerLivraison } from '@/lib/actions/commandes'

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  envoyee:          { label: 'Envoyée',           color: '#60a5fa', bg: '#0a1f3d' },
  confirmee:        { label: 'Confirmée',         color: '#4ade80', bg: '#0a2d1a' },
  recue_partielle:  { label: 'Reçue partielle',   color: '#fbbf24', bg: '#1a1505' },
}

export function LivraisonsClient({ commandes }: { commandes: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [quantites, setQuantites] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [done, setDone] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const setQ = (ligneId: string, val: number) => setQuantites(q => ({ ...q, [ligneId]: val }))
  const setN = (ligneId: string, val: string) => setNotes(n => ({ ...n, [ligneId]: val }))

  const handleReceptionner = (commande: any) => {
    const lignes = commande.commande_lignes || []
    setError(null)
    startTransition(async () => {
      try {
        await receptionnerLivraison(
          commande.id,
          lignes.map((l: any) => ({
            ligne_id: l.id,
            produit_id: l.produit_id,
            quantite_commandee: l.quantite_commandee,
            quantite_recue: quantites[l.id] ?? l.quantite_commandee,
            prix_unitaire: l.prix_unitaire ?? undefined,
            note_ecart: notes[l.id] || undefined,
          }))
        )
        setDone(prev => new Set([...prev, commande.id]))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur lors de la réception')
      }
    })
  }

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '6px',
    padding: '4px 8px', outline: 'none', fontSize: '13px', width: '80px'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}>
          <Truck size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Livraisons</h1>
          <p className="text-sm mt-0.5" style={{ color: '#4a6fa5' }}>
            {commandes.length} livraison{commandes.length > 1 ? 's' : ''} en attente de réception
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: '#1a0505', color: '#f87171', border: '1px solid #dc2626' }}>
          {error}
        </div>
      )}

      {commandes.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <Truck size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#60a5fa' }} />
          <p className="text-sm" style={{ color: '#2d4a7a' }}>Aucune livraison en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {commandes.map(cmd => {
            const isDone = done.has(cmd.id)
            const isExpanded = expandedId === cmd.id
            const statConf = STATUT_CONFIG[cmd.statut] ?? STATUT_CONFIG.envoyee
            const lignes = cmd.commande_lignes || []

            return (
              <div key={cmd.id} className="rounded-xl overflow-hidden"
                style={{ background: '#0d1526', border: `1px solid ${isDone ? '#15803d' : '#1e2d4a'}` }}>
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : cmd.id)}>
                  {isDone
                    ? <CheckCircle size={18} style={{ color: '#4ade80' }} />
                    : <Package size={18} style={{ color: '#60a5fa' }} />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                        {cmd.fournisseurs?.nom || 'Fournisseur inconnu'}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: isDone ? '#0a2d1a' : statConf.bg, color: isDone ? '#4ade80' : statConf.color }}>
                        {isDone ? '✓ Réceptionné' : statConf.label}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>
                      {cmd.numero} · {lignes.length} produit{lignes.length > 1 ? 's' : ''}
                      {cmd.date_livraison_prevue && ` · ${new Date(cmd.date_livraison_prevue).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {cmd.total_ht != null && cmd.total_ht > 0 && <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>{cmd.total_ht} €</p>}
                    {isExpanded ? <ChevronUp size={16} style={{ color: '#4a6fa5' }} /> : <ChevronDown size={16} style={{ color: '#4a6fa5' }} />}
                  </div>
                </div>

                {isExpanded && !isDone && (
                  <div style={{ borderTop: '1px solid #1e2d4a' }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: '#0a1120' }}>
                          {['Produit', 'Commandé', 'Reçu', 'Écart', 'Note'].map(h => (
                            <th key={h} className="text-left px-4 py-2 text-xs font-semibold uppercase"
                              style={{ color: '#3b5280' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lignes.map((l: any, i: number) => {
                          const qteRecue = quantites[l.id] ?? l.quantite_commandee
                          const ecart = qteRecue - l.quantite_commandee
                          return (
                            <tr key={l.id} style={{ background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderBottom: '1px solid #1a2540' }}>
                              <td className="px-4 py-2.5">
                                <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{l.produits?.nom || 'Produit'}</p>
                                <p className="text-xs" style={{ color: '#4a6fa5' }}>{l.produits?.unite}</p>
                              </td>
                              <td className="px-4 py-2.5 text-sm" style={{ color: '#60a5fa' }}>{l.quantite_commandee}</td>
                              <td className="px-4 py-2.5">
                                <input type="number" step="0.1"
                                  value={quantites[l.id] ?? l.quantite_commandee}
                                  onChange={e => setQ(l.id, parseFloat(e.target.value) || 0)}
                                  style={inputStyle} />
                              </td>
                              <td className="px-4 py-2.5 text-sm font-bold"
                                style={{ color: ecart < 0 ? '#f87171' : ecart > 0 ? '#4ade80' : '#4a6fa5' }}>
                                {ecart !== 0 ? `${ecart > 0 ? '+' : ''}${ecart.toFixed(1)}` : '—'}
                              </td>
                              <td className="px-4 py-2.5">
                                <input value={notes[l.id] || ''} onChange={e => setN(l.id, e.target.value)}
                                  placeholder="Note..." style={{ ...inputStyle, width: '140px' }} />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="flex justify-end px-4 py-3" style={{ borderTop: '1px solid #1e2d4a' }}>
                      <button onClick={() => handleReceptionner(cmd)} disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                        <CheckCircle size={14} />
                        {isPending ? 'Réception...' : 'Confirmer la réception'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
