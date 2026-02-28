'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { creerSessionSchema, ligneInventaireSessionSchema } from '@/lib/validations/inventaire'

export async function creerSessionInventaire(data: {
  nom: string
  zone: string
  note?: string
}) {
  const validated = creerSessionSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await (supabase as any)
    .from('sessions_inventaire')
    .insert({ ...validated, organization_id }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/inventaire')
  return result
}

export async function sauvegarderLigneInventaire(data: {
  session_id: string
  produit_id?: string
  vin_id?: string
  stock_theorique: number
  quantite_comptee: number
  unite?: string
  note?: string
}) {
  const validated = ligneInventaireSessionSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  if (validated.produit_id) {
    const { error } = await (supabase as any)
      .from('lignes_inventaire')
      .upsert(
        { ...validated, organization_id, counted_at: new Date().toISOString() },
        { onConflict: 'session_id,produit_id' }
      )
    if (error) throw new Error(error.message)
  } else if (validated.vin_id) {
    const { error } = await (supabase as any)
      .from('lignes_inventaire')
      .upsert(
        { ...validated, organization_id, counted_at: new Date().toISOString() },
        { onConflict: 'session_id,vin_id' }
      )
    if (error) throw new Error(error.message)
  }
  revalidatePath('/inventaire')
  return true
}

export async function validerInventaire(sessionId: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data: lignes, error: lignesError } = await (supabase as any)
    .from('lignes_inventaire')
    .select('*')
    .eq('session_id', sessionId)
    .eq('organization_id', organization_id)
    .not('quantite_comptee', 'is', null)
  if (lignesError) throw new Error(lignesError.message)

  if (!lignes?.length) throw new Error('Aucune ligne saisie')

  for (const ligne of lignes) {
    if (ligne.produit_id && ligne.quantite_comptee !== null) {
      const { error: mvtError } = await (supabase as any).from('mouvements_stock').insert({
        produit_id: ligne.produit_id,
        organization_id,
        type: 'inventaire',
        quantite: ligne.quantite_comptee,
        note: `Inventaire ${sessionId}`,
      })
      if (mvtError) throw new Error(mvtError.message)
    }
    if (ligne.vin_id && ligne.quantite_comptee !== null) {
      const { error: vinError } = await (supabase as any).from('vins')
        .update({ stock_bouteilles: Math.round(ligne.quantite_comptee) })
        .eq('id', ligne.vin_id).eq('organization_id', organization_id)
      if (vinError) throw new Error(vinError.message)
    }
  }

  const { error: sessError } = await (supabase as any).from('sessions_inventaire')
    .update({ statut: 'valide', validated_at: new Date().toISOString() })
    .eq('id', sessionId).eq('organization_id', organization_id)
  if (sessError) throw new Error(sessError.message)

  revalidatePath('/inventaire')
  revalidatePath('/stocks')
  revalidatePath('/cave')
  return true
}

export async function annulerInventaire(sessionId: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await (supabase as any).from('sessions_inventaire')
    .update({ statut: 'annule' }).eq('id', sessionId).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/inventaire')
}
