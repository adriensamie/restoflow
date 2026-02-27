'use client'

import { useState } from 'react'
import { Plus, AlertTriangle, Camera } from 'lucide-react'
import { ProduitModal } from './produit-modal'
import { ImportPhotoProduitsModal } from './import-photo-produits-modal'
import { useRouter } from 'next/navigation'

interface Props {
  alertesCount: number
}

export function StocksHeader({ alertesCount }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [showImportPhoto, setShowImportPhoto] = useState(false)
  const router = useRouter()

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>
            Stocks
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            Gérez vos produits et niveaux de stock
          </p>
        </div>

        <div className="flex items-center gap-3">
          {alertesCount > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#2d1500', border: '1px solid #92400e', color: '#fbbf24' }}
            >
              <AlertTriangle size={15} />
              {alertesCount} alerte{alertesCount > 1 ? 's' : ''}
            </div>
          )}

          <button
            onClick={() => setShowImportPhoto(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: '#0a1f3d', border: '1px solid #1e3a7a', color: '#60a5fa' }}
          >
            <Camera size={16} />
            Import photo
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}
          >
            <Plus size={16} />
            Nouveau produit
          </button>
        </div>
      </div>

      {showModal && (
        <ProduitModal onClose={() => setShowModal(false)} />
      )}

      {showImportPhoto && (
        <ImportPhotoProduitsModal
          onClose={() => setShowImportPhoto(false)}
          onSuccess={() => { setShowImportPhoto(false); router.refresh() }}
        />
      )}
    </>
  )
}
