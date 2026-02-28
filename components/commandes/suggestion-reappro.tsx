'use client'

import { useState, useEffect, useTransition } from 'react'
import { ShoppingCart, Loader2, Package, ArrowRight } from 'lucide-react'
import { getSuggestionsReappro, type SuggestionReappro } from '@/lib/actions/reorder'

export function SuggestionReappro() {
  const [suggestions, setSuggestions] = useState<SuggestionReappro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSuggestionsReappro()
      .then(setSuggestions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        <Loader2 size={20} className="animate-spin mx-auto" style={{ color: '#4a6fa5' }} />
      </div>
    )
  }

  if (suggestions.length === 0) return null

  // Group by supplier
  const byFournisseur = new Map<string, SuggestionReappro[]>()
  for (const s of suggestions) {
    const key = s.fournisseur_nom ?? 'Sans fournisseur'
    if (!byFournisseur.has(key)) byFournisseur.set(key, [])
    byFournisseur.get(key)!.push(s)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingCart size={16} style={{ color: '#10b981' }} />
        <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
          Suggestions de reapprovisionnement
        </h3>
        <span className="px-1.5 py-0.5 rounded text-xs font-bold"
          style={{ background: '#051a0a', color: '#4ade80' }}>{suggestions.length}</span>
      </div>

      {Array.from(byFournisseur).map(([fournisseur, items]) => (
        <div key={fournisseur} className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
          <div className="px-4 py-2 text-xs font-semibold" style={{ background: '#0a1628', color: '#60a5fa' }}>
            {fournisseur} — {items.length} produit{items.length > 1 ? 's' : ''}
          </div>
          {items.map(s => (
            <div key={s.produit_id} className="flex items-center gap-3 px-4 py-2"
              style={{ borderTop: '1px solid #1a2540', background: '#0d1526' }}>
              <Package size={14} style={{ color: '#f87171' }} />
              <div className="flex-1">
                <p className="text-sm" style={{ color: '#e2e8f0' }}>{s.produit_nom}</p>
                <p className="text-xs" style={{ color: '#4a6fa5' }}>
                  Stock : {s.stock_actuel} / {s.seuil_alerte} {s.unite}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: '#4ade80' }}>
                  {s.quantite_suggere} {s.unite}
                </p>
                {s.prix_negocie && (
                  <p className="text-xs" style={{ color: '#4a6fa5' }}>
                    ~{(s.quantite_suggere * s.prix_negocie).toFixed(2)} EUR
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
