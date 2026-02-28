'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto p-8 rounded-2xl"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#1a0505', border: '1px solid #7f1d1d' }}>
          <AlertTriangle size={24} style={{ color: '#f87171' }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#e2e8f0' }}>
          Erreur de chargement
        </h2>
        <p className="text-sm mb-6" style={{ color: '#4a6fa5' }}>
          Une erreur est survenue lors du chargement de cette page.
          Cela peut être temporaire.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <RefreshCw size={14} />
            Réessayer
          </button>
          <a href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>
            <Home size={14} />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
