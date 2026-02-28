'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm"
      style={{ background: 'linear-gradient(90deg, #1e3a5f, #1e2d4a)', borderBottom: '1px solid #2d4a7a' }}>
      <div className="flex items-center gap-2 text-blue-300">
        <Clock size={14} />
        <span>Essai gratuit — <strong>{daysLeft} jour{daysLeft > 1 ? 's' : ''}</strong> restant{daysLeft > 1 ? 's' : ''}</span>
      </div>
      <Link href="/billing" className="px-3 py-1 rounded text-xs font-medium text-white"
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
        Choisir un plan
      </Link>
    </div>
  )
}
