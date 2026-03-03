'use client'

import { useState } from 'react'
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs'
import { Users, Menu } from 'lucide-react'
import { NotificationBadge } from '@/components/layout/notification-badge'
import { NotificationPanel } from '@/components/layout/notification-panel'
import { SiteSwitcher } from '@/components/layout/site-switcher'
import { useSidebar } from '@/components/layout/sidebar-provider'

interface Props {
  role?: string
  staffName?: string
  childSites?: { id: string; nom: string; slug: string | null }[]
  selectedSiteId?: string | null
}

export function Header({ role = 'patron', staffName = '', childSites = [], selectedSiteId = null }: Props) {
  const [showNotifs, setShowNotifs] = useState(false)
  const { toggle } = useSidebar()

  return (
    <>
      <header className="px-4 md:px-6 py-3 flex items-center justify-between" style={{ background: '#080d1a', borderBottom: '1px solid #1e2d4a' }}>
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <button
            onClick={toggle}
            className="md:hidden p-2 rounded-lg"
            style={{ color: '#94a3b8', background: '#0d1526', border: '1px solid #1e2d4a' }}
          >
            <Menu size={20} />
          </button>
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
          {childSites.length > 0 && (
            <SiteSwitcher
              sites={childSites}
              selectedSiteId={selectedSiteId ?? null}
              parentOrgName=""
            />
          )}
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
