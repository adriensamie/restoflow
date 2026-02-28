'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function KioskPlanningPage() {
  return <Suspense fallback={null}><KioskPlanningContent /></Suspense>
}

function KioskPlanningContent() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('org') ?? ''

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: '#080d1a' }}>
      <div className="flex items-center gap-4">
        <Link href={`/kiosk?org=${orgId}`} className="p-2 rounded-lg"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#4a6fa5' }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Calendar size={20} style={{ color: '#3b82f6' }} />
          <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Mon Planning</h1>
        </div>
      </div>

      <div className="rounded-xl p-8 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <p className="text-sm" style={{ color: '#4a6fa5' }}>
          Planning de la semaine en cours — vue employe read-only
        </p>
        <p className="text-xs mt-2" style={{ color: '#2d4a7a' }}>
          Les creneaux sont charges depuis votre planning equipe.
        </p>
      </div>
    </div>
  )
}
