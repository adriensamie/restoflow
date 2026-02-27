'use client'

import { useState, useRef, useTransition } from 'react'
import { Camera, Upload, X, Check, Loader2, AlertTriangle } from 'lucide-react'
import { creerRecette } from '@/lib/actions/recettes'

export function ImportPhotoRecetteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'upload' | 'analyse' | 'review' | 'import'>('upload')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }

  const analyser = async () => {
    if (!file) return
    setStep('analyse')
    setError(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/ia/analyser-photo-recette', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setStep('review')
    } catch (e: any) {
      setError(e.message)
      setStep('upload')
    }
  }

  const handleImport = () => {
    startTransition(async () => {
      try {
        await creerRecette({
          nom: data.recette.nom,
          type: data.recette.categorie || 'plat',
          nb_portions: data.recette.nb_portions || 1,
          description: data.recette.description,
        })
        setStep('import')
        setTimeout(onSuccess, 1000)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0',
    borderRadius: '6px', padding: '6px 10px', fontSize: '13px', outline: 'none', width: '100%'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: '#0d1526', border: '1px solid #1e2d4a', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="flex items-center gap-3">
            <Camera size={18} style={{ color: '#a78bfa' }} />
            <h2 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>Import recette par photo</h2>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: '#4a6fa5' }} /></button>
        </div>

        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="rounded-xl flex flex-col items-center justify-center cursor-pointer"
                style={{ border: '2px dashed #2d1e6a', background: '#0a1120', padding: '48px', minHeight: '200px' }}>
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                ) : (
                  <>
                    <Upload size={32} style={{ color: '#3b5280', marginBottom: '12px' }} />
                    <p className="text-sm font-medium" style={{ color: '#4a6fa5' }}>Photo d'une fiche recette</p>
                    <p className="text-xs mt-1" style={{ color: '#2d4a7a' }}>Manuscrite ou imprimée — l'IA extrait tout automatiquement</p>
                  </>
                )}
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: '#1a0505', color: '#f87171' }}>
                  <AlertTriangle size={14} />{error}
                </div>
              )}
              {file && (
                <button onClick={analyser}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}>
                  Analyser avec l'IA →
                </button>
              )}
            </div>
          )}

          {step === 'analyse' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={32} className="animate-spin" style={{ color: '#a78bfa' }} />
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Analyse de la recette en cours...</p>
            </div>
          )}

          {step === 'review' && data && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#3b5280' }}>Informations recette</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Nom</label>
                    <input value={data.recette?.nom || ''} onChange={e => setData((d: any) => ({ ...d, recette: { ...d.recette, nom: e.target.value } }))} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Type</label>
                    <select value={data.recette?.categorie || 'plat'} onChange={e => setData((d: any) => ({ ...d, recette: { ...d.recette, categorie: e.target.value } }))} style={inputStyle}>
                      {['entree','plat','dessert','boisson','sauce','autre'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Portions</label>
                    <input type="number" value={data.recette?.nb_portions || 1} onChange={e => setData((d: any) => ({ ...d, recette: { ...d.recette, nb_portions: parseInt(e.target.value) } }))} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Tps prépa (min)</label>
                    <input type="number" value={data.recette?.temps_preparation || ''} onChange={e => setData((d: any) => ({ ...d, recette: { ...d.recette, temps_preparation: parseInt(e.target.value) || null } }))} style={inputStyle} />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#3b5280' }}>
                  {data.ingredients?.length || 0} ingrédient(s) détecté(s)
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(data.ingredients || []).map((ing: any, i: number) => (
                    <div key={i} className="grid grid-cols-3 gap-2 p-2 rounded-lg" style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
                      <input value={ing.nom} onChange={e => setData((d: any) => ({ ...d, ingredients: d.ingredients.map((x: any, idx: number) => idx === i ? { ...x, nom: e.target.value } : x) }))} style={inputStyle} placeholder="Ingrédient" />
                      <input type="number" step="0.01" value={ing.quantite} onChange={e => setData((d: any) => ({ ...d, ingredients: d.ingredients.map((x: any, idx: number) => idx === i ? { ...x, quantite: parseFloat(e.target.value) } : x) }))} style={inputStyle} placeholder="Qté" />
                      <select value={ing.unite} onChange={e => setData((d: any) => ({ ...d, ingredients: d.ingredients.map((x: any, idx: number) => idx === i ? { ...x, unite: e.target.value } : x) }))} style={inputStyle}>
                        {['kg','g','L','cl','piece','pincee','cuillere_soupe','cuillere_cafe'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => { setStep('upload'); setPreview(null); setFile(null) }}
                  className="px-4 py-2 rounded-lg text-sm" style={{ background: '#0a1120', color: '#4a6fa5', border: '1px solid #1e2d4a' }}>
                  Nouvelle photo
                </button>
                <button onClick={handleImport} disabled={isPending}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}>
                  {isPending ? 'Import...' : 'Importer la recette'}
                </button>
              </div>
            </div>
          )}

          {step === 'import' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Check size={40} style={{ color: '#4ade80' }} />
              <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>Recette importée avec succès !</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
