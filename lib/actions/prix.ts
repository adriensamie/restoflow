'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const enregistrerPrixSchema = z.object({
  produit_id: z.string().uuid(),
  fournisseur_id: z.string().uuid().optional(),
  prix: z.number().min(0).max(1000000),
  source: z.string().max(100).optional(),
})

export async function enregistrerPrix(data: {
  produit_id: string
  fournisseur_id?: string
  prix: number
  source?: string
}) {
  const validated = enregistrerPrixSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Get previous price
  const { data: produit } = await supabase
    .from('produits')
    .select('prix_unitaire')
    .eq('id', validated.produit_id)
    .eq('organization_id', organization_id)
    .single()

  const prixPrecedent = produit?.prix_unitaire ?? null
  const variationPct = prixPrecedent && prixPrecedent > 0
    ? ((validated.prix - prixPrecedent) / prixPrecedent) * 100
    : null

  const { error } = await supabase.from('prix_produit_historique').insert({
    organization_id,
    produit_id: validated.produit_id,
    fournisseur_id: validated.fournisseur_id ?? null,
    prix: validated.prix,
    prix_precedent: prixPrecedent,
    variation_pct: variationPct ? Math.round(variationPct * 100) / 100 : null,
    source: validated.source ?? 'manuel',
    date_releve: new Date().toISOString().slice(0, 10),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
}

export async function getPrixHistorique(produitId: string, limit = 30) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data, error } = await supabase
    .from('prix_produit_historique')
    .select('*, fournisseurs:fournisseur_id(nom)')
    .eq('organization_id', organization_id)
    .eq('produit_id', produitId)
    .order('date_releve', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAlertesHausse(seuilPct = 10) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('prix_produit_historique')
    .select('*, produits:produit_id(nom, unite, categorie)')
    .eq('organization_id', organization_id)
    .gte('date_releve', thirtyDaysAgo)
    .gt('variation_pct', seuilPct)
    .order('variation_pct', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}
