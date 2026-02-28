'use client'

import { useState, useTransition } from 'react'
import { Key, Trash2, Loader2, Check } from 'lucide-react'
import { setStaffPin, removeStaffPin } from '@/lib/actions/pin'

interface StaffItem {
  id: string
  nom: string
  prenom: string
  role: string
  pin_hash: string | null
}

interface Props {
  staffList: StaffItem[]
}

export function PinManagement({ staffList }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newPin, setNewPin] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const handleSetPin = (staffId: string) => {
    if (!/^\d{4,6}$/.test(newPin)) {
      setMessage('Le PIN doit contenir 4 a 6 chiffres')
      return
    }
    startTransition(async () => {
      try {
        await setStaffPin(staffId, newPin)
        setEditingId(null)
        setNewPin('')
        setMessage('PIN configure')
        setTimeout(() => setMessage(null), 2000)
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  const handleRemovePin = (staffId: string) => {
    startTransition(async () => {
      try {
        await removeStaffPin(staffId)
        setMessage('PIN supprime')
        setTimeout(() => setMessage(null), 2000)
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Key size={16} style={{ color: '#60a5fa' }} />
        <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Gestion des PIN</h3>
      </div>

      {message && <p className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#0a1120', color: '#4ade80' }}>{message}</p>}

      <div className="space-y-2">
        {staffList.map(s => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{s.prenom} {s.nom}</p>
              <p className="text-xs capitalize" style={{ color: '#4a6fa5' }}>
                {s.role} · {s.pin_hash ? 'PIN actif' : 'Pas de PIN'}
              </p>
            </div>

            {editingId === s.id ? (
              <div className="flex items-center gap-2">
                <input type="password" maxLength={6} value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4-6 chiffres"
                  className="w-28 px-2 py-1.5 rounded text-sm outline-none"
                  style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }} />
                <button onClick={() => handleSetPin(s.id)} disabled={isPending}
                  className="p-1.5 rounded-lg" style={{ color: '#4ade80' }}>
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => { setEditingId(null); setNewPin('') }}
                  className="text-xs" style={{ color: '#4a6fa5' }}>Annuler</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingId(s.id); setNewPin('') }}
                  className="px-3 py-1 rounded-lg text-xs font-medium"
                  style={{ background: '#1e2d4a', color: '#60a5fa' }}>
                  {s.pin_hash ? 'Modifier' : 'Definir PIN'}
                </button>
                {s.pin_hash && (
                  <button onClick={() => handleRemovePin(s.id)} disabled={isPending}
                    className="p-1.5 rounded-lg" style={{ color: '#f87171' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
