'use client'

import { useState } from 'react'

interface Perte {
  id: string
  quantite: number
  prix_unitaire: number | null
  motif: string | null
  note: string | null
  created_at: string
  produits: { nom: string; unite: string; categorie: string } | null
}

export function PertesTable({ pertes }: { pertes: Perte[] }) {
  const [search, setSearch] = useState('')

  const filtered = pertes.filter(p =>
    !search || p.produits?.nom.toLowerCase().includes(search.toLowerCase())
  )

  const MOTIFS: Record<string, string> = {
    dlc: 'DLC dépassée',
    casse: 'Casse / accident',
    vol: 'Vol',
    qualite: 'Mauvaise qualité',
    preparation: 'Chutes préparation',
    autre: 'Autre',
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Rechercher un produit..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm w-full max-w-sm outline-none"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
      />

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0a1628', borderBottom: '1px solid #1e2d4a' }}>
              {['Date', 'Produit', 'Catégorie', 'Quantité', 'Coût', 'Motif', 'Note'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b5280' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#2d4a7a' }}>
                  Aucune perte enregistrée
                </td>
              </tr>
            )}
            {filtered.map((perte, i) => {
              const cout = perte.quantite * (perte.prix_unitaire ?? 0)
              return (
                <tr
                  key={perte.id}
                  style={{
                    background: i % 2 === 0 ? '#0d1526' : '#0a1120',
                    borderBottom: '1px solid #1a2540'
                  }}
                >
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>
                    {new Date(perte.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: '#e2e8f0' }}>
                    {perte.produits?.nom ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#1e2d4a', color: '#60a5fa' }}>
                      {perte.produits?.categorie ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#f87171' }}>
                    -{perte.quantite} {perte.produits?.unite}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: cout > 0 ? '#f87171' : '#4a6fa5' }}>
                    {cout > 0 ? `-${cout.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#94a3b8' }}>
                    {perte.motif ? (MOTIFS[perte.motif] ?? perte.motif) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>
                    {perte.note ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
