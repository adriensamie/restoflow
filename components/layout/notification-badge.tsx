'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { getUnreadCount } from '@/lib/actions/notifications'

export function NotificationBadge({ onClick }: { onClick: () => void }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    getUnreadCount().then(setCount).catch(() => {})
    const interval = setInterval(() => {
      getUnreadCount().then(setCount).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <button onClick={onClick} className="relative p-2 rounded-lg transition-all"
      style={{ color: count > 0 ? '#f87171' : '#4a6fa5' }} aria-label="Notifications">
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full text-xs font-bold flex items-center justify-center text-white"
          style={{ background: '#dc2626', fontSize: '10px', minWidth: '18px', height: '18px' }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
