import { AssistantClient } from '@/components/assistant/assistant-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { requireAccess } from '@/lib/billing'
import { getPageContext } from '@/lib/page-context'

export default async function AssistantPage() {
  await requireRouteAccess('/assistant')
  await requireAccess('assistant_ia')
  const { supabase, orgId } = await getPageContext()

  const { data: org } = await supabase
    .from('organizations').select('nom').eq('id', orgId).single()

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
    supabase.from('stock_actuel').select('nom, quantite_actuelle, seuil_alerte, unite, categorie').eq('organization_id', orgId).order('quantite_actuelle'),
    supabase.from('mouvements_stock').select('quantite, prix_unitaire, motif, created_at').eq('organization_id', orgId).eq('type', 'perte').gte('created_at', debut30j),
    supabase.from('snapshots_food_cost').select('*').eq('organization_id', orgId).order('mois', { ascending: false }).limit(3),
    supabase.from('recettes').select('nom, type, food_cost_pct, marge_pct, cout_matiere, prix_vente_ttc').eq('actif', true).eq('organization_id', orgId).order('food_cost_pct', { ascending: false }).limit(10),
    supabase.from('employes').select('prenom, nom, poste, heures_contrat, taux_horaire').eq('actif', true).eq('organization_id', orgId),
    supabase.from('previsions').select('date_prevision, couverts_midi, couverts_soir, ca_prevu, ca_reel').eq('organization_id', orgId).gte('date_prevision', debutMois).order('date_prevision', { ascending: false }).limit(7),
    supabase.from('haccp_releves').select('nom_controle, resultat, action_corrective, created_at').eq('organization_id', orgId).eq('resultat', 'non_conforme').gte('created_at', debut30j).limit(5),
  ])

  const contexte = {
    restaurant: org?.nom,
    date: aujourd.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    stocks: {
      alertes: stocks?.filter(s => s.quantite_actuelle <= s.seuil_alerte).map(s => `${s.nom}: ${s.quantite_actuelle}${s.unite}`),
      totalProduits: stocks?.length,
    },
    pertes: {
      totalMois: pertes?.reduce((a: number, p) => a + (p.quantite * (p.prix_unitaire || 0)), 0)?.toFixed(2),
      nb: pertes?.length,
    },
    financier: snapshots?.[0] ? {
      moisDernier: snapshots[0].mois,
      ca: snapshots[0].ca_total,
      foodCost: snapshots[0].food_cost_reel,
      margeNette: snapshots[0].marge_nette,
      couverts: snapshots[0].nb_couverts,
    } : null,
    recettesProblematiques: recettes?.filter(r => r.food_cost_pct && r.food_cost_pct > 35).map(r => `${r.nom}: ${r.food_cost_pct}% food cost`),
    equipe: {
      nb: employes?.length,
      postes: [...new Set(employes?.map(e => e.poste))],
    },
    previsions: previsions?.slice(0, 3).map(p => ({
      date: p.date_prevision,
      couverts: (p.couverts_midi || 0) + (p.couverts_soir || 0),
      caPrevu: p.ca_prevu,
      caReel: p.ca_reel,
    })),
    haccp: {
      nonConformes: nonConformes?.length,
      derniers: nonConformes?.slice(0, 3).map(r => r.nom_controle),
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
