'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { creerVinSchema, modifierVinSchema, mouvementCaveSchema } from '@/lib/validations/cave'
import { requireAccess } from '@/lib/billing'
import { requireRole } from '@/lib/rbac'

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
  await requireAccess('cave')
  await requireRole(['patron', 'manager'])
  const validated = creerVinSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('vins').insert({ ...validated, organization_id }).select().single()
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
  const validated = modifierVinSchema.parse(data)
  await requireAccess('cave')
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('vins').update(validated).eq('id', id).eq('organization_id', organization_id)
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
  await requireAccess('cave')
  await requireRole(['patron', 'manager'])
  const validated = mouvementCaveSchema.parse(data)
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('mouvements_cave').insert({ ...validated, organization_id })
  if (error) throw new Error(error.message)

  const { data: vin, error: vinError } = await (supabase as any)
    .from('vins').select('stock_bouteilles').eq('id', validated.vin_id).eq('organization_id', organization_id).single()
  if (vinError) throw new Error(vinError.message)

  if (vin) {
    let delta = 0
    if (validated.type === 'entree') delta = validated.quantite
    if (validated.type === 'sortie_bouteille' || validated.type === 'sortie_verre' || validated.type === 'casse') delta = -validated.quantite
    if (validated.type === 'inventaire') {
      const { error: updErr } = await (supabase as any).from('vins')
        .update({ stock_bouteilles: validated.quantite }).eq('id', validated.vin_id).eq('organization_id', organization_id)
      if (updErr) throw new Error(updErr.message)
      revalidatePath('/cave')
      return
    }
    // TODO: remplacer par un UPDATE atomique côté DB (stock_bouteilles = stock_bouteilles + delta)
    const { error: updErr } = await (supabase as any).from('vins')
      .update({ stock_bouteilles: Math.max(0, (vin.stock_bouteilles || 0) + delta) })
      .eq('id', validated.vin_id).eq('organization_id', organization_id)
    if (updErr) throw new Error(updErr.message)
  }
  revalidatePath('/cave')
}

export async function archiverVin(id: string) {
  await requireAccess('cave')
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any)
    .from('vins').update({ actif: false }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/cave')
}
