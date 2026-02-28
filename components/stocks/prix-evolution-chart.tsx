'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface PrixHistorique {
  date_releve: string
  prix: number
  variation_pct: number | null
  fournisseurs?: { nom: string } | null
}

export function PrixEvolutionChart({ data, unite = 'EUR' }: { data: PrixHistorique[]; unite?: string }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <TrendingUp size={20} className="mx-auto mb-2" style={{ color: '#2d4a7a' }} />
        <p className="text-xs" style={{ color: '#4a6fa5' }}>Aucun historique de prix</p>
      </div>
    )
  }

  const chartData = data.map(d => ({
    date: new Date(d.date_releve).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    prix: d.prix,
    variation: d.variation_pct,
  }))

  return (
    <div className="rounded-xl p-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={14} style={{ color: '#60a5fa' }} />
        <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>Evolution des prix</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4a6fa5' }} />
          <YAxis tick={{ fontSize: 10, fill: '#4a6fa5' }} />
          <Tooltip
            contentStyle={{ background: '#0a1120', border: '1px solid #1e2d4a', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#e2e8f0' }}
            itemStyle={{ color: '#60a5fa' }}
            formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(2)} ${unite}`, 'Prix']}
          />
          <Line type="monotone" dataKey="prix" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
