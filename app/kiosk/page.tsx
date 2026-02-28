'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PinPad } from '@/components/kiosk/pin-pad'
import { KioskHeader } from '@/components/kiosk/kiosk-header'
import { authenticatePinKiosk, logoutPin } from '@/lib/actions/pin'
import { UtensilsCrossed, Calendar, ClipboardList, Clock } from 'lucide-react'
import Link from 'next/link'

export default function KioskPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-white">Chargement...</span></div>}>
      <KioskContent />
    </Suspense>
  )
}

function KioskContent() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('org') ?? ''
  const [staff, setStaff] = useState<{ staffId: string; nom: string; prenom: string; role: string } | null>(null)
  const router = useRouter()

  const handleLogin = async (pin: string) => {
    if (!orgId) throw new Error('Parametre org manquant dans l\'URL')
    const result = await authenticatePinKiosk(orgId, pin)
    setStaff(result)
  }

  const handleLogout = async () => {
    await logoutPin()
    setStaff(null)
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <UtensilsCrossed size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">RestoFlow Kiosk</span>
        </div>
        {!orgId && (
          <p className="text-sm" style={{ color: '#f87171' }}>
            Ajoutez ?org=VOTRE_ORG_ID dans l'URL
          </p>
        )}
        <PinPad onSubmit={handleLogin} />
      </div>
    )
  }

  const modules = [
    { href: `/kiosk/planning?org=${orgId}`, label: 'Mon Planning', icon: Calendar, color: '#3b82f6' },
    { href: `/kiosk/haccp?org=${orgId}`, label: 'HACCP', icon: ClipboardList, color: '#f59e0b' },
    { href: `/kiosk/pointage?org=${orgId}`, label: 'Pointage', icon: Clock, color: '#10b981' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader
        staffName={`${staff.prenom} ${staff.nom}`}
        role={staff.role}
        onLogout={handleLogout}
        onSwitch={() => { setStaff(null) }}
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
          {modules.map(m => (
            <Link key={m.href} href={m.href}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl transition-all hover:scale-105"
              style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ background: `${m.color}20` }}>
                <m.icon size={32} style={{ color: m.color }} />
              </div>
              <span className="text-lg font-semibold" style={{ color: '#e2e8f0' }}>{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
