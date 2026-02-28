'use client'

import { Suspense, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { ClipboardList, ArrowLeft, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function KioskHaccpPage() {
  return <Suspense fallback={null}><KioskHaccpContent /></Suspense>
}

function KioskHaccpContent() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('org') ?? ''
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: '#080d1a' }}>
      <div className="flex items-center gap-4">
        <Link href={`/kiosk?org=${orgId}`} className="p-2 rounded-lg"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#4a6fa5' }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <ClipboardList size={20} style={{ color: '#f59e0b' }} />
          <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Checklist HACCP</h1>
        </div>
      </div>

      <div className="rounded-xl p-6 space-y-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <p className="text-sm" style={{ color: '#4a6fa5' }}>
          Completez vos releves HACCP du jour. Les templates sont charges depuis la configuration de votre organisation.
        </p>
        {done && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#051a0a', border: '1px solid #14532d' }}>
            <Check size={16} style={{ color: '#4ade80' }} />
            <span className="text-sm" style={{ color: '#4ade80' }}>Releves enregistres</span>
          </div>
        )}
      </div>
    </div>
  )
}
