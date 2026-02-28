'use client'

import { useState, useTransition } from 'react'
import { Shield, Save, Loader2, Check } from 'lucide-react'
import { updateRolePermissions } from '@/lib/actions/rbac'

const ALL_ROUTES = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/alertes', label: 'Alertes' },
  { path: '/stocks', label: 'Stocks' },
  { path: '/pertes', label: 'Pertes' },
  { path: '/commandes', label: 'Commandes' },
  { path: '/livraisons', label: 'Livraisons' },
  { path: '/cave', label: 'Cave a vins' },
  { path: '/inventaire', label: 'Inventaire' },
  { path: '/marges', label: 'Marges' },
  { path: '/recettes', label: 'Recettes' },
  { path: '/previsions', label: 'Previsions IA' },
  { path: '/equipe', label: 'Equipe' },
  { path: '/planning', label: 'Planning' },
  { path: '/fiches-paie', label: 'Fiches de paie' },
  { path: '/hygiene', label: 'HACCP' },
  { path: '/assistant', label: 'Assistant IA' },
  { path: '/bilan', label: 'Bilan journee' },
]

const ROLES = [
  { key: 'manager', label: 'Manager' },
  { key: 'employe', label: 'Employe' },
  { key: 'livreur', label: 'Livreur' },
] as const

interface Props {
  initialPermissions: Record<string, { allowed_routes: string[]; allowed_actions: string[] }>
}

export function RolesConfig({ initialPermissions }: Props) {
  const [perms, setPerms] = useState(initialPermissions)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const toggleRoute = (role: string, route: string) => {
    setPerms(prev => {
      const current = prev[role]?.allowed_routes ?? []
      const next = current.includes(route)
        ? current.filter(r => r !== route)
        : [...current, route]
      return { ...prev, [role]: { ...prev[role], allowed_routes: next } }
    })
    setSaved(false)
  }

  const handleSave = (role: string) => {
    startTransition(async () => {
      await updateRolePermissions({
        role,
        allowed_routes: perms[role]?.allowed_routes ?? [],
        allowed_actions: perms[role]?.allowed_actions ?? [],
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>Droits par role</h2>
          <p className="text-xs" style={{ color: '#4a6fa5' }}>Le patron a toujours acces a tout</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
        {/* Header */}
        <div className="grid gap-2 px-4 py-3 text-xs font-semibold uppercase"
          style={{
            background: '#0a1628', color: '#3b5280',
            gridTemplateColumns: '200px repeat(3, 1fr)',
          }}>
          <span>Page</span>
          {ROLES.map(r => <span key={r.key} className="text-center">{r.label}</span>)}
        </div>

        {/* Rows */}
        {ALL_ROUTES.map((route, i) => (
          <div key={route.path} className="grid gap-2 px-4 py-2.5 items-center"
            style={{
              gridTemplateColumns: '200px repeat(3, 1fr)',
              background: i % 2 === 0 ? '#0d1526' : '#0a1120',
              borderTop: '1px solid #1a2540',
            }}>
            <span className="text-sm" style={{ color: '#94a3b8' }}>{route.label}</span>
            {ROLES.map(role => {
              const checked = perms[role.key]?.allowed_routes?.includes(route.path)
              return (
                <div key={role.key} className="flex justify-center">
                  <button
                    onClick={() => toggleRoute(role.key, route.path)}
                    className="w-5 h-5 rounded flex items-center justify-center transition-all"
                    style={{
                      background: checked ? '#1d4ed8' : '#1a2540',
                      border: `1px solid ${checked ? '#3b82f6' : '#2d4a7a'}`,
                    }}>
                    {checked && <Check size={12} className="text-white" />}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Save buttons */}
      <div className="flex gap-3">
        {ROLES.map(role => (
          <button key={role.key} onClick={() => handleSave(role.key)} disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Sauver {role.label}
          </button>
        ))}
        {saved && <span className="text-sm self-center" style={{ color: '#4ade80' }}>Sauvegarde !</span>}
      </div>
    </div>
  )
}
