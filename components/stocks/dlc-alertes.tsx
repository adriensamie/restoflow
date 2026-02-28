'use client'

import { AlertTriangle, Clock } from 'lucide-react'

interface LotExpiration {
  id: string
  dlc: string
  quantite: number
  produits?: { nom: string; unite: string } | null
}

export function DlcAlertes({ lots }: { lots: LotExpiration[] }) {
  if (lots.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
        style={{ color: '#f97316' }}>
        <Clock size={12} /> DLC/DLUO proches — {lots.length} lot{lots.length > 1 ? 's' : ''}
      </h4>
      {lots.map(lot => {
        const days = Math.ceil((new Date(lot.dlc).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        const isExpired = days < 0
        return (
          <div key={lot.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{
              background: isExpired ? '#1a0505' : '#1a1505',
              border: `1px solid ${isExpired ? '#7f1d1d' : '#78350f'}`,
            }}>
            <AlertTriangle size={14} style={{ color: isExpired ? '#f87171' : '#fbbf24' }} />
            <div className="flex-1">
              <p className="text-sm" style={{ color: '#e2e8f0' }}>
                {lot.produits?.nom ?? 'Produit'}
              </p>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>{lot.quantite} {lot.produits?.unite ?? 'u'}</p>
            </div>
            <span className="text-xs font-bold" style={{ color: isExpired ? '#f87171' : '#fbbf24' }}>
              {isExpired ? `Expire (${-days}j)` : `${days}j restant${days > 1 ? 's' : ''}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
