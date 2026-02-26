'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { creerVinSchema, mouvementCaveSchema } from '@/lib/validations/cave'

export async function creerVin(data: {
  nom: string
  appellation?: string
  categorie: string
  zone: string
  fournisseur_id?: string
  prix_achat_ht?: number
  prix_vente_ttc?: number
  vendu_au_verre?: boolean
  prix_verre_ttc?: number
  contenance_verre?: number
  stock_bouteilles?: number
  seuil_alerte?: number
}) {
  creerVinSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('vins').insert({ ...data, organization_id }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/cave')
  return result
}

export async function modifierVin(id: string, data: {
  nom?: string
  appellation?: string | null
  categorie?: string
  zone?: string
  fournisseur_id?: string | null
  prix_achat_ht?: number | null
  prix_vente_ttc?: number | null
  vendu_au_verre?: boolean
  prix_verre_ttc?: number | null
  contenance_verre?: number | null
  seuil_alerte?: number
}) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('vins').update(data).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/cave')
}

export async function ajouterMouvementCave(data: {
  vin_id: string
  type: string
  quantite: number
  prix_unitaire?: number
  note?: string
}) {
  mouvementCaveSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('mouvements_cave').insert({ ...data, organization_id })
  if (error) throw new Error(error.message)

  const { data: vin, error: vinError } = await (supabase as any)
    .from('vins').select('stock_bouteilles').eq('id', data.vin_id).eq('organization_id', organization_id).single()
  if (vinError) throw new Error(vinError.message)

  if (vin) {
    let delta = 0
    if (data.type === 'entree') delta = data.quantite
    if (data.type === 'sortie_bouteille' || data.type === 'casse') delta = -data.quantite
    if (data.type === 'inventaire') {
      const { error: updErr } = await (supabase as any).from('vins')
        .update({ stock_bouteilles: data.quantite }).eq('id', data.vin_id).eq('organization_id', organization_id)
      if (updErr) throw new Error(updErr.message)
      revalidatePath('/cave')
      return
    }
    // TODO: remplacer par un UPDATE atomique côté DB (stock_bouteilles = stock_bouteilles + delta)
    const { error: updErr } = await (supabase as any).from('vins')
      .update({ stock_bouteilles: Math.max(0, (vin.stock_bouteilles || 0) + delta) })
      .eq('id', data.vin_id).eq('organization_id', organization_id)
    if (updErr) throw new Error(updErr.message)
  }
  revalidatePath('/cave')
}

export async function archiverVin(id: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('vins').update({ actif: false }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/cave')
}
