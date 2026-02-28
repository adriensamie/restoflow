'use client'

import { Star } from 'lucide-react'

interface Props {
  score: number | null
  nbLivraisons?: number
  compact?: boolean
}

export function FournisseurScoreBadge({ score, nbLivraisons, compact = false }: Props) {
  if (score == null) return null

  const color = score >= 8 ? '#4ade80' : score >= 5 ? '#fbbf24' : '#f87171'
  const bg = score >= 8 ? '#051a0a' : score >= 5 ? '#1a1505' : '#1a0505'

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold"
        style={{ background: bg, color }}>
        <Star size={10} />
        {score.toFixed(1)}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{ background: bg, border: `1px solid ${color}30` }}>
      <Star size={14} style={{ color }} />
      <div>
        <span className="text-sm font-bold" style={{ color }}>{score.toFixed(1)}/10</span>
        {nbLivraisons != null && (
          <span className="text-xs ml-2" style={{ color: '#4a6fa5' }}>
            ({nbLivraisons} livraison{nbLivraisons > 1 ? 's' : ''})
          </span>
        )}
      </div>
    </div>
  )
}
