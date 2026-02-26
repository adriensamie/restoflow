'use client'

import { useState } from 'react'
import { Plus, Building2, Phone, Mail, Edit2, Package } from 'lucide-react'
import { FournisseurModal } from './fournisseur-modal'

interface Fournisseur {
  id: string
  nom: string
  contact_nom: string | null
  contact_email: string | null
  contact_telephone: string | null
  adresse: string | null
  delai_livraison: number
  conditions_paiement: string | null
  produit_fournisseur: { count: number }[]
}

export function FournisseursClient({ fournisseurs }: { fournisseurs: Fournisseur[] }) {
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Fournisseur | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Fournisseurs</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            {fournisseurs.length} fournisseur{fournisseurs.length > 1 ? 's' : ''} actif{fournisseurs.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}
        >
          <Plus size={16} />
          Nouveau fournisseur
        </button>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {fournisseurs.length === 0 && (
          <div className="col-span-3 py-16 text-center" style={{ color: '#2d4a7a' }}>
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun fournisseur. Créez-en un pour commencer.</p>
          </div>
        )}

        {fournisseurs.map(f => (
          <div key={f.id} className="rounded-xl p-5 space-y-4"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            {/* Nom + edit */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: '#e2e8f0' }}>{f.nom}</h3>
                {f.contact_nom && (
                  <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>{f.contact_nom}</p>
                )}
              </div>
              <button onClick={() => setEditItem(f)}
                className="p-1.5 rounded-lg" style={{ color: '#4a6fa5' }}>
                <Edit2 size={14} />
              </button>
            </div>

            {/* Infos contact */}
            <div className="space-y-1.5">
              {f.contact_telephone && (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#6b8cc7' }}>
                  <Phone size={12} /> {f.contact_telephone}
                </div>
              )}
              {f.contact_email && (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#6b8cc7' }}>
                  <Mail size={12} /> {f.contact_email}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid #1e2d4a' }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4a6fa5' }}>
                <Package size={12} />
                {f.produit_fournisseur?.[0]?.count ?? 0} produit{(f.produit_fournisseur?.[0]?.count ?? 0) > 1 ? 's' : ''}
              </div>
              <div className="text-xs" style={{ color: '#4a6fa5' }}>
                Délai : {f.delai_livraison}j
              </div>
              {f.conditions_paiement && (
                <div className="text-xs" style={{ color: '#4a6fa5' }}>
                  {f.conditions_paiement}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(showModal || editItem) && (
        <FournisseurModal
          fournisseur={editItem ?? undefined}
          onClose={() => { setShowModal(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
