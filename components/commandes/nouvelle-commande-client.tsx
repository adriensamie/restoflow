'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, Search, Plus, Minus, ShoppingCart,
  X, Package, Save, ChevronDown,
} from 'lucide-react'
import { creerCommande, modifierCommande, modifierFournisseur } from '@/lib/actions/commandes'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Produit {
  produit_id: string
  nom: string
  categorie: string | null
  unite: string
  quantite_actuelle: number | null
  prix_unitaire: number | null
  prix_negocie?: number | null
}

interface Fournisseur {
  id: string
  nom: string
  contact_nom?: string | null
  contact_email?: string | null
  contact_telephone?: string | null
  adresse?: string | null
  delai_livraison?: number | null
  conditions_paiement?: string | null
  score_fiabilite?: number | null
  nb_livraisons?: number
  nb_ecarts?: number
}

interface PanierItem {
  nom: string
  unite: string
  quantite: number
  prix_unitaire: number
}

interface CommandeExistante {
  id: string
  numero: string
  fournisseur_id: string
  date_livraison_prevue: string | null
  note: string | null
  lignes: { produit_id: string; produit_nom: string; unite: string; quantite_commandee: number; prix_unitaire: number | null }[]
}

interface Props {
  fournisseurs: Fournisseur[]
  blPreRempli?: {
    fournisseur: { nom: string }
    lignes: { nom_normalise: string; quantite: number; unite: string; prix_unitaire_ht: number | null }[]
    date: string | null
  } | null
  commandeExistante?: CommandeExistante | null
}

const inputStyle = { background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }

const CATEGORIE_LABELS: Record<string, string> = {
  frais: 'Frais',
  viandes: 'Viandes',
  poissons: 'Poissons',
  legumes: 'Légumes',
  fruits: 'Fruits',
  epicerie: 'Épicerie',
  boissons: 'Boissons',
  surgeles: 'Surgelés',
  produits_laitiers: 'Produits laitiers',
  boulangerie: 'Boulangerie',
  condiments: 'Condiments',
  autres: 'Autres',
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function NouvelleCommandeClient({ fournisseurs, blPreRempli, commandeExistante }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const isEditMode = !!commandeExistante

  // ─── State ──────────────────────────────────────────────────────────────────
  const [fournisseurId, setFournisseurId] = useState(commandeExistante?.fournisseur_id ?? '')
  const [dateLivraison, setDateLivraison] = useState(commandeExistante?.date_livraison_prevue ?? '')
  const [note, setNote] = useState(commandeExistante?.note ?? '')
  const [activeTab, setActiveTab] = useState('tous')
  const [searchQuery, setSearchQuery] = useState('')
  const [produits, setProduits] = useState<Produit[]>([])
  const [loadingProduits, setLoadingProduits] = useState(false)
  const [panier, setPanier] = useState<Map<string, PanierItem>>(new Map())
  const [showPanierMobile, setShowPanierMobile] = useState(false)

  // Fournisseur edit state
  const [fournisseurEdit, setFournisseurEdit] = useState<Partial<Fournisseur>>({})
  const [savingFournisseur, setSavingFournisseur] = useState(false)
  const [fournisseurSaved, setFournisseurSaved] = useState(false)

  // ─── BL pre-fill ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!blPreRempli) return
    // Auto-select fournisseur by name
    const match = fournisseurs.find(
      f => f.nom.toLowerCase() === blPreRempli.fournisseur.nom.toLowerCase()
    )
    if (match) setFournisseurId(match.id)
    if (blPreRempli.date) setDateLivraison(blPreRempli.date)
  }, [blPreRempli, fournisseurs])

  // Pre-fill panier from BL after produits are loaded
  useEffect(() => {
    if (!blPreRempli || produits.length === 0) return
    const newPanier = new Map<string, PanierItem>()
    for (const ligne of blPreRempli.lignes) {
      const match = produits.find(
        p => p.nom.toLowerCase() === ligne.nom_normalise.toLowerCase()
      )
      if (match) {
        newPanier.set(match.produit_id, {
          nom: match.nom,
          unite: match.unite,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire_ht ?? match.prix_negocie ?? match.prix_unitaire ?? 0,
        })
      }
    }
    if (newPanier.size > 0) setPanier(newPanier)
  }, [blPreRempli, produits])

  // Pre-fill panier from existing commande (edit mode)
  useEffect(() => {
    if (!commandeExistante || produits.length === 0) return
    const newPanier = new Map<string, PanierItem>()
    for (const ligne of commandeExistante.lignes) {
      newPanier.set(ligne.produit_id, {
        nom: ligne.produit_nom,
        unite: ligne.unite,
        quantite: ligne.quantite_commandee,
        prix_unitaire: ligne.prix_unitaire ?? 0,
      })
    }
    if (newPanier.size > 0) setPanier(newPanier)
  }, [commandeExistante, produits])

  // ─── Fetch produits on fournisseur change ───────────────────────────────────
  useEffect(() => {
    if (!fournisseurId) { setProduits([]); return }
    setLoadingProduits(true)
    fetch(`/api/stocks/produits?fournisseur_id=${fournisseurId}`)
      .then(res => res.json())
      .then((data: Produit[]) => setProduits(data))
      .catch(() => setProduits([]))
      .finally(() => setLoadingProduits(false))
  }, [fournisseurId])

  // Sync fournisseur edit form when fournisseur changes
  useEffect(() => {
    const f = fournisseurs.find(f => f.id === fournisseurId)
    if (f) setFournisseurEdit({ ...f })
    setFournisseurSaved(false)
  }, [fournisseurId, fournisseurs])

  // ─── Derived ────────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set<string>()
    produits.forEach(p => cats.add(p.categorie || 'autres'))
    return [...cats].sort()
  }, [produits])

  const produitsFiltres = useMemo(() => {
    let list = produits
    if (activeTab !== 'tous' && activeTab !== 'fournisseur') {
      list = list.filter(p => (p.categorie || 'autres') === activeTab)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => p.nom.toLowerCase().includes(q))
    }
    return list
  }, [produits, activeTab, searchQuery])

  const totalHT = useMemo(() => {
    let total = 0
    panier.forEach(item => { total += item.quantite * item.prix_unitaire })
    return total
  }, [panier])

  const panierCount = panier.size

  // ─── Panier actions ─────────────────────────────────────────────────────────
  const getQuantite = (produitId: string) => panier.get(produitId)?.quantite ?? 0

  const setQuantite = (produit: Produit, qty: number) => {
    setPanier(prev => {
      const next = new Map(prev)
      if (qty <= 0) {
        next.delete(produit.produit_id)
      } else {
        next.set(produit.produit_id, {
          nom: produit.nom,
          unite: produit.unite,
          quantite: qty,
          prix_unitaire: prev.get(produit.produit_id)?.prix_unitaire
            ?? produit.prix_negocie ?? produit.prix_unitaire ?? 0,
        })
      }
      return next
    })
  }

  const removeFromPanier = (produitId: string) => {
    setPanier(prev => {
      const next = new Map(prev)
      next.delete(produitId)
      return next
    })
  }

  // ─── Fournisseur save ───────────────────────────────────────────────────────
  const handleSaveFournisseur = async () => {
    if (!fournisseurId) return
    setSavingFournisseur(true)
    setFournisseurSaved(false)
    try {
      await modifierFournisseur(fournisseurId, {
        nom: fournisseurEdit.nom,
        contact_nom: fournisseurEdit.contact_nom ?? undefined,
        contact_email: fournisseurEdit.contact_email ?? undefined,
        contact_telephone: fournisseurEdit.contact_telephone ?? undefined,
        adresse: fournisseurEdit.adresse ?? undefined,
        delai_livraison: fournisseurEdit.delai_livraison ?? undefined,
        conditions_paiement: fournisseurEdit.conditions_paiement ?? undefined,
      })
      setFournisseurSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur sauvegarde fournisseur')
    } finally {
      setSavingFournisseur(false)
    }
  }

  // ─── Submit commande ────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!fournisseurId) { setError('Selectionnez un fournisseur'); return }
    if (panier.size === 0) { setError('Ajoutez au moins un produit au panier'); return }
    setError('')

    startTransition(async () => {
      try {
        const lignes: { produit_id: string; quantite_commandee: number; prix_unitaire?: number }[] = []
        panier.forEach((item, produitId) => {
          lignes.push({
            produit_id: produitId,
            quantite_commandee: item.quantite,
            prix_unitaire: item.prix_unitaire || undefined,
          })
        })

        if (isEditMode) {
          await modifierCommande({
            commande_id: commandeExistante!.id,
            fournisseur_id: fournisseurId,
            date_livraison_prevue: dateLivraison || undefined,
            note: note || undefined,
            lignes,
          })
        } else {
          await creerCommande({
            fournisseur_id: fournisseurId,
            date_livraison_prevue: dateLivraison || undefined,
            note: note || undefined,
            lignes,
          })
        }
        router.push('/commandes')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: '#080e1a' }}>
      {/* ─── Top Bar ───────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3 flex-wrap"
        style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a' }}>
        <button onClick={() => router.push('/commandes')}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg hover:brightness-125 transition-all"
          style={{ color: '#94a3b8', background: '#1e2d4a' }}>
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <div className="relative">
            <select value={fournisseurId} onChange={e => setFournisseurId(e.target.value)}
              className="pl-3 pr-8 py-1.5 rounded-lg text-sm outline-none appearance-none min-w-[180px]"
              style={inputStyle}>
              <option value="">Fournisseur...</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4a6fa5' }} />
          </div>

          <input type="date" value={dateLivraison} onChange={e => setDateLivraison(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={inputStyle} />

          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="Note..."
            className="px-3 py-1.5 rounded-lg text-sm outline-none flex-1 min-w-[120px]"
            style={inputStyle} />
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-2 flex gap-2 overflow-x-auto"
        style={{ background: '#0a1120', borderBottom: '1px solid #1e2d4a' }}>
        <TabButton active={activeTab === 'tous'} onClick={() => setActiveTab('tous')}>
          Tous
        </TabButton>
        {categories.map(cat => (
          <TabButton key={cat} active={activeTab === cat} onClick={() => setActiveTab(cat)}>
            {CATEGORIE_LABELS[cat] || cat}
          </TabButton>
        ))}
        {fournisseurId && (
          <TabButton active={activeTab === 'fournisseur'} onClick={() => setActiveTab('fournisseur')}>
            Fournisseur
          </TabButton>
        )}
      </div>

      {/* ─── Main content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products or Fournisseur tab */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'fournisseur' ? (
            <FournisseurEditTab
              fournisseur={fournisseurEdit}
              onChange={setFournisseurEdit}
              onSave={handleSaveFournisseur}
              saving={savingFournisseur}
              saved={fournisseurSaved}
            />
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6fa5' }} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle} />
              </div>

              {/* Product grid */}
              {!fournisseurId ? (
                <EmptyState icon={<Package size={40} />} text="Sélectionnez un fournisseur pour voir ses produits" />
              ) : loadingProduits ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={24} className="animate-spin" style={{ color: '#60a5fa' }} />
                </div>
              ) : produitsFiltres.length === 0 ? (
                <EmptyState icon={<Package size={40} />}
                  text={searchQuery ? 'Aucun produit trouvé' : 'Aucun produit dans cette catégorie'} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {produitsFiltres.map(p => {
                    const qty = getQuantite(p.produit_id)
                    const inPanier = qty > 0
                    const prixAffiche = p.prix_negocie ?? p.prix_unitaire
                    return (
                      <div key={p.produit_id}
                        className="rounded-xl p-3 transition-all"
                        style={{
                          background: inPanier ? '#0a1f3d' : '#0d1526',
                          border: `1.5px solid ${inPanier ? '#1d4ed8' : '#1e2d4a'}`,
                        }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#e2e8f0' }}>{p.nom}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>
                              {p.unite} · Stock: {p.quantite_actuelle ?? 0}
                            </p>
                          </div>
                          {prixAffiche != null && prixAffiche > 0 && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                              style={{ background: '#0a1628', color: '#60a5fa' }}>
                              {prixAffiche.toFixed(2)} €/{p.unite}
                            </span>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => setQuantite(p, qty - 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{
                              background: qty > 0 ? '#1e2d4a' : '#0a1120',
                              color: qty > 0 ? '#e2e8f0' : '#2d4a7a',
                            }}
                            disabled={qty <= 0}>
                            <Minus size={14} />
                          </button>
                          <input type="number" min="0" step="0.5"
                            value={qty || ''}
                            placeholder="0"
                            onChange={e => {
                              const val = parseFloat(e.target.value)
                              setQuantite(p, isNaN(val) ? 0 : val)
                            }}
                            className="flex-1 text-center py-1.5 rounded-lg text-sm font-semibold outline-none"
                            style={{
                              ...inputStyle,
                              color: qty > 0 ? '#e2e8f0' : '#4a6fa5',
                            }} />
                          <button onClick={() => setQuantite(p, qty + 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: '#1d4ed8', color: '#fff' }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Cart sidebar (desktop) */}
        <div className="hidden lg:flex flex-col w-80 flex-shrink-0 overflow-hidden"
          style={{ background: '#0d1526', borderLeft: '1px solid #1e2d4a' }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid #1e2d4a' }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#e2e8f0' }}>
              <ShoppingCart size={16} /> Panier
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#0a1f3d', color: '#60a5fa' }}>
              {panierCount} produit{panierCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {panierCount === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: '#2d4a7a' }}>Panier vide</p>
            ) : (
              <div className="divide-y" style={{ borderColor: '#1e2d4a' }}>
                {[...panier.entries()].map(([id, item]) => (
                  <div key={id} className="px-4 py-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: '#e2e8f0' }}>{item.nom}</p>
                      <p className="text-xs" style={{ color: '#4a6fa5' }}>
                        {item.quantite} {item.unite} × {item.prix_unitaire.toFixed(2)} €
                      </p>
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0" style={{ color: '#60a5fa' }}>
                      {(item.quantite * item.prix_unitaire).toFixed(2)} €
                    </p>
                    <button onClick={() => removeFromPanier(id)}
                      className="flex-shrink-0 p-1 rounded hover:brightness-125"
                      style={{ color: '#f87171' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 space-y-3 flex-shrink-0" style={{ borderTop: '1px solid #1e2d4a' }}>
            {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>Total HT</span>
              <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
                {totalHT.toFixed(2)} €
              </span>
            </div>
            <button onClick={handleSubmit} disabled={isPending || panierCount === 0}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isEditMode ? 'Modifier la commande' : 'Creer la commande'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Mobile bottom bar ─────────────────────────────────────────────────── */}
      <div className="lg:hidden flex-shrink-0 px-4 py-3 flex items-center gap-3"
        style={{ background: '#0d1526', borderTop: '1px solid #1e2d4a' }}>
        <button onClick={() => setShowPanierMobile(true)}
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: '#1e2d4a', color: '#e2e8f0' }}>
          <ShoppingCart size={16} />
          {panierCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
              style={{ background: '#1d4ed8' }}>
              {panierCount}
            </span>
          )}
          {totalHT > 0 ? `${totalHT.toFixed(2)} €` : 'Panier'}
        </button>
        <button onClick={handleSubmit} disabled={isPending || panierCount === 0}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEditMode ? 'Modifier la commande' : 'Creer la commande'}
        </button>
      </div>

      {/* ─── Mobile panier drawer ──────────────────────────────────────────────── */}
      {showPanierMobile && (
        <div className="lg:hidden fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl max-h-[70vh] flex flex-col"
            style={{ background: '#0d1526' }}>
            <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid #1e2d4a' }}>
              <h3 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                Panier ({panierCount})
              </h3>
              <button onClick={() => setShowPanierMobile(false)} style={{ color: '#4a6fa5' }}>
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {panierCount === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: '#2d4a7a' }}>Panier vide</p>
              ) : (
                <div className="divide-y" style={{ borderColor: '#1e2d4a' }}>
                  {[...panier.entries()].map(([id, item]) => (
                    <div key={id} className="px-4 py-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: '#e2e8f0' }}>{item.nom}</p>
                        <p className="text-xs" style={{ color: '#4a6fa5' }}>
                          {item.quantite} {item.unite} × {item.prix_unitaire.toFixed(2)} €
                        </p>
                      </div>
                      <p className="text-sm font-semibold flex-shrink-0" style={{ color: '#60a5fa' }}>
                        {(item.quantite * item.prix_unitaire).toFixed(2)} €
                      </p>
                      <button onClick={() => removeFromPanier(id)}
                        className="flex-shrink-0 p-1 rounded" style={{ color: '#f87171' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid #1e2d4a' }}>
              {error && <p className="text-xs mb-2" style={{ color: '#f87171' }}>{error}</p>}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: '#94a3b8' }}>Total HT</span>
                <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{totalHT.toFixed(2)} €</span>
              </div>
              <button onClick={() => { setShowPanierMobile(false); handleSubmit() }}
                disabled={isPending || panierCount === 0}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {isEditMode ? 'Modifier la commande' : 'Creer la commande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
      style={{
        background: active ? '#0a1f3d' : 'transparent',
        color: active ? '#60a5fa' : '#4a6fa5',
        border: `1px solid ${active ? '#1e3a7a' : 'transparent'}`,
      }}>
      {children}
    </button>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-30">
      <div style={{ color: '#60a5fa' }}>{icon}</div>
      <p className="text-sm mt-3" style={{ color: '#4a6fa5' }}>{text}</p>
    </div>
  )
}

function FournisseurEditTab({ fournisseur, onChange, onSave, saving, saved }: {
  fournisseur: Partial<Fournisseur>
  onChange: (f: Partial<Fournisseur>) => void
  onSave: () => void
  saving: boolean
  saved: boolean
}) {
  const update = (key: keyof Fournisseur, value: string | number | null) =>
    onChange({ ...fournisseur, [key]: value })

  const fields: { key: keyof Fournisseur; label: string; type?: string; placeholder?: string }[] = [
    { key: 'nom', label: 'Nom du fournisseur', placeholder: 'Ex: Metro' },
    { key: 'contact_nom', label: 'Nom du contact', placeholder: 'Ex: Jean Dupont' },
    { key: 'contact_telephone', label: 'Téléphone', type: 'tel', placeholder: '06 ...' },
    { key: 'contact_email', label: 'Email', type: 'email', placeholder: 'contact@...' },
    { key: 'adresse', label: 'Adresse', placeholder: '12 rue ...' },
    { key: 'delai_livraison', label: 'Délai de livraison (jours)', type: 'number', placeholder: '2' },
    { key: 'conditions_paiement', label: 'Conditions de paiement', placeholder: '30 jours fin de mois' },
  ]

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h3 className="text-lg font-bold mb-4" style={{ color: '#e2e8f0' }}>
        Informations fournisseur
      </h3>

      {fournisseur.score_fiabilite != null && (
        <div className="flex gap-4 mb-4">
          <div className="rounded-xl px-4 py-2" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <p className="text-xs" style={{ color: '#4a6fa5' }}>Score fiabilité</p>
            <p className="text-lg font-bold" style={{ color: '#4ade80' }}>
              {fournisseur.score_fiabilite?.toFixed(0)}%
            </p>
          </div>
          <div className="rounded-xl px-4 py-2" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <p className="text-xs" style={{ color: '#4a6fa5' }}>Livraisons</p>
            <p className="text-lg font-bold" style={{ color: '#60a5fa' }}>
              {fournisseur.nb_livraisons ?? 0}
            </p>
          </div>
          <div className="rounded-xl px-4 py-2" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <p className="text-xs" style={{ color: '#4a6fa5' }}>Écarts</p>
            <p className="text-lg font-bold" style={{ color: '#fbbf24' }}>
              {fournisseur.nb_ecarts ?? 0}
            </p>
          </div>
        </div>
      )}

      {fields.map(f => (
        <div key={f.key} className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: '#4a6fa5' }}>{f.label}</label>
          <input
            type={f.type || 'text'}
            value={(fournisseur[f.key] as string | number) ?? ''}
            onChange={e => {
              const val = f.type === 'number' ? (parseFloat(e.target.value) || null) : e.target.value
              update(f.key, val)
            }}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer
        </button>
        {saved && (
          <span className="text-xs font-medium" style={{ color: '#4ade80' }}>
            Sauvegardé
          </span>
        )}
      </div>
    </div>
  )
}
