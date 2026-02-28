import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { AssistantClient } from '@/components/assistant/assistant-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function AssistantPage() {
  await requireRouteAccess('/assistant')
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id, nom').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  // Contexte enrichi pour l'IA
  const aujourd = new Date()
  const debutMois = new Date(aujourd.getFullYear(), aujourd.getMonth(), 1).toISOString().slice(0, 10)
  const debut30j = new Date(aujourd.getTime() - 30 * 86400000).toISOString().slice(0, 10)

  const [
    { data: stocks },
    { data: pertes },
    { data: snapshots },
    { data: recettes },
    { data: employes },
    { data: previsions },
    { data: nonConformes },
  ] = await Promise.all([
    (supabase as any).from('produits').select('nom, stock_actuel, seuil_alerte, unite, categorie').eq('actif', true).eq('organization_id', orgUUID).order('stock_actuel'),
    (supabase as any).from('mouvements_stock').select('quantite, prix_unitaire, motif, created_at').eq('organization_id', orgUUID).eq('type', 'perte').gte('created_at', debut30j),
    (supabase as any).from('snapshots_food_cost').select('*').eq('organization_id', orgUUID).order('mois', { ascending: false }).limit(3),
    (supabase as any).from('recettes').select('nom, type, food_cost_pct, marge_pct, cout_matiere, prix_vente_ttc').eq('actif', true).eq('organization_id', orgUUID).order('food_cost_pct', { ascending: false }).limit(10),
    (supabase as any).from('employes').select('prenom, nom, poste, heures_contrat, taux_horaire').eq('actif', true).eq('organization_id', orgUUID),
    (supabase as any).from('previsions').select('date_prevision, couverts_midi, couverts_soir, ca_prevu, ca_reel').eq('organization_id', orgUUID).gte('date_prevision', debutMois).order('date_prevision', { ascending: false }).limit(7),
    (supabase as any).from('haccp_releves').select('nom_controle, resultat, action_corrective, releve_at').eq('organization_id', orgUUID).eq('resultat', 'non_conforme').gte('releve_at', debut30j).limit(5),
  ])

  const contexte = {
    restaurant: org?.nom,
    date: aujourd.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    stocks: {
      alertes: stocks?.filter((s: any) => s.stock_actuel <= s.seuil_alerte).map((s: any) => `${s.nom}: ${s.stock_actuel}${s.unite}`),
      totalProduits: stocks?.length,
    },
    pertes: {
      totalMois: pertes?.reduce((a: number, p: any) => a + (p.quantite * (p.prix_unitaire || 0)), 0)?.toFixed(2),
      nb: pertes?.length,
    },
    financier: snapshots?.[0] ? {
      moisDernier: snapshots[0].mois,
      ca: snapshots[0].ca_total,
      foodCost: snapshots[0].food_cost_reel,
      margeNette: snapshots[0].marge_nette,
      couverts: snapshots[0].nb_couverts,
    } : null,
    recettesProblematiques: recettes?.filter((r: any) => r.food_cost_pct > 35).map((r: any) => `${r.nom}: ${r.food_cost_pct}% food cost`),
    equipe: {
      nb: employes?.length,
      postes: [...new Set(employes?.map((e: any) => e.poste))],
    },
    previsions: previsions?.slice(0, 3).map((p: any) => ({
      date: p.date_prevision,
      couverts: (p.couverts_midi || 0) + (p.couverts_soir || 0),
      caPrevu: p.ca_prevu,
      caReel: p.ca_reel,
    })),
    haccp: {
      nonConformes: nonConformes?.length,
      derniers: nonConformes?.slice(0, 3).map((r: any) => r.nom_controle),
    },
  }

  const suggestions = [
    { label: '📊 Analyse food cost', prompt: 'Analyse mon food cost et donne-moi 3 actions concrètes pour l\'améliorer.' },
    { label: '📦 Alertes stocks', prompt: 'Quels produits dois-je commander en urgence ? Analyse mes niveaux de stock.' },
    { label: '👥 Optimiser planning', prompt: 'Comment optimiser mon planning équipe pour réduire les coûts salariaux ?' },
    { label: '📈 Prévisions semaine', prompt: 'Analyse mes prévisions et dis-moi comment préparer la semaine.' },
    { label: '🧼 HACCP', prompt: 'Y a-t-il des problèmes de conformité HACCP à corriger en urgence ?' },
    { label: '💡 Conseil du jour', prompt: 'Donne-moi le conseil le plus important pour améliorer la rentabilité de mon restaurant aujourd\'hui.' },
  ]

  return <AssistantClient contexte={contexte} suggestions={suggestions} />
}
