'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { X, Loader2, Plus, Trash2, Check } from 'lucide-react'
import { creerCommande } from '@/lib/actions/commandes'

interface Produit {
  produit_id: string
  nom: string
  categorie: string | null
  unite: string
  quantite_actuelle: number | null
}

interface Ligne {
  produit_id: string
  nom: string
  quantite_commandee: number
  prix_unitaire: number | undefined
  unite: string
}

interface Props {
  fournisseurs: { id: string; nom: string }[]
  blPreRempli?: {
    fournisseur: { nom: string }
    lignes: { nom_normalise: string; quantite: number; unite: string; prix_unitaire_ht: number | null }[]
    date: string | null
  } | null
  onClose: () => void
}

const inputStyle = { background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }

export function NouvelleCommandeModal({ fournisseurs, blPreRempli, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [fournisseurId, setFournisseurId] = useState('')
  const [dateLivraison, setDateLivraison] = useState('')
  const [note, setNote] = useState('')
  const [allProduits, setAllProduits] = useState<Produit[]>([])
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([])

  // Charger les produits depuis l'API au montage
  useEffect(() => {
    fetch('/api/stocks/produits')
      .then(res => res.json())
      .then((data: Produit[]) => setAllProduits(data))
      .catch(() => {})
  }, [])

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown !== null) {
        const ref = dropdownRefs.current[openDropdown]
        if (ref && !ref.contains(e.target as Node)) {
          setOpenDropdown(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])

  // Pré-remplir depuis le BL analysé
  const [lignes, setLignes] = useState<Ligne[]>(() => {
    if (blPreRempli?.lignes) {
      return blPreRempli.lignes.map(l => ({
        produit_id: '',
        nom: l.nom_normalise,
        quantite_commandee: l.quantite,
        prix_unitaire: l.prix_unitaire_ht ?? undefined,
        unite: l.unite,
      }))
    }
    return [{ produit_id: '', nom: '', quantite_commandee: 1, prix_unitaire: undefined, unite: 'kg' }]
  })

  const addLigne = () => setLignes(l => [...l, { produit_id: '', nom: '', quantite_commandee: 1, prix_unitaire: undefined, unite: 'kg' }])
  const removeLigne = (i: number) => setLignes(l => l.filter((_, idx) => idx !== i))
  const updateLigne = (i: number, key: string, value: string | number) =>
    setLignes(l => l.map((item, idx) => idx === i ? { ...item, [key]: value } : item))

  const getFilteredProduits = (search: string) => {
    if (!search.trim()) return allProduits.slice(0, 10)
    const lower = search.toLowerCase()
    return allProduits.filter(p => p.nom.toLowerCase().includes(lower)).slice(0, 10)
  }

  const selectProduit = (lineIdx: number, produit: Produit) => {
    setLignes(l => l.map((item, idx) =>
      idx === lineIdx
        ? { ...item, produit_id: produit.produit_id, nom: produit.nom, unite: produit.unite }
        : item
    ))
    setOpenDropdown(null)
  }

  const totalHT = lignes.reduce((acc, l) => acc + l.quantite_commandee * (l.prix_unitaire ?? 0), 0)

  const handleSubmit = () => {
    if (!fournisseurId) { setError('Sélectionnez un fournisseur'); return }
    if (lignes.some(l => !l.nom.trim() || l.quantite_commandee <= 0)) {
      setError('Vérifiez les lignes — nom et quantité requis')
      return
    }
    const lignesAvecProduit = lignes.filter(l => l.produit_id)
    if (lignesAvecProduit.length === 0) {
      setError('Aucune ligne n\'est liée à un produit existant. Sélectionnez un produit depuis la liste déroulante.')
      return
    }
    const lignesSansProduit = lignes.filter(l => l.nom.trim() && !l.produit_id)
    const warningMsg = lignesSansProduit.length > 0
      ? `${lignesSansProduit.length} ligne(s) non liée(s) seront ignorées.`
      : ''
    setError('')

    startTransition(async () => {
      try {
        await creerCommande({
          fournisseur_id: fournisseurId,
          date_livraison_prevue: dateLivraison || undefined,
          note: [note, warningMsg].filter(Boolean).join(' — ') || undefined,
          lignes: lignesAvecProduit.map(l => ({
            produit_id: l.produit_id,
            quantite_commandee: l.quantite_commandee,
            prix_unitaire: l.prix_unitaire,
          })),
        })
        onClose()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #1e2d4a' }}>
          <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
            {blPreRempli ? 'Commande depuis BL importé' : 'Nouvelle commande'}
          </h2>
          <button onClick={onClose} style={{ color: '#4a6fa5' }}><X size={20} /></button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {blPreRempli && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: '#0a1f3d', border: '1px solid #1d4ed8', color: '#60a5fa' }}>
              ✨ {blPreRempli.lignes.length} produits importés depuis le BL de {blPreRempli.fournisseur.nom}
            </div>
          )}

          {/* Fournisseur + date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Fournisseur *</label>
              <select value={fournisseurId} onChange={e => setFournisseurId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="">Sélectionner...</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Livraison prévue</label>
              <input type="date" value={dateLivraison} onChange={e => setDateLivraison(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Lignes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Lignes de commande</label>
              <button onClick={addLigne}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                style={{ color: '#60a5fa', background: '#0a1f3d' }}>
                <Plus size={12} /> Ajouter
              </button>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold uppercase"
                style={{ background: '#0a1628', color: '#3b5280' }}>
                <span className="col-span-4">Produit</span>
                <span className="col-span-2">Qté</span>
                <span className="col-span-2">Unité</span>
                <span className="col-span-3">Prix HT (€)</span>
                <span className="col-span-1"></span>
              </div>

              {lignes.map((ligne, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 items-center"
                  style={{ background: i % 2 === 0 ? '#0d1526' : '#0a1120', borderTop: '1px solid #1a2540' }}>
                  <div className="col-span-4 relative" ref={el => { dropdownRefs.current[i] = el }}>
                    <div className="flex items-center gap-1">
                      <input className="flex-1 px-2 py-1.5 rounded text-sm outline-none"
                        style={inputStyle} placeholder="Rechercher un produit..."
                        value={ligne.nom}
                        onChange={e => {
                          const val = e.target.value
                          setLignes(l => l.map((item, idx) =>
                            idx === i ? { ...item, nom: val, produit_id: '' } : item
                          ))
                          setOpenDropdown(i)
                        }}
                        onFocus={() => setOpenDropdown(i)} />
                      {ligne.produit_id && (
                        <span title="Produit lié" className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full"
                          style={{ background: '#065f46', color: '#34d399' }}>
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    {openDropdown === i && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg overflow-hidden shadow-xl max-h-48 overflow-y-auto"
                        style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
                        {getFilteredProduits(ligne.nom).length > 0 ? (
                          getFilteredProduits(ligne.nom).map(p => (
                            <button key={p.produit_id} type="button"
                              className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:brightness-125"
                              style={{ color: '#e2e8f0', background: p.produit_id === ligne.produit_id ? '#1e2d4a' : 'transparent', borderBottom: '1px solid #1a2540' }}
                              onClick={() => selectProduit(i, p)}>
                              <span className="truncate">{p.nom}</span>
                              <span className="text-xs flex-shrink-0 ml-2" style={{ color: '#4a6fa5' }}>
                                {p.categorie ?? ''} · {p.unite}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs" style={{ color: '#4a6fa5' }}>
                            Aucun produit trouvé — saisie libre
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <input type="number" min="0" step="0.1"
                    className="col-span-2 px-2 py-1.5 rounded text-sm outline-none"
                    style={inputStyle} value={ligne.quantite_commandee}
                    onChange={e => updateLigne(i, 'quantite_commandee', parseFloat(e.target.value) || 0)} />
                  <select className="col-span-2 px-2 py-1.5 rounded text-sm outline-none"
                    style={inputStyle} value={ligne.unite}
                    onChange={e => updateLigne(i, 'unite', e.target.value)}>
                    {['kg', 'g', 'L', 'cl', 'pièce', 'boîte', 'carton', 'sachet'].map(u => <option key={u}>{u}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01"
                    className="col-span-3 px-2 py-1.5 rounded text-sm outline-none"
                    style={inputStyle} placeholder="0.00"
                    value={ligne.prix_unitaire ?? ''}
                    onChange={e => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value) || 0)} />
                  <button onClick={() => removeLigne(i)} className="col-span-1 flex justify-center"
                    style={{ color: '#f87171' }} disabled={lignes.length === 1}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          {totalHT > 0 && (
            <div className="flex justify-end">
              <div className="text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: '#0a1f3d', color: '#60a5fa' }}>
                Total HT : {totalHT.toFixed(2)} €
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>Note (optionnel)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Instructions spéciales..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0 space-y-3" style={{ borderTop: '1px solid #1e2d4a' }}>
          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#1e2d4a', color: '#94a3b8' }}>Annuler</button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Créer la commande
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
