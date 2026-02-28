'use client'

import { useState, useRef, useTransition } from 'react'
import { Camera, Upload, X, Check, Loader2, AlertTriangle } from 'lucide-react'
import { creerProduit } from '@/lib/actions/stocks'

interface ProduitExtrait {
  nom: string
  categorie: string
  unite: string
  prix_unitaire: number | null
  stock_initial: number | null
  selectionne: boolean
}

export function ImportPhotoProduitsModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'upload' | 'analyse' | 'review' | 'import'>('upload')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [produits, setProduits] = useState<ProduitExtrait[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importCount, setImportCount] = useState(0)
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
      const res = await fetch('/api/ia/analyser-photo-produit', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProduits((data.produits || []).map((p: any) => ({ ...p, selectionne: true })))
      setStep('review')
    } catch (e: any) {
      setError(e.message)
      setStep('upload')
    }
  }

  const toggleProduit = (i: number) => {
    setProduits(prev => prev.map((p, idx) => idx === i ? { ...p, selectionne: !p.selectionne } : p))
  }

  const updateProduit = (i: number, key: string, val: any) => {
    setProduits(prev => prev.map((p, idx) => idx === i ? { ...p, [key]: val } : p))
  }

  const handleImport = () => {
    const selected = produits.filter(p => p.selectionne)
    setStep('import')
    startTransition(async () => {
      let count = 0
      for (const p of selected) {
        try {
          await creerProduit({
            nom: p.nom,
            categorie: p.categorie,
            unite: p.unite,
            prix_unitaire: p.prix_unitaire || undefined,
            seuil_alerte: 0,
          })
          count++
          setImportCount(count)
        } catch (e) { console.error(e) }
      }
      onSuccess()
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
            <Camera size={18} style={{ color: '#60a5fa' }} />
            <h2 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>Import produits par photo</h2>
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
                className="rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all"
                style={{ border: '2px dashed #1e3a7a', background: '#0a1120', padding: '48px', minHeight: '200px' }}>
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                ) : (
                  <>
                    <Upload size={32} style={{ color: '#3b5280', marginBottom: '12px' }} />
                    <p className="text-sm font-medium" style={{ color: '#4a6fa5' }}>Glisse une photo ou clique pour parcourir</p>
                    <p className="text-xs mt-1" style={{ color: '#2d4a7a' }}>JPG, PNG, WEBP — catalogue, bon de livraison, liste</p>
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
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                  Analyser avec l'IA →
                </button>
              )}
            </div>
          )}

          {step === 'analyse' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={32} className="animate-spin" style={{ color: '#60a5fa' }} />
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Analyse en cours avec Claude IA...</p>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: '#4a6fa5' }}>
                {produits.filter(p => p.selectionne).length} produit(s) sélectionné(s) sur {produits.length} détectés
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {produits.map((p, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: p.selectionne ? '#0a1f3d' : '#0a1120', border: `1px solid ${p.selectionne ? '#1e3a7a' : '#1e2d4a'}` }}>
                    <div className="flex items-center gap-3 mb-2">
                      <input type="checkbox" checked={p.selectionne} onChange={() => toggleProduit(i)}
                        style={{ accentColor: '#60a5fa', width: '16px', height: '16px' }} />
                      <input value={p.nom} onChange={e => updateProduit(i, 'nom', e.target.value)}
                        style={{ ...inputStyle, fontWeight: '600' }} />
                    </div>
                    {p.selectionne && (
                      <div className="grid grid-cols-3 gap-2 ml-7">
                        <div>
                          <label className="text-xs block mb-1" style={{ color: '#3b5280' }}>Catégorie</label>
                          <select value={p.categorie} onChange={e => updateProduit(i, 'categorie', e.target.value)} style={inputStyle}>
                            {['viandes','poissons','legumes','fruits','produits_laitiers','epicerie','boissons','surgeles','autres'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs block mb-1" style={{ color: '#3b5280' }}>Unité</label>
                          <select value={p.unite} onChange={e => updateProduit(i, 'unite', e.target.value)} style={inputStyle}>
                            {['kg','g','L','cl','piece','carton','boite'].map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs block mb-1" style={{ color: '#3b5280' }}>Prix unit.</label>
                          <input type="number" step="0.01" value={p.prix_unitaire || ''} placeholder="0.00"
                            onChange={e => updateProduit(i, 'prix_unitaire', parseFloat(e.target.value) || null)}
                            style={inputStyle} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setStep('upload'); setPreview(null); setFile(null) }}
                  className="px-4 py-2 rounded-lg text-sm" style={{ background: '#0a1120', color: '#4a6fa5', border: '1px solid #1e2d4a' }}>
                  Nouvelle photo
                </button>
                <button onClick={handleImport} disabled={produits.filter(p => p.selectionne).length === 0}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                  Importer {produits.filter(p => p.selectionne).length} produit(s)
                </button>
              </div>
            </div>
          )}

          {step === 'import' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              {isPending ? (
                <>
                  <Loader2 size={32} className="animate-spin" style={{ color: '#4ade80' }} />
                  <p className="text-sm" style={{ color: '#4a6fa5' }}>Import en cours... {importCount} produit(s)</p>
                </>
              ) : (
                <>
                  <Check size={40} style={{ color: '#4ade80' }} />
                  <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>{importCount} produit(s) importé(s) !</p>
                  <button onClick={onClose} className="px-6 py-2 rounded-lg text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                    Fermer
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
