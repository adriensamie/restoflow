'use client'

import { useState, useRef } from 'react'
import { X, Sparkles, Upload, CheckCircle, AlertTriangle } from 'lucide-react'

interface Props {
  onResultat: (data: any) => void
  onClose: () => void
}

export function AnalyserFicheModal({ onResultat, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultat, setResultat] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleAnalyse = async () => {
    if (!preview) return
    setLoading(true)
    setError(null)
    try {
      const base64 = preview.split(',')[1]
      const mimeType = preview.split(';')[0].split(':')[1]
      const res = await fetch('/api/ia/analyser-fiche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setResultat(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const confColor = (c: string) =>
    c === 'haute' ? '#4ade80' : c === 'moyenne' ? '#fbbf24' : '#f87171'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Import IA — Fiche technique</h2>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>Photo manuscrite ou imprimée</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Upload */}
          {!resultat && (
            <>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                style={{ borderColor: preview ? '#3b82f6' : '#1e2d4a', background: '#0a1120' }}>
                {preview ? (
                  <img src={preview} alt="aperçu" className="max-h-48 mx-auto rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload size={32} className="mx-auto mb-2 opacity-30" style={{ color: '#60a5fa' }} />
                    <p className="text-sm" style={{ color: '#4a6fa5' }}>Cliquer ou glisser une photo</p>
                    <p className="text-xs mt-1" style={{ color: '#2d4a7a' }}>JPG, PNG, HEIC</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {error && (
                <div className="p-3 rounded-lg flex items-center gap-2"
                  style={{ background: '#1a0505', border: '1px solid #dc2626', color: '#f87171' }}>
                  <AlertTriangle size={14} /><span className="text-sm">{error}</span>
                </div>
              )}

              <button onClick={handleAnalyse} disabled={loading || !preview}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', opacity: !preview ? 0.4 : 1 }}>
                <Sparkles size={16} />
                {loading ? 'Analyse en cours...' : 'Analyser avec Claude'}
              </button>
            </>
          )}

          {/* Résultat */}
          {resultat && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: '#0a2d1a', border: '1px solid #15803d' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} style={{ color: '#4ade80' }} />
                  <span className="text-sm font-medium" style={{ color: '#4ade80' }}>
                    Analyse réussie — {resultat.nom}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ color: confColor(resultat.confiance), background: '#0a1120' }}>
                  Confiance : {resultat.confiance}
                </span>
              </div>

              <div className="p-4 rounded-xl space-y-2" style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span style={{ color: '#4a6fa5' }}>Type : </span>
                    <span style={{ color: '#e2e8f0' }}>{resultat.type}</span></div>
                  <div><span style={{ color: '#4a6fa5' }}>Portions : </span>
                    <span style={{ color: '#e2e8f0' }}>{resultat.nb_portions}</span></div>
                  {resultat.prix_vente_ttc && (
                    <div><span style={{ color: '#4a6fa5' }}>Prix : </span>
                      <span style={{ color: '#4ade80' }}>{resultat.prix_vente_ttc} €</span></div>
                  )}
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#4a6fa5' }}>
                    Ingrédients détectés ({resultat.ingredients?.length ?? 0}) :
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {resultat.ingredients?.map((i: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs px-2 py-1 rounded"
                        style={{ background: '#0d1526' }}>
                        <span style={{ color: '#e2e8f0' }}>{i.nom}</span>
                        <span style={{ color: '#60a5fa' }}>{i.quantite} {i.unite}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {resultat.allergenes?.length > 0 && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#4a6fa5' }}>Allergènes :</p>
                    <div className="flex flex-wrap gap-1">
                      {resultat.allergenes.map((a: string) => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#1a1505', color: '#fbbf24' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setResultat(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: '#1e2d4a', color: '#94a3b8' }}>
                  Recommencer
                </button>
                <button onClick={() => onResultat(resultat)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                  Créer la recette →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
