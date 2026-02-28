'use client'

import { useState, useEffect } from 'react'
import { LogOut, RefreshCw, UtensilsCrossed } from 'lucide-react'

interface Props {
  staffName: string
  role: string
  onLogout: () => void
  onSwitch: () => void
}

export function KioskHeader({ staffName, role, onLogout, onSwitch }: Props) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="px-6 py-4 flex items-center justify-between"
      style={{ background: '#0a0f1e', borderBottom: '1px solid #1e2d4a' }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          <UtensilsCrossed size={15} className="text-white" />
        </div>
        <span className="font-bold text-white">RestoFlow Kiosk</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{staffName}</p>
          <p className="text-xs capitalize" style={{ color: '#4a6fa5' }}>{role}</p>
        </div>

        <span className="text-lg font-mono" style={{ color: '#60a5fa' }}>
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>

        <button onClick={onSwitch}
          className="p-2 rounded-lg transition-all"
          style={{ color: '#4a6fa5', background: '#0d1526', border: '1px solid #1e2d4a' }}
          title="Changer d'employe">
          <RefreshCw size={16} />
        </button>

        <button onClick={onLogout}
          className="p-2 rounded-lg transition-all"
          style={{ color: '#f87171', background: '#1a0505', border: '1px solid #7f1d1d' }}
          title="Deconnexion">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
