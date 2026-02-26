'use client'

import { useState } from 'react'
import { Plus, TrendingDown } from 'lucide-react'
import { MouvementModal } from './mouvement-modal'

interface Props {
  totalMois: number
}

export function PertesHeader({ totalMois }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Pertes</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            Suivi des pertes et gaspillages
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ background: '#1a0a0a', border: '1px solid #7f1d1d' }}
          >
            <TrendingDown size={15} style={{ color: '#f87171' }} />
            <span className="text-sm font-semibold" style={{ color: '#f87171' }}>
              {totalMois.toFixed(2)} € ce mois
            </span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)' }}
          >
            <Plus size={16} />
            Déclarer une perte
          </button>
        </div>
      </div>

      {showModal && (
        <MouvementModal typeForcé="perte" onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
