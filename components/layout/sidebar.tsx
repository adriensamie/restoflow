'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  UtensilsCrossed, ClipboardList, Users, Calendar,
  FileText, AlertTriangle, Settings, PlugZap,
  TrendingDown, TrendingUp, Sparkles, Bot, Wine,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Vue d\'ensemble',
    items: [
      { href: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
      { href: '/antifraud',    label: 'Anti-Fraude',    icon: Shield },
      { href: '/alertes',      label: 'Alertes',        icon: AlertTriangle },
    ]
  },
  {
    label: 'Stocks & Achats',
    items: [
      { href: '/stocks',       label: 'Stocks',         icon: Package },
      { href: '/pertes',       label: 'Pertes',         icon: TrendingDown },
      { href: '/commandes',    label: 'Commandes',      icon: ShoppingCart },
      { href: '/livraisons',   label: 'Livraisons',     icon: Truck },
      { href: '/cave',         label: 'Cave à vins',    icon: Wine },
      { href: '/inventaire',   label: 'Inventaire',     icon: ClipboardList },
    ]
  },
  {
    label: 'Analyse',
    items: [
      { href: '/marges',       label: 'Marges',         icon: TrendingUp },
      { href: '/recettes',     label: 'Recettes',       icon: UtensilsCrossed },
      { href: '/previsions',   label: 'Prévisions IA',  icon: Sparkles },
    ]
  },
  {
    label: 'Équipe',
    items: [
      { href: '/equipe',       label: 'Équipe',         icon: Users },
      { href: '/planning',     label: 'Planning',       icon: Calendar },
      { href: '/fiches-paie',  label: 'Fiches de paie', icon: FileText },
    ]
  },
  {
    label: 'Conformité',
    items: [
      { href: '/hygiene',      label: 'HACCP',          icon: ClipboardList },
    ]
  },
  {
    label: 'Système',
    items: [
      { href: '/assistant',    label: 'Assistant IA',   icon: Bot },
      { href: '/integrations', label: 'Intégrations',   icon: PlugZap },
      { href: '/parametres',   label: 'Paramètres',     icon: Settings },
    ]
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex flex-col flex-shrink-0" style={{ background: '#0a0f1e', borderRight: '1px solid #1e2d4a' }}>
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid #1e2d4a' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <UtensilsCrossed size={15} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">RestoFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#3b5280' }}>
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                        isActive ? 'text-white font-medium' : 'hover:text-white'
                      )}
                      style={isActive ? {
                        background: 'linear-gradient(90deg, #1d3a7a, #1e2d4a)',
                        color: '#60a5fa',
                        borderLeft: '2px solid #3b82f6',
                      } : {
                        color: '#6b8cc7',
                      }}
                    >
                      <Icon size={15} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Version */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #1e2d4a' }}>
        <p className="text-xs" style={{ color: '#2d4a7a' }}>RestoFlow Pro v2.0</p>
      </div>
    </aside>
  )
}