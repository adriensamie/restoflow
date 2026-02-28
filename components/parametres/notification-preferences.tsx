'use client'

import { useState, useTransition } from 'react'
import { Bell, Save, Loader2 } from 'lucide-react'
import { updatePreference } from '@/lib/actions/notifications'

const NOTIF_TYPES = [
  { type: 'stock_critique', label: 'Stocks critiques' },
  { type: 'ecart_livraison', label: 'Ecarts livraison' },
  { type: 'haccp_non_conforme', label: 'Non-conformites HACCP' },
  { type: 'annulation_suspecte', label: 'Annulations suspectes' },
  { type: 'hausse_prix', label: 'Hausse de prix' },
  { type: 'dlc_proche', label: 'DLC/DLUO proches' },
  { type: 'retour_statut', label: 'Statut retours' },
]

const CANAUX = [
  { key: 'in_app', label: 'In-App' },
  { key: 'web_push', label: 'Push' },
  { key: 'email', label: 'Email' },
] as const

interface Props {
  staffId: string
  initialPreferences: Record<string, { in_app: boolean; web_push: boolean; email: boolean }>
}

export function NotificationPreferences({ staffId, initialPreferences }: Props) {
  const [prefs, setPrefs] = useState(initialPreferences)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const toggle = (type: string, canal: string) => {
    setPrefs(prev => ({
      ...prev,
      [type]: {
        in_app: prev[type]?.in_app ?? true,
        web_push: prev[type]?.web_push ?? false,
        email: prev[type]?.email ?? false,
        [canal]: !(prev[type]?.[canal as keyof typeof prev[string]] ?? false),
      },
    }))
    setSaved(false)
  }

  const handleSaveAll = () => {
    startTransition(async () => {
      for (const type of NOTIF_TYPES) {
        const p = prefs[type.type] ?? { in_app: true, web_push: false, email: false }
        await updatePreference({
          staff_id: staffId,
          type: type.type,
          in_app: p.in_app,
          web_push: p.web_push,
          email: p.email,
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell size={16} style={{ color: '#60a5fa' }} />
        <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Preferences de notification</h3>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
        <div className="grid gap-2 px-4 py-3 text-xs font-semibold uppercase"
          style={{ background: '#0a1628', color: '#3b5280', gridTemplateColumns: '200px repeat(3, 80px)' }}>
          <span>Type</span>
          {CANAUX.map(c => <span key={c.key} className="text-center">{c.label}</span>)}
        </div>

        {NOTIF_TYPES.map((t, i) => (
          <div key={t.type} className="grid gap-2 px-4 py-2.5 items-center"
            style={{ gridTemplateColumns: '200px repeat(3, 80px)', background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderTop: '1px solid #1a2540' }}>
            <span className="text-sm" style={{ color: '#94a3b8' }}>{t.label}</span>
            {CANAUX.map(c => {
              const checked = prefs[t.type]?.[c.key] ?? (c.key === 'in_app')
              return (
                <div key={c.key} className="flex justify-center">
                  <button onClick={() => toggle(t.type, c.key)}
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: checked ? '#1d4ed8' : '#1a2540', border: `1px solid ${checked ? '#3b82f6' : '#2d4a7a'}` }}>
                    {checked && <span className="text-white text-xs">✓</span>}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSaveAll} disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Sauvegarder
        </button>
        {saved && <span className="text-sm" style={{ color: '#4ade80' }}>Sauvegarde !</span>}
      </div>
    </div>
  )
}
