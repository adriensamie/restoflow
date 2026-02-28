'use client'

import { useState, useTransition } from 'react'
import { Package, AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { majStatutLot } from '@/lib/actions/lots'

interface Lot {
  id: string
  numero_lot: string | null
  quantite: number
  dlc: string | null
  dluo: string | null
  statut: string
  produits?: { nom: string; unite: string } | null
}

export function LotsPanel({ lots }: { lots: Lot[] }) {
  const [isPending, startTransition] = useTransition()

  const getDlcStatus = (dlc: string | null) => {
    if (!dlc) return { color: '#4a6fa5', label: 'Pas de DLC' }
    const days = Math.ceil((new Date(dlc).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { color: '#f87171', label: `Expire il y a ${-days}j` }
    if (days <= 3) return { color: '#f87171', label: `Expire dans ${days}j` }
    if (days <= 7) return { color: '#fbbf24', label: `DLC dans ${days}j` }
    return { color: '#4ade80', label: `DLC dans ${days}j` }
  }

  const handleJeter = (lotId: string) => {
    startTransition(async () => {
      await majStatutLot(lotId, 'jete')
    })
  }

  if (lots.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
        style={{ color: '#3b5280' }}>
        <Package size={12} /> Lots & DLC
      </h4>
      {lots.map(lot => {
        const status = getDlcStatus(lot.dlc)
        return (
          <div key={lot.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
            <div className="flex-1">
              <p className="text-sm" style={{ color: '#e2e8f0' }}>
                {lot.produits?.nom ?? 'Produit'} {lot.numero_lot && `(Lot ${lot.numero_lot})`}
              </p>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>
                {lot.quantite} {lot.produits?.unite ?? 'u'}
              </p>
            </div>
            <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
            {lot.dlc && new Date(lot.dlc) < new Date() && (
              <button onClick={() => handleJeter(lot.id)} disabled={isPending}
                className="p-1 rounded" style={{ color: '#f87171' }} title="Marquer comme jete">
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
