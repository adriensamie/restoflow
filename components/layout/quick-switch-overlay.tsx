'use client'

import { useState, useTransition } from 'react'
import { X, Users } from 'lucide-react'
import { PinPad } from '@/components/kiosk/pin-pad'

interface StaffItem {
  id: string
  nom: string
  prenom: string
  role: string
  initiales: string
}

interface Props {
  staffList: StaffItem[]
  currentStaffId: string
  organizationId: string
  onAuthenticate: (staffId: string, pin: string) => Promise<void>
  onClose: () => void
}

export function QuickSwitchOverlay({ staffList, currentStaffId, organizationId, onAuthenticate, onClose }: Props) {
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md space-y-6"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} style={{ color: '#60a5fa' }} />
            <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
              {selectedStaff ? `PIN — ${selectedStaff.prenom}` : 'Changer d\'employe'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: '#4a6fa5' }}>
            <X size={18} />
          </button>
        </div>

        {!selectedStaff ? (
          <div className="space-y-2">
            {staffList.map(s => (
              <button key={s.id} onClick={() => setSelectedStaff(s)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                style={{
                  background: s.id === currentStaffId ? '#1a2d5a' : '#0a1120',
                  border: `1px solid ${s.id === currentStaffId ? '#3b82f6' : '#1e2d4a'}`,
                }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: '#1e2d4a', color: '#60a5fa' }}>
                  {s.initiales || `${s.prenom[0]}${s.nom[0]}`}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{s.prenom} {s.nom}</p>
                  <p className="text-xs capitalize" style={{ color: '#4a6fa5' }}>{s.role}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <PinPad
            title={`PIN de ${selectedStaff.prenom}`}
            onSubmit={async (pin) => {
              await onAuthenticate(selectedStaff.id, pin)
              onClose()
            }}
          />
        )}

        {selectedStaff && (
          <button onClick={() => setSelectedStaff(null)}
            className="text-sm w-full text-center py-2" style={{ color: '#4a6fa5' }}>
            ← Retour a la liste
          </button>
        )}
      </div>
    </div>
  )
}
