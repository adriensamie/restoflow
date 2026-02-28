'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'

export async function calculerScoreFournisseur(fournisseurId: string): Promise<{
  score: number
  nbLivraisons: number
  nbEcarts: number
  nbRetours: number
  tauxConformite: number
}> {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Count total deliveries
  const { count: nbLivraisons } = await (supabase as any)
    .from('commandes')
    .select('id', { count: 'exact', head: true })
    .eq('fournisseur_id', fournisseurId)
    .eq('organization_id', organization_id)
    .in('statut', ['recue', 'recue_partielle'])

  // Count deliveries with ecarts
  const { count: nbEcarts } = await (supabase as any)
    .from('commandes')
    .select('id', { count: 'exact', head: true })
    .eq('fournisseur_id', fournisseurId)
    .eq('organization_id', organization_id)
    .eq('statut', 'recue_partielle')

  // Count returns
  const { count: nbRetours } = await (supabase as any)
    .from('retours_fournisseur')
    .select('id', { count: 'exact', head: true })
    .eq('fournisseur_id', fournisseurId)
    .eq('organization_id', organization_id)

  const total = nbLivraisons ?? 0
  const ecarts = nbEcarts ?? 0
  const retours = nbRetours ?? 0

  // Score formula: starts at 10, -1 per 10% ecart rate, -0.5 per return
  const tauxConformite = total > 0 ? ((total - ecarts) / total) * 100 : 100
  let score = 10
  score -= ((100 - tauxConformite) / 10) // -1 per 10% non-conformity
  score -= retours * 0.5
  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10))

  // Update in fournisseurs table
  const { error: updError } = await (supabase as any)
    .from('fournisseurs')
    .update({
      score_fiabilite: score,
      nb_livraisons: total,
      nb_ecarts: ecarts,
    })
    .eq('id', fournisseurId)
    .eq('organization_id', organization_id)
  if (updError) throw new Error(updError.message)

  revalidatePath('/fournisseurs')
  return {
    score,
    nbLivraisons: total,
    nbEcarts: ecarts,
    nbRetours: retours ?? 0,
    tauxConformite: Math.round(tauxConformite * 10) / 10,
  }
}

export async function getScoresFournisseurs() {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data } = await (supabase as any)
    .from('fournisseurs')
    .select('id, nom, score_fiabilite, nb_livraisons, nb_ecarts')
    .eq('organization_id', organization_id)
    .eq('actif', true)
    .order('score_fiabilite', { ascending: true, nullsFirst: false })

  return data ?? []
}
