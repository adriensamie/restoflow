'use client'

import { useState } from 'react'
import { AlertTriangle, Package, Plus, Edit2, Trash2, ArrowUpDown } from 'lucide-react'
import { MouvementModal } from './mouvement-modal'
import { ProduitModal } from './produit-modal'

interface StockRow {
  produit_id: string
  nom: string
  categorie: string
  unite: string
  prix_unitaire: number | null
  seuil_alerte: number
  quantite_actuelle: number
  derniere_maj: string | null
  en_alerte: boolean
}

interface Props {
  stocks: StockRow[]
}

const CATEGORIES = ['Toutes', 'Viande', 'Poisson', 'Légumes', 'Fruits', 'Épicerie', 'Boissons', 'Produits laitiers', 'Autre']

export function StocksTable({ stocks }: Props) {
  const [categorie, setCategorie] = useState('Toutes')
  const [search, setSearch] = useState('')
  const [mouvementProduit, setMouvementProduit] = useState<StockRow | null>(null)
  const [editProduit, setEditProduit] = useState<StockRow | null>(null)
  const [alerteOnly, setAlerteOnly] = useState(false)

  const filtered = stocks.filter(s => {
    if (categorie !== 'Toutes' && s.categorie !== categorie) return false
    if (alerteOnly && !s.en_alerte) return false
    if (search && !s.nom.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const valeurTotale = stocks.reduce((acc, s) => {
    return acc + (s.quantite_actuelle * (s.prix_unitaire ?? 0))
  }, 0)

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Produits actifs', value: stocks.length, color: '#60a5fa' },
          { label: 'En alerte', value: stocks.filter(s => s.en_alerte).length, color: '#f87171' },
          { label: 'Valeur du stock', value: `${valeurTotale.toFixed(2)} €`, color: '#4ade80' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <p className="text-xs mb-1" style={{ color: '#4a6fa5' }}>{stat.label}</p>
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm flex-1 min-w-48 outline-none"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
        />

        <select
          value={categorie}
          onChange={e => setCategorie(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={() => setAlerteOnly(!alerteOnly)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: alerteOnly ? '#2d1500' : '#0d1526',
            border: `1px solid ${alerteOnly ? '#92400e' : '#1e2d4a'}`,
            color: alerteOnly ? '#fbbf24' : '#4a6fa5'
          }}
        >
          <AlertTriangle size={14} />
          Alertes uniquement
        </button>
      </div>

      {/* Tableau */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0a1628', borderBottom: '1px solid #1e2d4a' }}>
              {['Produit', 'Catégorie', 'Stock actuel', 'Prix unit.', 'Valeur', 'Seuil alerte', 'Actions'].map(h => (
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
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  Aucun produit trouvé
                </td>
              </tr>
            )}
            {filtered.map((stock, i) => (
              <tr
                key={stock.produit_id}
                style={{
                  background: i % 2 === 0 ? '#0d1526' : '#0a1120',
                  borderBottom: '1px solid #1a2540'
                }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {stock.en_alerte && <AlertTriangle size={14} style={{ color: '#f59e0b' }} />}
                    <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{stock.nom}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#1e2d4a', color: '#60a5fa' }}>
                    {stock.categorie}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: stock.en_alerte ? '#f87171' : stock.quantite_actuelle > 0 ? '#4ade80' : '#6b7280' }}
                  >
                    {stock.quantite_actuelle.toFixed(2)} {stock.unite}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#94a3b8' }}>
                  {stock.prix_unitaire ? `${stock.prix_unitaire.toFixed(2)} €` : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#60a5fa' }}>
                  {stock.prix_unitaire
                    ? `${(stock.quantite_actuelle * stock.prix_unitaire).toFixed(2)} €`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#4a6fa5' }}>
                  {stock.seuil_alerte} {stock.unite}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMouvementProduit(stock)}
                      className="px-2 py-1 rounded text-xs font-medium transition-all"
                      style={{ background: '#1e2d4a', color: '#60a5fa' }}
                      title="Ajouter un mouvement"
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      onClick={() => setEditProduit(stock)}
                      className="px-2 py-1 rounded text-xs transition-all"
                      style={{ background: '#1e2d4a', color: '#94a3b8' }}
                      title="Modifier"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {mouvementProduit && (
        <MouvementModal
          produit={mouvementProduit}
          onClose={() => setMouvementProduit(null)}
        />
      )}
      {editProduit && (
        <ProduitModal
          produit={editProduit}
          onClose={() => setEditProduit(null)}
        />
      )}
    </div>
  )
}
