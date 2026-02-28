'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Clock, ArrowLeft, LogIn, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function KioskPointagePage() {
  return <Suspense fallback={null}><KioskPointageContent /></Suspense>
}

function KioskPointageContent() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('org') ?? ''
  const [time, setTime] = useState(new Date())
  const [pointeIn, setPointeIn] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: '#080d1a' }}>
      <div className="flex items-center gap-4">
        <Link href={`/kiosk?org=${orgId}`} className="p-2 rounded-lg"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#4a6fa5' }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Clock size={20} style={{ color: '#10b981' }} />
          <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Pointage</h1>
        </div>
      </div>

      <div className="rounded-xl p-8 text-center space-y-6" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <p className="text-5xl font-mono font-bold" style={{ color: '#60a5fa' }}>
          {time.toLocaleTimeString('fr-FR')}
        </p>
        <p className="text-sm" style={{ color: '#4a6fa5' }}>
          {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="flex justify-center gap-4">
          <button onClick={() => setPointeIn(true)}
            disabled={pointeIn}
            className="flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #14532d, #16a34a)', color: 'white' }}>
            <LogIn size={20} />
            Arrivee
          </button>
          <button onClick={() => setPointeIn(false)}
            disabled={!pointeIn}
            className="flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)', color: 'white' }}>
            <LogOut size={20} />
            Depart
          </button>
        </div>
      </div>
    </div>
  )
}
