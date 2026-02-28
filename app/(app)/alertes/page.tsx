import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { AlertesClient } from '@/components/alertes/alertes-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function AlertesPage() {
  await requireRouteAccess('/alertes')
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const aujourd = new Date()
  const debut30j = new Date(aujourd.getTime() - 30 * 86400000).toISOString()

  const [
    { data: stocksCritiques },
    { data: pertes },
    { data: nonConformes },
    { data: annulationsSuspectes },
    { data: previsions },
  ] = await Promise.all([
    // Stocks sous seuil d'alerte
    (supabase as any)
      .from('stock_actuel')
      .select('produit_id, nom, categorie, quantite_actuelle, seuil_alerte, unite')
      .eq('organization_id', orgUUID)
      .eq('en_alerte', true)
      .order('quantite_actuelle'),
    // Pertes importantes ce mois
    (supabase as any)
      .from('mouvements_stock')
      .select('quantite, prix_unitaire, motif, created_at, produits(nom)')
      .eq('organization_id', orgUUID)
      .eq('type', 'perte')
      .gte('created_at', debut30j)
      .order('created_at', { ascending: false })
      .limit(20),
    // Non conformités HACCP
    (supabase as any)
      .from('haccp_releves')
      .select('nom_controle, resultat, action_corrective, created_at')
      .eq('organization_id', orgUUID)
      .in('resultat', ['non_conforme', 'action_corrective'])
      .gte('created_at', debut30j)
      .order('created_at', { ascending: false })
      .limit(10),
    // Annulations suspectes caisse
    (supabase as any)
      .from('events_caisse')
      .select('montant, employe_nom, created_at, motif')
      .eq('organization_id', orgUUID)
      .eq('event_type', 'annulation_ticket')
      .gte('created_at', debut30j)
      .order('montant', { ascending: false })
      .limit(10),
    // Prévisions non saisies
    (supabase as any)
      .from('previsions')
      .select('date_prevision, couverts_midi, couverts_soir, ca_prevu, ca_reel')
      .eq('organization_id', orgUUID)
      .gte('date_prevision', aujourd.toISOString().slice(0, 10))
      .order('date_prevision')
      .limit(7),
  ])

  const stocksFiltered = stocksCritiques ?? []

  return (
    <AlertesClient
      stocksCritiques={stocksFiltered}
      pertes={pertes ?? []}
      nonConformes={nonConformes ?? []}
      annulationsSuspectes={annulationsSuspectes ?? []}
      previsions={previsions ?? []}
    />
  )
}
