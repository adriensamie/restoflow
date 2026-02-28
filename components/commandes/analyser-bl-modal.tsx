'use client'

import { useState, useRef } from 'react'
import { X, Upload, Camera, Loader2, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react'

interface LigneBL {
  designation: string
  nom_normalise: string
  quantite: number
  unite: string
  prix_unitaire_ht: number | null
  reference: string | null
}

interface ResultatBL {
  fournisseur: { nom: string; telephone: string | null; email: string | null }
  numero_bl: string | null
  date: string | null
  lignes: LigneBL[]
  total_ht: number | null
  confiance: 'haute' | 'moyenne' | 'basse'
}

interface Props {
  onResultat: (resultat: ResultatBL) => void
  onClose: () => void
}

export function AnalyserBLModal({ onResultat, onClose }: Props) {
  const [step, setStep] = useState<'upload' | 'analyse' | 'resultat'>('upload')
  const [image, setImage] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [resultat, setResultat] = useState<ResultatBL | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier dépasse 5 Mo. Veuillez réduire la taille de l\'image.')
      return
    }
    setMimeType(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = e => {
      const base64 = (e.target?.result as string).split(',')[1]
      setImage(base64)
    }
    reader.readAsDataURL(file)
  }

  const analyser = async () => {
    if (!image) return
    setStep('analyse')
    setError('')

    try {
      const res = await fetch('/api/ia/analyser-bl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image, mimeType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur analyse')
      setResultat(data.data)
      setStep('resultat')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setStep('upload')
    }
  }

  const confianceColor = {
    haute: '#4ade80', moyenne: '#fbbf24', basse: '#f87171'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl rounded-2xl" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: '#60a5fa' }} />
            <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
              Import IA — Bon de livraison
            </h2>
          </div>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={20} /></button>
        </div>

        <div className="p-6">
          {/* Step 1 — Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              <p className="text-sm" style={{ color: '#4a6fa5' }}>
                Prenez en photo ou importez votre bon de livraison. Claude analysera automatiquement les produits, quantités et prix.
              </p>

              {/* Zone drop */}
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                style={{ borderColor: image ? '#3b82f6' : '#1e2d4a', background: image ? '#0a1628' : 'transparent' }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              >
                {image ? (
                  <div className="space-y-2">
                    <CheckCircle size={32} className="mx-auto" style={{ color: '#4ade80' }} />
                    <p className="text-sm font-medium" style={{ color: '#4ade80' }}>Image chargée</p>
                    <p className="text-xs" style={{ color: '#4a6fa5' }}>Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload size={32} className="mx-auto opacity-40" style={{ color: '#60a5fa' }} />
                    <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                      Glissez une photo ici ou cliquez pour parcourir
                    </p>
                    <p className="text-xs" style={{ color: '#4a6fa5' }}>JPG, PNG, WEBP — Max 5MB</p>
                  </div>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

              {error && (
                <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                  style={{ background: '#1a0a0a', color: '#f87171' }}>
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
                <button onClick={analyser} disabled={!image}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', opacity: image ? 1 : 0.4 }}>
                  <Sparkles size={15} />
                  Analyser avec Claude
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Analyse en cours */}
          {step === 'analyse' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full opacity-20 animate-ping"
                  style={{ background: '#6366f1' }} />
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <Sparkles size={24} className="text-white" />
                </div>
              </div>
              <p className="font-medium" style={{ color: '#e2e8f0' }}>Claude analyse votre BL...</p>
              <p className="text-sm" style={{ color: '#4a6fa5' }}>
                Extraction des produits, quantités et prix en cours
              </p>
            </div>
          )}

          {/* Step 3 — Résultat */}
          {step === 'resultat' && resultat && (
            <div className="space-y-4">
              {/* Header résultat */}
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
                <div>
                  <p className="font-semibold" style={{ color: '#e2e8f0' }}>{resultat.fournisseur.nom}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>
                    {resultat.numero_bl && `BL ${resultat.numero_bl} · `}
                    {resultat.date ?? 'Date non détectée'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: confianceColor[resultat.confiance] }}>
                    Confiance : {resultat.confiance}
                  </p>
                  {resultat.total_ht != null && (
                    <p className="text-sm font-semibold mt-0.5" style={{ color: '#60a5fa' }}>
                      {resultat.total_ht.toFixed(2)} € HT
                    </p>
                  )}
                </div>
              </div>

              {/* Lignes */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
                <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-semibold uppercase"
                  style={{ background: '#0a1628', color: '#3b5280' }}>
                  <span className="col-span-2">Produit</span>
                  <span>Quantité</span>
                  <span>Prix HT</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {resultat.lignes.map((ligne, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 text-sm"
                      style={{ background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderTop: '1px solid #1a2540' }}>
                      <div className="col-span-2">
                        <p style={{ color: '#e2e8f0' }}>{ligne.nom_normalise}</p>
                        <p className="text-xs opacity-60" style={{ color: '#4a6fa5' }}>{ligne.designation}</p>
                      </div>
                      <span style={{ color: '#94a3b8' }}>{ligne.quantite} {ligne.unite}</span>
                      <span style={{ color: ligne.prix_unitaire_ht ? '#60a5fa' : '#2d4a7a' }}>
                        {ligne.prix_unitaire_ht ? `${ligne.prix_unitaire_ht.toFixed(2)} €` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs" style={{ color: '#2d4a7a' }}>
                Vérifiez les données avant d'importer. Vous pourrez modifier chaque ligne dans la commande.
              </p>

              <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: '#1e2d4a', color: '#94a3b8' }}>
                  Recommencer
                </button>
                <button onClick={() => { onResultat(resultat); onClose() }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                  <CheckCircle size={15} />
                  Importer ({resultat.lignes.length} produits)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
