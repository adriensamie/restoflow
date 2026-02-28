'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#080d1a' }}>
      <div className="text-center max-w-md mx-auto p-8 rounded-2xl"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <AlertTriangle size={32} className="mx-auto mb-4" style={{ color: '#f87171' }} />
        <h2 className="text-lg font-bold mb-2" style={{ color: '#e2e8f0' }}>
          Erreur inattendue
        </h2>
        <p className="text-sm mb-6" style={{ color: '#4a6fa5' }}>
          Un problème est survenu. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white mx-auto"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          <RefreshCw size={14} />
          Réessayer
        </button>
      </div>
    </div>
  )
}
