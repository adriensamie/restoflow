'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { creerRetourSchema, majStatutRetourSchema } from '@/lib/validations/retours'
import { requireRole } from '@/lib/rbac'

export async function creerRetour(data: {
  commande_id: string
  fournisseur_id: string
  lignes: { produit_id: string; quantite_retournee: number; prix_unitaire?: number; motif?: string }[]
}) {
  const validated = creerRetourSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const numero = `RET-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900000 + 100000)}`

  const totalHt = validated.lignes.reduce((acc, l) => acc + l.quantite_retournee * (l.prix_unitaire ?? 0), 0)

  const { data: retour, error } = await (supabase as any)
    .from('retours_fournisseur')
    .insert({
      organization_id,
      commande_id: validated.commande_id,
      fournisseur_id: validated.fournisseur_id,
      numero,
      statut: 'brouillon',
      total_ht: totalHt,
    })
    .select().single()

  if (error) throw new Error(error.message)

  const lignes = validated.lignes.map(l => ({
    retour_id: retour.id,
    produit_id: l.produit_id,
    quantite_retournee: l.quantite_retournee,
    prix_unitaire: l.prix_unitaire,
    motif: l.motif,
  }))

  const { error: lignesError } = await (supabase as any)
    .from('lignes_retour').insert(lignes)
  if (lignesError) throw new Error(lignesError.message)

  // Create stock exit movements for returned items
  for (const l of validated.lignes) {
    const { error: mvtError } = await (supabase as any).from('mouvements_stock').insert({
      produit_id: l.produit_id,
      organization_id,
      type: 'sortie',
      quantite: l.quantite_retournee,
      prix_unitaire: l.prix_unitaire,
      motif: `Retour fournisseur ${numero}`,
    })
    if (mvtError) throw new Error(mvtError.message)
  }

  revalidatePath('/commandes')
  revalidatePath('/stocks')
  return retour
}

export async function getRetours() {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data, error } = await (supabase as any)
    .from('retours_fournisseur')
    .select('*, fournisseurs(nom, contact_email), lignes_retour(*, produits:produit_id(nom, unite))')
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getRetourDetail(retourId: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data, error } = await (supabase as any)
    .from('retours_fournisseur')
    .select('*, fournisseurs(nom, contact_email, adresse), lignes_retour(*, produits:produit_id(nom, unite))')
    .eq('id', retourId)
    .eq('organization_id', organization_id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function majStatutRetour(retourId: string, statut: string) {
  const validated = majStatutRetourSchema.parse({ retour_id: retourId, statut })
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await (supabase as any)
    .from('retours_fournisseur')
    .update({ statut: validated.statut })
    .eq('id', retourId)
    .eq('organization_id', organization_id)

  if (error) throw new Error(error.message)
  revalidatePath('/commandes')
}

export async function envoyerRetour(retourId: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await (supabase as any)
    .from('retours_fournisseur')
    .update({ statut: 'envoye', envoye_par_email: true })
    .eq('id', retourId)
    .eq('organization_id', organization_id)

  if (error) throw new Error(error.message)
  revalidatePath('/commandes')
}
