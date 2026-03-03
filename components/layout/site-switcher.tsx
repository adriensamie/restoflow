'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronDown, Building2 } from 'lucide-react'
import { setSelectedSite } from '@/lib/actions/sites'

interface Site {
  id: string
  nom: string
  slug: string | null
}

interface Props {
  sites: Site[]
  selectedSiteId: string | null
  parentOrgName: string
}

export function SiteSwitcher({ sites, selectedSiteId, parentOrgName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [open])

  if (sites.length === 0) return null

  const currentSite = sites.find(s => s.id === selectedSiteId)
  const label = currentSite?.nom ?? 'Tous les sites'

  const handleSelect = (siteId: string | null) => {
    setOpen(false)
    startTransition(async () => {
      await setSelectedSite(siteId)
      router.refresh()
    })
  }

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: '#0d1526',
          border: '1px solid #1e2d4a',
          color: isPending ? '#2d4a7a' : '#94a3b8',
          opacity: isPending ? 0.7 : 1,
        }}
        disabled={isPending}
      >
        <MapPin size={12} style={{ color: '#60a5fa' }} />
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronDown size={12} style={{ color: '#4a6fa5' }} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 min-w-[200px] rounded-lg overflow-hidden z-50 shadow-xl"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}
        >
          {/* All sites option (parent view) */}
          <button
            onClick={() => handleSelect(null)}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 transition-all hover:brightness-125"
            style={{
              background: !selectedSiteId ? '#0a1f3d' : 'transparent',
              color: !selectedSiteId ? '#60a5fa' : '#94a3b8',
              borderBottom: '1px solid #1e2d4a',
            }}
          >
            <Building2 size={12} />
            Tous les sites
          </button>

          {/* Individual sites */}
          {sites.map(site => (
            <button
              key={site.id}
              onClick={() => handleSelect(site.id)}
              className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 transition-all hover:brightness-125"
              style={{
                background: selectedSiteId === site.id ? '#0a1f3d' : 'transparent',
                color: selectedSiteId === site.id ? '#60a5fa' : '#94a3b8',
              }}
            >
              <MapPin size={12} />
              {site.nom}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
