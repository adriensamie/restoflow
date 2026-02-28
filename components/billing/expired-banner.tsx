'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export function ExpiredBanner({ reason }: { reason: 'trial_expired' | 'past_due' }) {
  const message = reason === 'trial_expired'
    ? 'Votre essai gratuit est termine. Choisissez un plan pour continuer.'
    : 'Paiement echoue. Veuillez mettre a jour votre moyen de paiement.'

  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm"
      style={{ background: 'linear-gradient(90deg, #5f1e1e, #4a1e1e)', borderBottom: '1px solid #7a2d2d' }}>
      <div className="flex items-center gap-2 text-red-300">
        <AlertTriangle size={14} />
        <span>{message}</span>
      </div>
      <Link href="/billing" className="px-3 py-1 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-500">
        {reason === 'trial_expired' ? 'Choisir un plan' : 'Gerer le paiement'}
      </Link>
    </div>
  )
}
