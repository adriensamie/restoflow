'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { bilanDateSchema } from '@/lib/validations/bilan'

export interface BilanJournee {
  date: string
  ca_total: number
  nb_couverts: number
  nb_tickets: number
  ticket_moyen: number
  food_cost_montant: number
  food_cost_pct: number
  pertes_montant: number
  nb_releves_haccp: number
  nb_non_conformes: number
  heures_equipe: number
  cout_equipe: number
}

export async function getBilanJournee(date: string): Promise<BilanJournee> {
  bilanDateSchema.parse(date)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Compute next day for proper date range
  const nextDay = new Date(date + 'T00:00:00')
  nextDay.setDate(nextDay.getDate() + 1)
  const nextDayStr = nextDay.toISOString().slice(0, 10)

  // CA & couverts from events_caisse
  const { data: events } = await (supabase as any)
    .from('events_caisse')
    .select('event_type, montant, nb_couverts')
    .eq('organization_id', organization_id)
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${nextDayStr}T00:00:00`)

  const paiements = (events ?? []).filter((e: any) => e.event_type === 'paiement')
  const ca_total = paiements.reduce((a: number, e: any) => a + (e.montant || 0), 0)
  const nb_tickets = paiements.length
  const nb_couverts = paiements.reduce((a: number, e: any) => a + (e.nb_couverts || 0), 0)
  const ticket_moyen = nb_tickets > 0 ? ca_total / nb_tickets : 0

  // Pertes du jour
  const { data: pertes } = await (supabase as any)
    .from('mouvements_stock')
    .select('quantite, prix_unitaire')
    .eq('organization_id', organization_id)
    .eq('type', 'perte')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${nextDayStr}T00:00:00`)

  const pertes_montant = (pertes ?? []).reduce((a: number, p: any) => a + (p.quantite * (p.prix_unitaire || 0)), 0)

  // Entrees stock (cout matieres)
  const { data: entrees } = await (supabase as any)
    .from('mouvements_stock')
    .select('quantite, prix_unitaire')
    .eq('organization_id', organization_id)
    .eq('type', 'entree')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${nextDayStr}T00:00:00`)

  const food_cost_montant = (entrees ?? []).reduce((a: number, e: any) => a + (e.quantite * (e.prix_unitaire || 0)), 0)
  const food_cost_pct = ca_total > 0 ? (food_cost_montant / ca_total) * 100 : 0

  // HACCP
  const { data: releves } = await (supabase as any)
    .from('haccp_releves')
    .select('resultat')
    .eq('organization_id', organization_id)
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${nextDayStr}T00:00:00`)

  const nb_releves_haccp = (releves ?? []).length
  const nb_non_conformes = (releves ?? []).filter((r: any) => r.resultat === 'non_conforme').length

  // Equipe hours (planning)
  const { data: creneaux } = await (supabase as any)
    .from('creneaux_planning')
    .select('heure_debut, heure_fin, cout_prevu')
    .eq('organization_id', organization_id)
    .eq('date', date)

  let heures_equipe = 0
  let cout_equipe = 0
  for (const c of (creneaux ?? [])) {
    const [dh, dm] = (c.heure_debut || '0:0').split(':').map(Number)
    const [fh, fm] = (c.heure_fin || '0:0').split(':').map(Number)
    let mins = fh * 60 + fm - (dh * 60 + dm)
    if (mins < 0) mins += 24 * 60
    heures_equipe += mins / 60
    cout_equipe += c.cout_prevu ?? 0
  }

  return {
    date,
    ca_total: Math.round(ca_total * 100) / 100,
    nb_couverts,
    nb_tickets,
    ticket_moyen: Math.round(ticket_moyen * 100) / 100,
    food_cost_montant: Math.round(food_cost_montant * 100) / 100,
    food_cost_pct: Math.round(food_cost_pct * 10) / 10,
    pertes_montant: Math.round(pertes_montant * 100) / 100,
    nb_releves_haccp,
    nb_non_conformes,
    heures_equipe: Math.round(heures_equipe * 10) / 10,
    cout_equipe: Math.round(cout_equipe * 100) / 100,
  }
}
