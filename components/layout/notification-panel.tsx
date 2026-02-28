'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, Check, CheckCheck, Bell, Package, AlertTriangle, Thermometer, TrendingUp, Shield } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/actions/notifications'

const TYPE_ICONS: Record<string, any> = {
  stock_critique: { icon: Package, color: '#f87171' },
  ecart_livraison: { icon: AlertTriangle, color: '#fbbf24' },
  haccp_non_conforme: { icon: Thermometer, color: '#f97316' },
  annulation_suspecte: { icon: Shield, color: '#a78bfa' },
  hausse_prix: { icon: TrendingUp, color: '#f87171' },
  dlc_proche: { icon: AlertTriangle, color: '#f97316' },
  info: { icon: Bell, color: '#60a5fa' },
}

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getNotifications(50).then(setNotifications).catch(() => {})
  }, [])

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n))
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })))
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 z-50 flex flex-col shadow-2xl"
      style={{ background: '#0d1526', borderLeft: '1px solid #1e2d4a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1e2d4a' }}>
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color: '#60a5fa' }} />
          <span className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Notifications</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleMarkAllRead} disabled={isPending}
            className="text-xs px-2 py-1 rounded" style={{ color: '#4a6fa5' }} title="Tout marquer comme lu">
            <CheckCheck size={14} />
          </button>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={16} /></button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 && (
          <div className="p-8 text-center">
            <Bell size={24} className="mx-auto mb-2" style={{ color: '#2d4a7a' }} />
            <p className="text-sm" style={{ color: '#4a6fa5' }}>Aucune notification</p>
          </div>
        )}

        {notifications.map(n => {
          const cfg = TYPE_ICONS[n.type] ?? TYPE_ICONS.info
          const Icon = cfg.icon
          return (
            <div key={n.id}
              className="flex items-start gap-3 px-4 py-3 transition-all cursor-pointer"
              style={{
                background: n.lue ? 'transparent' : '#0a1628',
                borderBottom: '1px solid #1a2540',
              }}
              onClick={() => !n.lue && handleMarkRead(n.id)}>
              <Icon size={16} className="mt-0.5 flex-shrink-0" style={{ color: cfg.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: n.lue ? '#4a6fa5' : '#e2e8f0' }}>
                  {n.titre}
                </p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#4a6fa5' }}>
                  {n.message}
                </p>
                <p className="text-xs mt-1" style={{ color: '#2d4a7a' }}>
                  {new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.lue && (
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#3b82f6' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
