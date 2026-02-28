'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  variationPct: number | null
  seuil?: number
}

export function PrixAlerteBadge({ variationPct, seuil = 10 }: Props) {
  if (variationPct == null || Math.abs(variationPct) < 1) return null

  const isHausse = variationPct > 0
  const isAlerte = Math.abs(variationPct) >= seuil
  const Icon = isHausse ? TrendingUp : TrendingDown
  const color = isAlerte ? (isHausse ? '#f87171' : '#4ade80') : '#fbbf24'
  const bg = isAlerte ? (isHausse ? '#1a0505' : '#051a0a') : '#1a1505'

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
      style={{ background: bg, color }}>
      <Icon size={10} />
      {isHausse ? '+' : ''}{variationPct.toFixed(1)}%
    </span>
  )
}
