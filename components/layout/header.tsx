'use client'

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs'
import { Bell } from 'lucide-react'

export function Header() {
  return (
    <header className="px-6 py-3 flex items-center justify-between" style={{ background: '#080d1a', borderBottom: '1px solid #1e2d4a' }}>
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

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg" style={{ color: '#4a6fa5' }} aria-label="Notifications">
          <Bell size={18} />
        </button>

        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </div>
    </header>
  )
}
