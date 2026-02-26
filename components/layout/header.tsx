// components/layout/header.tsx
// Header avec switcher d'organisation (multi-restaurant)
// et menu utilisateur Clerk

'use client'

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs'
import { Bell } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Switcher multi-restaurant — critique pour les gérants multi-établissements */}
      {/* Quand l'utilisateur change d'org, Clerk génère un nouveau JWT avec le nouvel org_id */}
      {/* → la RLS Supabase filtrera automatiquement sur le nouveau restaurant */}
      <OrganizationSwitcher
        hidePersonal={true}
        createOrganizationMode="modal"
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: 'flex items-center',
            organizationSwitcherTrigger:
              'flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700',
          },
        }}
      />

      <div className="flex items-center gap-3">
        {/* Bouton alertes — à connecter à Supabase Realtime plus tard */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <Bell size={18} />
          {/* Badge rouge si alertes actives */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /> */}
        </button>

        {/* Menu utilisateur Clerk — déconnexion, profil, etc. */}
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