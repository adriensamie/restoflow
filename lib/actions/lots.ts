'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const creerLotSchema = z.object({
  produit_id: z.string().uuid(),
  numero_lot: z.string().max(100).optional(),
  quantite: z.number().min(0).max(1000000),
  dlc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dluo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

const majStatutLotSchema = z.object({
  lotId: z.string().uuid(),
  statut: z.enum(['consomme', 'expire', 'jete']),
})

export async function creerLot(data: {
  produit_id: string
  numero_lot?: string
  quantite: number
  dlc?: string
  dluo?: string
}) {
  const validated = creerLotSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await supabase.from('lots_produit').insert({
    ...validated,
    organization_id,
    statut: 'actif',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
}

export async function getLots(produitId?: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  let query = supabase
    .from('lots_produit')
    .select('*, produits:produit_id(nom, unite)')
    .eq('organization_id', organization_id)
    .eq('statut', 'actif')
    .order('dlc', { ascending: true, nullsFirst: false })

  if (produitId) query = query.eq('produit_id', produitId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getLotsProchesExpiration(joursAvant = 7) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const dateLimite = new Date(Date.now() + joursAvant * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('lots_produit')
    .select('*, produits:produit_id(nom, unite)')
    .eq('organization_id', organization_id)
    .eq('statut', 'actif')
    .lte('dlc', dateLimite)
    .order('dlc', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function majStatutLot(lotId: string, statut: 'consomme' | 'expire' | 'jete') {
  majStatutLotSchema.parse({ lotId, statut })
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await supabase
    .from('lots_produit')
    .update({ statut })
    .eq('id', lotId)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/stocks')
}
