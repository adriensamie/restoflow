'use client'

import { useState, useTransition } from 'react'
import { Plus, Building2, Phone, Mail, Edit2, Package, Trash2 } from 'lucide-react'
import { FournisseurModal } from './fournisseur-modal'
import { supprimerFournisseur } from '@/lib/actions/commandes'

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [liste, setListe] = useState(fournisseurs)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await supprimerFournisseur(id)
        setListe(prev => prev.filter(f => f.id !== id))
        setConfirmDeleteId(null)
      } catch (e) { console.error(e) }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Fournisseurs</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            {liste.length} fournisseur{liste.length > 1 ? 's' : ''} actif{liste.length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          <Plus size={16} />Nouveau fournisseur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {liste.length === 0 && (
          <div className="col-span-3 py-16 text-center" style={{ color: '#2d4a7a' }}>
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun fournisseur. Créez-en un pour commencer.</p>
          </div>
        )}

        {liste.map(f => (
          <div key={f.id} className="rounded-xl p-5 space-y-4"
            style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: '#e2e8f0' }}>{f.nom}</h3>
                {f.contact_nom && (
                  <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>{f.contact_nom}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditItem(f)}
                  className="p-1.5 rounded-lg" style={{ color: '#4a6fa5' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setConfirmDeleteId(f.id)}
                  className="p-1.5 rounded-lg" style={{ color: '#f87171' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {f.contact_telephone && (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#6b8cc7' }}>
                  <Phone size={12} />{f.contact_telephone}
                </div>
              )}
              {f.contact_email && (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#6b8cc7' }}>
                  <Mail size={12} />{f.contact_email}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid #1e2d4a' }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4a6fa5' }}>
                <Package size={12} />
                {f.produit_fournisseur?.[0]?.count ?? 0} produit{(f.produit_fournisseur?.[0]?.count ?? 0) > 1 ? 's' : ''}
              </div>
              <div className="text-xs" style={{ color: '#4a6fa5' }}>Délai : {f.delai_livraison}j</div>
              {f.conditions_paiement && (
                <div className="text-xs" style={{ color: '#4a6fa5' }}>{f.conditions_paiement}</div>
              )}
            </div>

            {confirmDeleteId === f.id && (
              <div className="p-3 rounded-lg space-y-2" style={{ background: '#1a0505', border: '1px solid #7f1d1d' }}>
                <p className="text-xs" style={{ color: '#f87171' }}>Supprimer ce fournisseur ?</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(f.id)} disabled={isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ background: '#dc2626' }}>
                    Confirmer
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: '#1e2d4a', color: '#94a3b8' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
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
