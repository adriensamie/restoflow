'use client'

import { useRouter } from 'next/navigation'
import { X, Lock } from 'lucide-react'

interface UpgradeModalProps {
  feature: string
  requiredPlan: string
  onClose: () => void
}

export function UpgradeModal({ feature, requiredPlan, onClose }: UpgradeModalProps) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-xl p-6"
        style={{ background: '#0f1729', border: '1px solid #1e2d4a' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <Lock size={20} className="text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Fonctionnalite {requiredPlan}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            <strong className="text-white">{feature}</strong> est disponible a partir du plan <strong className="text-blue-400">{requiredPlan}</strong>. Mettez a niveau pour debloquer cette fonctionnalite.
          </p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-400"
              style={{ border: '1px solid #1e2d4a' }}>
              Annuler
            </button>
            <button onClick={() => router.push('/billing')}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
              Voir les plans
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
