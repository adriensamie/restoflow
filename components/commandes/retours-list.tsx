'use client'

import { FileText, Mail, Check, X, RefreshCw } from 'lucide-react'

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: 'Brouillon', color: '#94a3b8', bg: '#1e2d4a' },
  envoye: { label: 'Envoye', color: '#60a5fa', bg: '#1a2d5a' },
  accepte: { label: 'Accepte', color: '#4ade80', bg: '#051a0a' },
  refuse: { label: 'Refuse', color: '#f87171', bg: '#1a0505' },
  rembourse: { label: 'Rembourse', color: '#a78bfa', bg: '#1a0520' },
}

interface Retour {
  id: string
  numero: string
  statut: string
  total_ht: number | null
  created_at: string
  fournisseurs?: { nom: string } | null
}

export function RetoursList({ retours }: { retours: Retour[] }) {
  if (retours.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
        style={{ color: '#3b5280' }}>
        <RefreshCw size={12} /> Bons de retour
      </h3>
      <div className="space-y-2">
        {retours.map(r => {
          const cfg = STATUT_CONFIG[r.statut] ?? STATUT_CONFIG.brouillon
          return (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
              <FileText size={16} style={{ color: '#60a5fa' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{r.numero}</p>
                <p className="text-xs" style={{ color: '#4a6fa5' }}>
                  {r.fournisseurs?.nom} · {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
              <span className="text-sm font-bold" style={{ color: '#94a3b8' }}>
                {(r.total_ht ?? 0).toFixed(2)} EUR
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
