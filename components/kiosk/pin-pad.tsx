'use client'

import { useState, useTransition } from 'react'
import { Delete, Loader2 } from 'lucide-react'

interface Props {
  onSubmit: (pin: string) => Promise<void>
  title?: string
}

export function PinPad({ onSubmit, title = 'Entrez votre PIN' }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const addDigit = (d: string) => {
    if (pin.length < 6) setPin(p => p + d)
  }

  const backspace = () => setPin(p => p.slice(0, -1))

  const handleSubmit = () => {
    if (pin.length < 4) return
    setError(null)
    startTransition(async () => {
      try {
        await onSubmit(pin)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur')
        setPin('')
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>{title}</h2>

      {/* PIN dots */}
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-4 h-4 rounded-full transition-all"
            style={{
              background: i < pin.length ? '#3b82f6' : '#1e2d4a',
              border: `2px solid ${i < pin.length ? '#60a5fa' : '#2d4a7a'}`,
            }} />
        ))}
      </div>

      {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button key={d} onClick={() => addDigit(d)}
            className="w-16 h-16 rounded-xl text-2xl font-bold transition-all active:scale-95"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }}>
            {d}
          </button>
        ))}
        <button onClick={backspace}
          className="w-16 h-16 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#f87171' }}>
          <Delete size={20} />
        </button>
        <button onClick={() => addDigit('0')}
          className="w-16 h-16 rounded-xl text-2xl font-bold transition-all active:scale-95"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }}>
          0
        </button>
        <button onClick={handleSubmit} disabled={pin.length < 4 || isPending}
          className="w-16 h-16 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', color: 'white' }}>
          {isPending ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'OK'}
        </button>
      </div>
    </div>
  )
}
