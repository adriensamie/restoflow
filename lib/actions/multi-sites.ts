'use server'

import { getOrgUUID } from '@/lib/auth'
import { requireAccess } from '@/lib/billing'
import { requireRole } from '@/lib/rbac'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getChildOrganizations() {
  await requireAccess('multi_sites')
  await requireRole(['patron'])
  const orgId = await getOrgUUID()
  const supabase = await createServerSupabaseClient() as any

  const { data, error } = await supabase
    .from('organizations')
    .select('id, nom, slug, plan')
    .eq('parent_organization_id', orgId)

  if (error) throw new Error(error.message)
  return data || []
}

export async function linkChildOrganization(childClerkOrgId: string) {
  await requireAccess('multi_sites')
  await requireRole(['patron'])
  const parentOrgId = await getOrgUUID()
  const supabase = await createServerSupabaseClient() as any

  const { data: child, error: findError } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', childClerkOrgId)
    .single()

  if (findError || !child) throw new Error('Organisation enfant introuvable')

  const { error } = await supabase
    .from('organizations')
    .update({ parent_organization_id: parentOrgId })
    .eq('id', child.id)

  if (error) throw new Error(error.message)
}

interface SiteKPI {
  site_id: string
  site_nom: string
  ca_total: number
  food_cost_pct: number
  nb_couverts: number
  nb_employes: number
}

export async function getConsolidatedKPIs(mois: string): Promise<{
  sites: SiteKPI[]
  totals: { ca_total: number; food_cost_pct: number; nb_couverts: number; nb_employes: number }
}> {
  await requireAccess('multi_sites')
  await requireRole(['patron'])
  const orgId = await getOrgUUID()
  const supabase = await createServerSupabaseClient() as any

  // Get child orgs
  const { data: children } = await supabase
    .from('organizations')
    .select('id, nom')
    .eq('parent_organization_id', orgId)

  const allOrgs = children || []

  // Also include parent org
  const { data: parentOrg } = await supabase
    .from('organizations')
    .select('id, nom')
    .eq('id', orgId)
    .single()

  if (parentOrg) allOrgs.unshift(parentOrg)

  const sites: SiteKPI[] = []
  const debut = `${mois}-01`
  const [y, m] = mois.split('-').map(Number)
  const fin = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`

  for (const org of allOrgs) {
    // CA from previsions (ca_reel)
    const { data: prevs } = await supabase
      .from('previsions')
      .select('ca_reel, couverts_reel_midi, couverts_reel_soir')
      .eq('organization_id', org.id)
      .gte('date_prevision', debut)
      .lte('date_prevision', fin)

    const ca_total = (prevs || []).reduce((s: number, p: any) => s + (p.ca_reel || 0), 0)
    const nb_couverts = (prevs || []).reduce((s: number, p: any) =>
      s + (p.couverts_reel_midi || 0) + (p.couverts_reel_soir || 0), 0)

    // Food cost from recettes (approximate via marges)
    const { data: recettes } = await supabase
      .from('recettes')
      .select('cout_matiere, prix_vente_ttc')
      .eq('organization_id', org.id)

    let coutTotal = 0, pvTotal = 0
    for (const r of recettes || []) {
      coutTotal += r.cout_matiere || 0
      pvTotal += r.prix_vente_ttc || 0
    }
    const food_cost_pct = pvTotal > 0 ? Math.round((coutTotal / pvTotal) * 1000) / 10 : 0

    // Employee count
    const { count: nb_employes } = await supabase
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('actif', true)

    sites.push({
      site_id: org.id,
      site_nom: org.nom,
      ca_total: Math.round(ca_total),
      food_cost_pct,
      nb_couverts,
      nb_employes: nb_employes || 0,
    })
  }

  const totals = {
    ca_total: sites.reduce((s, si) => s + si.ca_total, 0),
    food_cost_pct: sites.length > 0
      ? Math.round(sites.reduce((s, si) => s + si.food_cost_pct, 0) / sites.length * 10) / 10
      : 0,
    nb_couverts: sites.reduce((s, si) => s + si.nb_couverts, 0),
    nb_employes: sites.reduce((s, si) => s + si.nb_employes, 0),
  }

  return { sites, totals }
}

export async function getComparaisonSites(mois: string) {
  const data = await getConsolidatedKPIs(mois)
  return data.sites.map(site => ({
    ...site,
    ca_par_couvert: site.nb_couverts > 0 ? Math.round(site.ca_total / site.nb_couverts * 100) / 100 : 0,
  }))
}
