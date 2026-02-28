'use client'

import { useState } from 'react'
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs'
import { Bell, Users } from 'lucide-react'
import { NotificationBadge } from '@/components/layout/notification-badge'
import { NotificationPanel } from '@/components/layout/notification-panel'

interface Props {
  role?: string
  staffName?: string
}

export function Header({ role = 'patron', staffName = '' }: Props) {
  const [showNotifs, setShowNotifs] = useState(false)

  return (
    <>
      <header className="px-6 py-3 flex items-center justify-between" style={{ background: '#080d1a', borderBottom: '1px solid #1e2d4a' }}>
        <div className="flex items-center gap-3">
          <OrganizationSwitcher
            hidePersonal={true}
            createOrganizationMode="modal"
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'flex items-center',
                organizationSwitcherTrigger:
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
              },
            }}
          />
          {staffName && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <Users size={12} style={{ color: '#60a5fa' }} />
              <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{staffName}</span>
              <span className="text-xs capitalize px-1.5 py-0.5 rounded" style={{ background: '#1e2d4a', color: '#60a5fa' }}>{role}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NotificationBadge onClick={() => setShowNotifs(true)} />

          <UserButton
            signInUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </div>
      </header>
      {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
    </>
  )
}
