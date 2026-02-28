'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'

export interface SuggestionReappro {
  produit_id: string
  produit_nom: string
  unite: string
  stock_actuel: number
  seuil_alerte: number
  quantite_suggere: number
  fournisseur_id: string | null
  fournisseur_nom: string | null
  prix_negocie: number | null
}

export async function getSuggestionsReappro(): Promise<SuggestionReappro[]> {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Get products below alert threshold
  const { data: stocks } = await supabase
    .from('stock_actuel')
    .select('produit_id, nom, unite, quantite_actuelle, seuil_alerte')
    .eq('organization_id', organization_id)
    .eq('en_alerte', true)

  if (!stocks || stocks.length === 0) return []

  const suggestions: SuggestionReappro[] = []

  for (const stock of stocks) {
    // Find main supplier
    const { data: pf } = await supabase
      .from('produit_fournisseur')
      .select('fournisseur_id, prix_negocie, qte_min, fournisseurs:fournisseur_id(nom)')
      .eq('produit_id', stock.produit_id)
      .eq('organization_id', organization_id)
      .eq('fournisseur_principal', true)
      .single()

    // Suggest enough to reach 2x threshold
    const quantiteSuggere = Math.max(
      (pf?.qte_min ?? 1),
      (stock.seuil_alerte * 2) - stock.quantite_actuelle
    )

    suggestions.push({
      produit_id: stock.produit_id,
      produit_nom: stock.nom,
      unite: stock.unite,
      stock_actuel: stock.quantite_actuelle,
      seuil_alerte: stock.seuil_alerte,
      quantite_suggere: Math.ceil(quantiteSuggere),
      fournisseur_id: pf?.fournisseur_id ?? null,
      fournisseur_nom: pf?.fournisseurs?.nom ?? null,
      prix_negocie: pf?.prix_negocie ?? null,
    })
  }

  return suggestions
}
