'use client'

import { useState } from 'react'
import { Plus, ShoppingCart, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import { CommandeModal } from './commande-modal'

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  brouillon:        { label: 'Brouillon',         color: '#94a3b8', bg: '#1e2d4a', icon: Clock },
  envoyee:          { label: 'Envoyée',            color: '#60a5fa', bg: '#0a1f3d', icon: Truck },
  confirmee:        { label: 'Confirmée',          color: '#4ade80', bg: '#0a2d1a', icon: CheckCircle },
  recue:            { label: 'Reçue',              color: '#4ade80', bg: '#0a2d1a', icon: CheckCircle },
  recue_partielle:  { label: 'Reçue partielle',    color: '#fbbf24', bg: '#1a1505', icon: Clock },
  annulee:          { label: 'Annulée',            color: '#f87171', bg: '#1a0505', icon: XCircle },
}

interface Commande {
  id: string
  numero: string
  statut: string
  total_ht: number | null
  date_livraison_prevue: string | null
  created_at: string
  fournisseurs: { nom: string } | null
  commande_lignes: { count: number }[]
}

interface Fournisseur {
  id: string
  nom: string
}

export function CommandesClient({ commandes, fournisseurs }: {
  commandes: Commande[]
  fournisseurs: Fournisseur[]
}) {
  const [showModal, setShowModal] = useState(false)
  const [filtreStatut, setFiltreStatut] = useState('tous')

  const commandesFiltrees = commandes.filter(c =>
    filtreStatut === 'tous' || c.statut === filtreStatut
  )

  const stats = {
    total: commandes.length,
    envoyees: commandes.filter(c => c.statut === 'envoyee').length,
    enAttente: commandes.filter(c => ['brouillon', 'envoyee', 'confirmee'].includes(c.statut)).length,
    montantTotal: commandes.reduce((acc, c) => acc + (c.total_ht || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Commandes</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            {commandes.length} commande{commandes.length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          <Plus size={16} />Nouvelle commande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total commandes', value: stats.total, color: '#60a5fa' },
          { label: 'En attente', value: stats.enAttente, color: '#fbbf24' },
          { label: 'Envoyées', value: stats.envoyees, color: '#4ade80' },
          { label: 'Montant total HT', value: `${stats.montantTotal.toFixed(0)} €`, color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <p className="text-xs mb-1" style={{ color: '#4a6fa5' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres statut */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFiltreStatut('tous')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: filtreStatut === 'tous' ? '#0a1f3d' : '#0d1526',
            color: filtreStatut === 'tous' ? '#60a5fa' : '#4a6fa5',
            border: `1px solid ${filtreStatut === 'tous' ? '#1e3a7a' : '#1e2d4a'}`,
          }}>
          Toutes
        </button>
        {Object.entries(STATUT_CONFIG).map(([key, conf]) => (
          <button key={key} onClick={() => setFiltreStatut(key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filtreStatut === key ? conf.bg : '#0d1526',
              color: filtreStatut === key ? conf.color : '#4a6fa5',
              border: `1px solid ${filtreStatut === key ? conf.color + '40' : '#1e2d4a'}`,
            }}>
            {conf.label}
          </button>
        ))}
      </div>

      {/* Liste commandes */}
      <div className="space-y-3">
        {commandesFiltrees.length === 0 && (
          <div className="rounded-xl p-12 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <ShoppingCart size={32} className="mx-auto mb-2 opacity-20" style={{ color: '#60a5fa' }} />
            <p className="text-sm" style={{ color: '#2d4a7a' }}>Aucune commande</p>
          </div>
        )}

        {commandesFiltrees.map(c => {
          const conf = STATUT_CONFIG[c.statut] ?? STATUT_CONFIG.brouillon
          const Icon = conf.icon
          return (
            <div key={c.id} className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: conf.bg }}>
                  <Icon size={18} style={{ color: conf.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{c.numero}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: conf.bg, color: conf.color }}>
                      {conf.label}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>
                    {c.fournisseurs?.nom ?? 'Fournisseur inconnu'}
                    {c.date_livraison_prevue && ` · Livraison le ${new Date(c.date_livraison_prevue).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                  {c.total_ht ? `${c.total_ht.toFixed(2)} €` : '—'}
                </p>
                <p className="text-xs" style={{ color: '#2d4a7a' }}>
                  {c.commande_lignes?.[0]?.count ?? 0} ligne{(c.commande_lignes?.[0]?.count ?? 0) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <CommandeModal
          fournisseurs={fournisseurs}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
