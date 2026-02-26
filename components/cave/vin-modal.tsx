'use client'

import { useState } from 'react'
import { X, Wine } from 'lucide-react'
import { creerVin, modifierVin } from '@/lib/actions/cave'

const CATEGORIES = [
  { value: 'rouge', label: 'Rouge' },
  { value: 'blanc', label: 'Blanc' },
  { value: 'rose', label: 'Rosé' },
  { value: 'bulles', label: 'Bulles' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'digestif', label: 'Digestif' },
  { value: 'autre', label: 'Autre' },
]

const ZONES = [
  { value: 'cave_principale', label: 'Cave principale' },
  { value: 'reserve', label: 'Réserve' },
  { value: 'bar', label: 'Bar' },
]

interface Vin {
  id: string; nom: string; appellation: string | null; categorie: string; zone: string
  prix_achat_ht: number | null; prix_vente_ttc: number | null
  prix_verre_ttc: number | null; contenance_verre: number | null; vendu_au_verre: boolean
  stock_bouteilles: number; seuil_alerte: number
}

export function VinModal({ vin, onClose }: { vin?: Vin; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom: vin?.nom ?? '',
    appellation: vin?.appellation ?? '',
    categorie: vin?.categorie ?? 'rouge',
    zone: vin?.zone ?? 'cave_principale',
    prix_achat_ht: vin?.prix_achat_ht?.toString() ?? '',
    prix_vente_ttc: vin?.prix_vente_ttc?.toString() ?? '',
    vendu_au_verre: vin?.vendu_au_verre ?? false,
    prix_verre_ttc: vin?.prix_verre_ttc?.toString() ?? '',
    contenance_verre: vin?.contenance_verre?.toString() ?? '15',
    stock_bouteilles: vin?.stock_bouteilles?.toString() ?? '0',
    seuil_alerte: vin?.seuil_alerte?.toString() ?? '3',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nom.trim()) return
    setLoading(true)
    try {
      const payload = {
        nom: form.nom.trim(),
        appellation: form.appellation || null,
        categorie: form.categorie,
        zone: form.zone,
        prix_achat_ht: form.prix_achat_ht ? parseFloat(form.prix_achat_ht) : null,
        prix_vente_ttc: form.prix_vente_ttc ? parseFloat(form.prix_vente_ttc) : null,
        vendu_au_verre: form.vendu_au_verre,
        prix_verre_ttc: form.vendu_au_verre && form.prix_verre_ttc ? parseFloat(form.prix_verre_ttc) : null,
        contenance_verre: form.vendu_au_verre ? parseInt(form.contenance_verre) : null,
        stock_bouteilles: parseInt(form.stock_bouteilles) || 0,
        seuil_alerte: parseInt(form.seuil_alerte) || 3,
      }
      if (vin) await modifierVin(vin.id, payload)
      else await creerVin(payload as any)
      onClose()
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }
  const labelStyle = { color: '#4a6fa5', fontSize: '12px', marginBottom: '4px', display: 'block' }

  // Calcul marge live
  const marge = form.prix_achat_ht && form.prix_vente_ttc
    ? Math.round(((parseFloat(form.prix_vente_ttc) / 1.2) - parseFloat(form.prix_achat_ht))
        / (parseFloat(form.prix_vente_ttc) / 1.2) * 100)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c2d12, #dc2626)' }}>
              <Wine size={16} style={{ color: 'white' }} />
            </div>
            <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>
              {vin ? 'Modifier le vin' : 'Nouveau vin'}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Nom + Appellation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Nom *</label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)}
                placeholder="Château Margaux" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Appellation</label>
              <input value={form.appellation} onChange={e => set('appellation', e.target.value)}
                placeholder="Margaux AOC" style={inputStyle} />
            </div>
          </div>

          {/* Catégorie + Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Catégorie</label>
              <select value={form.categorie} onChange={e => set('categorie', e.target.value)} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Zone</label>
              <select value={form.zone} onChange={e => set('zone', e.target.value)} style={inputStyle}>
                {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
              </select>
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Prix achat HT (€)</label>
              <input type="number" step="0.01" value={form.prix_achat_ht}
                onChange={e => set('prix_achat_ht', e.target.value)}
                placeholder="12.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prix vente TTC (€)</label>
              <input type="number" step="0.01" value={form.prix_vente_ttc}
                onChange={e => set('prix_vente_ttc', e.target.value)}
                placeholder="35.00" style={inputStyle} />
            </div>
          </div>

          {/* Marge calculée */}
          {marge !== null && (
            <div className="px-4 py-2 rounded-lg flex items-center justify-between"
              style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
              <span className="text-sm" style={{ color: '#4a6fa5' }}>Marge calculée</span>
              <span className="text-sm font-bold"
                style={{ color: marge >= 60 ? '#4ade80' : marge >= 40 ? '#fbbf24' : '#f87171' }}>
                {marge}%
              </span>
            </div>
          )}

          {/* Stock + Seuil */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Stock bouteilles</label>
              <input type="number" value={form.stock_bouteilles}
                onChange={e => set('stock_bouteilles', e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Seuil alerte (min)</label>
              <input type="number" value={form.seuil_alerte}
                onChange={e => set('seuil_alerte', e.target.value)}
                style={inputStyle} />
            </div>
          </div>

          {/* Vin au verre */}
          <div className="p-4 rounded-xl" style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => set('vendu_au_verre', !form.vendu_au_verre)}
                className="w-10 h-5 rounded-full transition-all relative"
                style={{ background: form.vendu_au_verre ? '#dc2626' : '#1e2d4a' }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.vendu_au_verre ? '22px' : '2px' }} />
              </button>
              <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Vendu au verre</span>
            </div>
            {form.vendu_au_verre && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Prix verre TTC (€)</label>
                  <input type="number" step="0.01" value={form.prix_verre_ttc}
                    onChange={e => set('prix_verre_ttc', e.target.value)}
                    placeholder="8.00" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contenance (cl)</label>
                  <input type="number" value={form.contenance_verre}
                    onChange={e => set('contenance_verre', e.target.value)}
                    style={inputStyle} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading || !form.nom}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #7c2d12, #dc2626)', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Enregistrement...' : vin ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
