'use client'

import { useState } from 'react'
import { X, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import { creerRecette, modifierRecette, ajouterIngredient, supprimerIngredient, supprimerRecette } from '@/lib/actions/recettes'

const TYPES = [
  { value: 'entree', label: 'Entrée' }, { value: 'plat', label: 'Plat' },
  { value: 'dessert', label: 'Dessert' }, { value: 'amuse_bouche', label: 'Amuse-bouche' },
  { value: 'sauce_fond', label: 'Sauce/Fond' }, { value: 'garniture', label: 'Garniture' },
  { value: 'cocktail', label: 'Cocktail' }, { value: 'menu', label: 'Menu' },
]

const ALLERGENES = [
  { value: 'gluten', label: 'Gluten' }, { value: 'crustaces', label: 'Crustacés' },
  { value: 'oeufs', label: 'Œufs' }, { value: 'poissons', label: 'Poissons' },
  { value: 'arachides', label: 'Arachides' }, { value: 'soja', label: 'Soja' },
  { value: 'lait', label: 'Lait' }, { value: 'fruits_a_coque', label: 'Fruits à coque' },
  { value: 'celeri', label: 'Céleri' }, { value: 'moutarde', label: 'Moutarde' },
  { value: 'graines_sesame', label: 'Sésame' }, { value: 'sulfites', label: 'Sulfites' },
  { value: 'lupin', label: 'Lupin' }, { value: 'mollusques', label: 'Mollusques' },
]

interface Props {
  recette?: any
  produits: { id: string; nom: string; unite: string; prix_unitaire_ht: number | null }[]
  vins: { id: string; nom: string; appellation: string | null; prix_achat_ht: number | null }[]
  preRempli?: any
  onClose: () => void
}

export function RecetteModal({ recette, produits, vins, preRempli, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [onglet, setOnglet] = useState<'infos' | 'ingredients' | 'allergenes'>('infos')
  const [recetteId, setRecetteId] = useState<string | null>(recette?.id ?? null)
  const [ingredients, setIngredients] = useState<any[]>(recette?.recette_ingredients ?? [])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({
    nom: preRempli?.nom ?? recette?.nom ?? '',
    type: preRempli?.type ?? recette?.type ?? 'plat',
    description: recette?.description ?? '',
    prix_vente_ttc: recette?.prix_vente_ttc?.toString() ?? '',
    pourcentage_ficelles: recette?.pourcentage_ficelles?.toString() ?? '3',
    nb_portions: recette?.nb_portions?.toString() ?? '1',
    allergenes: (preRempli?.allergenes ?? recette?.allergenes ?? []) as string[],
  })
  const [newIngr, setNewIngr] = useState({ produit_id: '', vin_id: '', quantite: '', unite: 'g' })
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const coutIngredients = ingredients.reduce((acc: number, i: any) => acc + (i.quantite * (i.cout_unitaire || 0)), 0)
  const ficelles = parseFloat(form.pourcentage_ficelles) || 3
  const coutTotal = coutIngredients * (1 + ficelles / 100)
  const coutPortion = coutTotal / (parseInt(form.nb_portions) || 1)
  const prixVente = parseFloat(form.prix_vente_ttc)
  const prixHT = prixVente / 1.1
  const foodCost = prixHT > 0 ? Math.round((coutPortion / prixHT) * 1000) / 10 : null
  const coeff = coutPortion > 0 ? Math.round((prixVente / coutPortion) * 10) / 10 : null

  const foodCostColor = (fc: number | null) => {
    if (!fc) return '#4a6fa5'
    if (fc <= 28) return '#4ade80'
    if (fc <= 35) return '#fbbf24'
    return '#f87171'
  }

  const handleSaveInfos = async () => {
    if (!form.nom.trim()) return
    setLoading(true)
    try {
      const payload = {
        nom: form.nom, type: form.type,
        description: form.description || null,
        prix_vente_ttc: form.prix_vente_ttc ? parseFloat(form.prix_vente_ttc) : null,
        pourcentage_ficelles: parseFloat(form.pourcentage_ficelles) || 3,
        nb_portions: parseInt(form.nb_portions) || 1,
        allergenes: form.allergenes,
        importe_ia: !!preRempli,
      }
      if (recetteId) {
        await modifierRecette(recetteId, payload)
      } else {
        const r = await creerRecette(payload as any)
        if (!r?.id) throw new Error('Erreur lors de la création')
        setRecetteId(r.id)
      }
      setError('')
      setOnglet('ingredients')
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }

  const handleAddIngredient = async () => {
    if (!recetteId || !newIngr.quantite) return
    try {
      const produit = produits.find(p => p.id === newIngr.produit_id)
      const vin = vins.find(v => v.id === newIngr.vin_id)
      const coutUnitaire = produit?.prix_unitaire_ht
        ? (['kg'].includes(produit.unite || '') ? produit.prix_unitaire_ht / 1000 : ['L'].includes(produit.unite || '') ? produit.prix_unitaire_ht / 100 : produit.prix_unitaire_ht)
        : vin?.prix_achat_ht ?? 0
      await ajouterIngredient({
        recette_id: recetteId,
        produit_id: newIngr.produit_id || undefined,
        vin_id: newIngr.vin_id || undefined,
        quantite: parseFloat(newIngr.quantite),
        unite: newIngr.unite,
        cout_unitaire: coutUnitaire,
      })
      setNewIngr({ produit_id: '', vin_id: '', quantite: '', unite: 'g' })
      setIngredients(prev => [...prev, {
        id: Date.now().toString(),
        nom: produit?.nom ?? vin?.nom ?? '?',
        quantite: parseFloat(newIngr.quantite),
        unite: newIngr.unite,
        cout_unitaire: coutUnitaire,
      }])
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
  }

  const handleRemoveIngredient = async (id: string) => {
    if (!recetteId) return
    try {
      await supprimerIngredient(id, recetteId)
      setIngredients(prev => prev.filter(i => i.id !== id))
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') }
  }

  const handleDeleteRecette = async () => {
    if (!recetteId) return
    setLoading(true)
    try {
      await supprimerRecette(recetteId)
      onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', width: '100%', outline: 'none', fontSize: '14px'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a', maxHeight: '90vh' }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
              <UtensilsCrossed size={16} className="text-white" />
            </div>
            <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>
              {recette ? 'Modifier la recette' : 'Nouvelle recette'}
              {preRempli && <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#1a0d2e', color: '#a78bfa' }}>Import IA</span>}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={18} /></button>
        </div>

        <div className="flex px-6" style={{ borderBottom: '1px solid #1e2d4a' }}>
          {[
            { key: 'infos', label: 'Informations' },
            { key: 'ingredients', label: 'Ingrédients' },
            { key: 'allergenes', label: 'Allergènes' },
          ].map(o => (
            <button key={o.key} onClick={() => setOnglet(o.key as any)}
              className="px-4 py-3 text-sm font-medium transition-all"
              style={{
                color: onglet === o.key ? '#60a5fa' : '#4a6fa5',
                borderBottom: onglet === o.key ? '2px solid #3b82f6' : '2px solid transparent',
              }}>
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {onglet === 'infos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Nom *</label>
                  <input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Magret de canard" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Type</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={2} placeholder="Description courte..." style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Prix vente TTC (€)</label>
                  <input type="number" step="0.01" value={form.prix_vente_ttc}
                    onChange={e => set('prix_vente_ttc', e.target.value)} placeholder="24.00" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>% Ficelles</label>
                  <input type="number" step="0.5" value={form.pourcentage_ficelles}
                    onChange={e => set('pourcentage_ficelles', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#4a6fa5' }}>Nb portions</label>
                  <input type="number" min="1" value={form.nb_portions}
                    onChange={e => set('nb_portions', e.target.value)} style={inputStyle} />
                </div>
              </div>
              {(coutPortion > 0 || prixVente > 0) && (
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl" style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
                  <div className="text-center">
                    <p className="text-xs mb-1" style={{ color: '#2d4a7a' }}>Coût / portion</p>
                    <p className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
                      {coutPortion > 0 ? `${coutPortion.toFixed(2)} €` : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs mb-1" style={{ color: '#2d4a7a' }}>Food cost</p>
                    <p className="text-lg font-bold" style={{ color: foodCostColor(foodCost) }}>
                      {foodCost ? `${foodCost}%` : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs mb-1" style={{ color: '#2d4a7a' }}>Coefficient</p>
                    <p className="text-lg font-bold" style={{ color: '#60a5fa' }}>
                      {coeff ? `×${coeff}` : '—'}
                    </p>
                  </div>
                </div>
              )}

              {recetteId && (
                <div className="pt-3" style={{ borderTop: '1px solid #1e2d4a' }}>
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg"
                      style={{ color: '#f87171', background: '#1a0505', border: '1px solid #7f1d1d' }}>
                      <Trash2 size={13} />Supprimer la recette
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: '#f87171' }}>Supprimer définitivement cette recette ?</p>
                      <div className="flex gap-2">
                        <button onClick={handleDeleteRecette} disabled={loading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                          style={{ background: '#dc2626' }}>
                          <Trash2 size={12} />Confirmer
                        </button>
                        <button onClick={() => setConfirmDelete(false)}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: '#1e2d4a', color: '#94a3b8' }}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {onglet === 'ingredients' && (
            <div className="space-y-4">
              {!recetteId && (
                <div className="p-4 rounded-xl text-sm text-center" style={{ background: '#1a1505', border: '1px solid #fbbf24', color: '#fbbf24' }}>
                  Sauvegardez d'abord les informations avant d'ajouter des ingrédients
                </div>
              )}
              <div className="space-y-2">
                {ingredients.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg"
                    style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
                    <div>
                      <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                        {i.produits?.nom ?? i.vins?.nom ?? i.nom ?? '?'}
                      </span>
                      <span className="text-xs ml-2" style={{ color: '#4a6fa5' }}>{i.quantite} {i.unite}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium" style={{ color: '#60a5fa' }}>
                        {i.cout_total ? `${parseFloat(i.cout_total).toFixed(3)} €` :
                         i.cout_unitaire ? `${(i.quantite * i.cout_unitaire).toFixed(3)} €` : '—'}
                      </span>
                      <button onClick={() => handleRemoveIngredient(i.id)} style={{ color: '#f87171' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {ingredients.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: '#2d4a7a' }}>Aucun ingrédient ajouté</p>
                )}
              </div>
              {recetteId && (
                <div className="p-4 rounded-xl space-y-3" style={{ background: '#0a1120', border: '1px solid #1e2d4a' }}>
                  <p className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Ajouter un ingrédient</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newIngr.produit_id}
                      onChange={e => setNewIngr(n => ({ ...n, produit_id: e.target.value, vin_id: '' }))}
                      style={inputStyle}>
                      <option value="">— Produit stock —</option>
                      {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>
                    <select value={newIngr.vin_id}
                      onChange={e => setNewIngr(n => ({ ...n, vin_id: e.target.value, produit_id: '' }))}
                      style={inputStyle}>
                      <option value="">— Vin cave —</option>
                      {vins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" step="0.1" placeholder="Quantité"
                      value={newIngr.quantite}
                      onChange={e => setNewIngr(n => ({ ...n, quantite: e.target.value }))}
                      style={inputStyle} />
                    <select value={newIngr.unite}
                      onChange={e => setNewIngr(n => ({ ...n, unite: e.target.value }))}
                      style={inputStyle}>
                      {['g', 'kg', 'ml', 'cl', 'l', 'pièce', 'unité'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <button onClick={handleAddIngredient}
                      disabled={!newIngr.quantite || (!newIngr.produit_id && !newIngr.vin_id)}
                      className="flex items-center justify-center gap-1 rounded-lg text-sm font-medium text-white"
                      style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: !newIngr.quantite ? 0.4 : 1 }}>
                      <Plus size={14} />Ajouter
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {onglet === 'allergenes' && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: '#4a6fa5' }}>
                Sélectionne les 14 allergènes présents dans cette recette (obligatoire EU)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ALLERGENES.map(a => {
                  const actif = form.allergenes.includes(a.value)
                  return (
                    <button key={a.value}
                      onClick={() => set('allergenes', actif
                        ? form.allergenes.filter((x: string) => x !== a.value)
                        : [...form.allergenes, a.value]
                      )}
                      className="px-3 py-2.5 rounded-lg text-sm text-left transition-all"
                      style={{
                        background: actif ? '#1a1505' : '#0a1120',
                        border: `1px solid ${actif ? '#fbbf24' : '#1e2d4a'}`,
                        color: actif ? '#fbbf24' : '#4a6fa5',
                      }}>
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 p-3 rounded-xl text-sm" style={{ background: '#1a0505', color: '#f87171', border: '1px solid #dc2626' }}>
            {error}
          </div>
        )}

        <div className="flex justify-between items-center px-6 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm"
            style={{ background: '#1e2d4a', color: '#94a3b8' }}>Fermer</button>
          {onglet === 'infos' && (
            <button onClick={handleSaveInfos} disabled={loading || !form.nom}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sauvegarde...' : recetteId ? 'Mettre à jour' : 'Créer et ajouter les ingrédients →'}
            </button>
          )}
          {onglet === 'allergenes' && (
            <button onClick={handleSaveInfos} disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
