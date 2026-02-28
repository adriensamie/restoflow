'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, Loader2, TrendingUp, Users, ClipboardList, Package } from 'lucide-react'
import { getBilanJournee, type BilanJournee } from '@/lib/actions/bilan'

export function BilanClient() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [bilan, setBilan] = useState<BilanJournee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getBilanJournee(date)
      .then(setBilan)
      .catch(() => setBilan(null))
      .finally(() => setLoading(false))
  }, [date])

  const handleDownloadPDF = async () => {
    if (!bilan) return
    const { generateBilanJourneePDF } = await import('@/lib/pdf/bilan-journee')
    const pdfBytes = generateBilanJourneePDF(bilan, 'RestoFlow')
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bilan-${date}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Bilan de journee</h1>
            <p className="text-sm" style={{ color: '#4a6fa5' }}>Rapport quotidien complet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }} />
          {bilan && (
            <button onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
              <Download size={14} /> PDF
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="rounded-xl p-12 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: '#4a6fa5' }} />
        </div>
      )}

      {!loading && bilan && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'CA Total', value: `${bilan.ca_total.toFixed(0)} EUR`, icon: TrendingUp, color: '#4ade80' },
              { label: 'Ticket moyen', value: `${bilan.ticket_moyen.toFixed(2)} EUR`, icon: BarChart3, color: '#60a5fa' },
              { label: 'Couverts', value: String(bilan.nb_couverts), icon: Users, color: '#a78bfa' },
              { label: 'Food cost', value: `${bilan.food_cost_pct.toFixed(1)}%`, icon: Package, color: bilan.food_cost_pct > 30 ? '#f87171' : '#4ade80' },
            ].map(k => (
              <div key={k.label} className="p-4 rounded-xl" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
                <div className="flex items-center gap-2 mb-2">
                  <k.icon size={14} style={{ color: k.color }} />
                  <span className="text-xs" style={{ color: '#4a6fa5' }}>{k.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Finance</h3>
              {[
                ['CA', `${bilan.ca_total.toFixed(2)} EUR`],
                ['Cout matieres', `${bilan.food_cost_montant.toFixed(2)} EUR`],
                ['Pertes', `${bilan.pertes_montant.toFixed(2)} EUR`],
                ['Marge brute', `${(bilan.ca_total - bilan.food_cost_montant).toFixed(2)} EUR`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span style={{ color: '#4a6fa5' }}>{l}</span>
                  <span className="font-medium" style={{ color: '#e2e8f0' }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-5 space-y-3" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Equipe & HACCP</h3>
              {[
                ['Heures equipe', `${bilan.heures_equipe.toFixed(1)} h`],
                ['Cout equipe', `${bilan.cout_equipe.toFixed(2)} EUR`],
                ['Releves HACCP', String(bilan.nb_releves_haccp)],
                ['Non-conformites', String(bilan.nb_non_conformes)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span style={{ color: '#4a6fa5' }}>{l}</span>
                  <span className="font-medium" style={{ color: bilan.nb_non_conformes > 0 && l === 'Non-conformites' ? '#f87171' : '#e2e8f0' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
