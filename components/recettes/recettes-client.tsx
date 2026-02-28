'use client'

import { useState } from 'react'
import { Plus, UtensilsCrossed, Sparkles, Camera, Search } from 'lucide-react'
import { RecetteModal } from './recette-modal'
import { AnalyserFicheModal } from './analyser-fiche-modal'
import { ImportPhotoRecetteModal } from './import-photo-recette-modal'
import { useRouter } from 'next/navigation'

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  entree:       { label: 'Entrée',         color: '#60a5fa', bg: '#0a1f3d' },
  plat:         { label: 'Plat',           color: '#4ade80', bg: '#0a2d1a' },
  dessert:      { label: 'Dessert',        color: '#f9a8d4', bg: '#1a0510' },
  amuse_bouche: { label: 'Amuse-bouche',   color: '#fbbf24', bg: '#1a1505' },
  sauce_fond:   { label: 'Sauce/Fond',     color: '#f97316', bg: '#1a0a00' },
  garniture:    { label: 'Garniture',      color: '#a5b4fc', bg: '#0a0a1a' },
  cocktail:     { label: 'Cocktail',       color: '#34d399', bg: '#051a10' },
  menu:         { label: 'Menu',           color: '#c4b5fd', bg: '#0f051a' },
}

interface Recette {
  id: string; nom: string; type: string; description: string | null
  prix_vente_ttc: number | null; cout_matiere: number | null
  food_cost_pct: number | null; marge_pct: number | null; coefficient: number | null
  pourcentage_ficelles: number; nb_portions: number; allergenes: string[]
  recette_ingredients: any[]
}

interface Produit { id: string; nom: string; categorie: string; unite: string; prix_unitaire: number | null }
interface Vin { id: string; nom: string; appellation: string | null; prix_achat_ht: number | null }

export function RecettesClient({ recettes, produits, vins }: {
  recettes: Recette[], produits: Produit[], vins: Vin[]
}) {
  const [showModal, setShowModal] = useState(false)
  const [showFiche, setShowFiche] = useState(false)
  const [showImportPhoto, setShowImportPhoto] = useState(false)
  const [editRecette, setEditRecette] = useState<Recette | null>(null)
  const [filtreType, setFiltreType] = useState('tous')
  const [recherche, setRecherche] = useState('')
  const [fichePreRemplie, setFichePreRemplie] = useState<any>(null)
  const router = useRouter()

  const recettesFiltrees = recettes.filter(r => {
    if (filtreType !== 'tous' && r.type !== filtreType) return false
    if (recherche && !r.nom.toLowerCase().includes(recherche.toLowerCase())) return false
    return true
  })

  const stats = {
    total: recettes.length,
    avgFoodCost: recettes.filter(r => r.food_cost_pct).length > 0
      ? Math.round(recettes.filter(r => r.food_cost_pct).reduce((a, r) => a + (r.food_cost_pct || 0), 0)
          / recettes.filter(r => r.food_cost_pct).length * 10) / 10
      : null,
    sansPrix: recettes.filter(r => !r.prix_vente_ttc).length,
    alertesFoodCost: recettes.filter(r => r.food_cost_pct && r.food_cost_pct > 35).length,
  }

  const foodCostColor = (fc: number | null) => {
    if (!fc) return '#4a6fa5'
    if (fc <= 28) return '#4ade80'
    if (fc <= 35) return '#fbbf24'
    return '#f87171'
  }

  const handleFicheResultat = (data: any) => {
    setFichePreRemplie(data)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Recettes</h1>
          <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>
            {recettes.length} recette{recettes.length > 1 ? 's' : ''} · Fiches techniques
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportPhoto(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#0a1f3d', border: '1px solid #1e3a7a', color: '#60a5fa' }}>
            <Camera size={15} />Import photo
          </button>
          <button onClick={() => setShowFiche(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white' }}>
            <Sparkles size={15} />Import IA
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <Plus size={16} />Nouvelle recette
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Recettes', value: stats.total, color: '#60a5fa' },
          { label: 'Food cost moyen', value: stats.avgFoodCost ? `${stats.avgFoodCost}%` : '—', color: foodCostColor(stats.avgFoodCost) },
          { label: 'Sans prix vente', value: stats.sansPrix, color: stats.sansPrix > 0 ? '#fbbf24' : '#4a6fa5' },
          { label: 'Food cost > 35%', value: stats.alertesFoodCost, color: stats.alertesFoodCost > 0 ? '#f87171' : '#4a6fa5' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <p className="text-xs mb-1" style={{ color: '#4a6fa5' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <Search size={14} style={{ color: '#4a6fa5' }} />
          <input value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher..." className="bg-transparent outline-none text-sm w-32"
            style={{ color: '#e2e8f0' }} />
        </div>
        <select value={filtreType} onChange={e => setFiltreType(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a', color: '#e2e8f0' }}>
          <option value="tous">Tous les types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Grille recettes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recettesFiltrees.length === 0 && (
          <div className="col-span-3 rounded-xl p-12 text-center" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-20" style={{ color: '#60a5fa' }} />
            <p className="text-sm" style={{ color: '#2d4a7a' }}>Aucune recette</p>
          </div>
        )}
        {recettesFiltrees.map(r => {
          const typeConf = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.plat
          const fc = r.food_cost_pct
          return (
            <div key={r.id} className="rounded-xl p-4 cursor-pointer hover:border-blue-500 transition-all"
              style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}
              onClick={() => setEditRecette(r)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: typeConf.bg, color: typeConf.color }}>
                      {typeConf.label}
                    </span>
                    {r.recette_ingredients?.length === 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: '#1a1505', color: '#fbbf24' }}>
                        Sans ingrédients
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{r.nom}</h3>
                  {r.description && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#4a6fa5' }}>{r.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 rounded-lg" style={{ background: '#0a1120' }}>
                  <p className="text-xs" style={{ color: '#2d4a7a' }}>Coût/portion</p>
                  <p className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                    {r.cout_matiere ? `${r.cout_matiere.toFixed(2)}€` : '—'}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: '#0a1120' }}>
                  <p className="text-xs" style={{ color: '#2d4a7a' }}>Food cost</p>
                  <p className="text-sm font-bold" style={{ color: foodCostColor(fc) }}>
                    {fc ? `${fc}%` : '—'}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: '#0a1120' }}>
                  <p className="text-xs" style={{ color: '#2d4a7a' }}>Coeff.</p>
                  <p className="text-sm font-bold" style={{ color: '#60a5fa' }}>
                    {r.coefficient ? `×${r.coefficient}` : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>
                  {r.prix_vente_ttc ? `${r.prix_vente_ttc.toFixed(2)} €` : 'Prix non défini'}
                </span>
                <div className="flex items-center gap-1">
                  {r.allergenes?.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: '#1a1505', color: '#fbbf24' }}>
                      {r.allergenes.length} allergène{r.allergenes.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: '#2d4a7a' }}>
                    {r.recette_ingredients?.length ?? 0} ingr.
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {(showModal || editRecette) && (
        <RecetteModal
          recette={editRecette ?? undefined}
          produits={produits}
          vins={vins}
          preRempli={fichePreRemplie}
          onClose={() => { setShowModal(false); setEditRecette(null); setFichePreRemplie(null) }}
        />
      )}
      {showFiche && (
        <AnalyserFicheModal
          onResultat={handleFicheResultat}
          onClose={() => setShowFiche(false)}
        />
      )}
      {showImportPhoto && (
        <ImportPhotoRecetteModal
          onClose={() => setShowImportPhoto(false)}
          onSuccess={() => { setShowImportPhoto(false); router.refresh() }}
        />
      )}
    </div>
  )
}
