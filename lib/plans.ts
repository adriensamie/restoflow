// Shared plan definitions — usable in both server and client code

export type Plan = 'trial' | 'starter' | 'pro' | 'enterprise'

export type Feature =
  | 'stocks' | 'pertes' | 'commandes' | 'livraisons' | 'recettes'
  | 'planning' | 'haccp' | 'marges' | 'fournisseurs' | 'inventaire' | 'alertes'
  | 'previsions_ia' | 'assistant_ia' | 'antifraud' | 'cave' | 'import_bl'
  | 'fiches_paie' | 'integrations'
  | 'multi_sites' | 'api_access'
  // New features
  | 'rbac_config' | 'pin_kiosque' | 'quick_switch'
  | 'retour_fournisseur' | 'notifs_push_email'
  | 'evolution_prix' | 'alertes_prix'
  | 'allergenes' | 'dlc_tracking' | 'suggestions_reappro'
  | 'scoring_fournisseur' | 'bilan_journee' | 'bilan_pdf'
  | 'conversions_unites'

// Trial: RBAC defaults, notifs in-app, allergenes, conversions
const TRIAL_FEATURES: Feature[] = [
  'stocks', 'pertes', 'commandes', 'livraisons', 'recettes',
  'planning', 'haccp', 'marges', 'fournisseurs', 'inventaire', 'alertes',
  'allergenes', 'conversions_unites',
]

const STARTER_FEATURES: Feature[] = [
  ...TRIAL_FEATURES,
  'rbac_config', 'quick_switch',
  'retour_fournisseur', 'evolution_prix',
  'dlc_tracking', 'suggestions_reappro', 'scoring_fournisseur',
  'bilan_journee',
]

const PRO_FEATURES: Feature[] = [
  ...STARTER_FEATURES,
  'previsions_ia', 'assistant_ia', 'antifraud', 'cave', 'import_bl',
  'fiches_paie', 'integrations',
  'pin_kiosque', 'notifs_push_email', 'alertes_prix', 'bilan_pdf',
]

const ENTERPRISE_FEATURES: Feature[] = [
  ...PRO_FEATURES,
  'multi_sites', 'api_access',
]

export const PLAN_FEATURES: Record<Plan, Feature[]> = {
  trial: TRIAL_FEATURES,
  starter: STARTER_FEATURES,
  pro: PRO_FEATURES,
  enterprise: ENTERPRISE_FEATURES,
}

export const PLAN_LABELS: Record<Plan, string> = {
  trial: 'Essai gratuit',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export const PLAN_PRICES: Record<Exclude<Plan, 'trial'>, number> = {
  starter: 49,
  pro: 99,
  enterprise: 199,
}

export function minimumPlanFor(feature: Feature): Plan {
  if (STARTER_FEATURES.includes(feature)) return 'starter'
  if (PRO_FEATURES.includes(feature)) return 'pro'
  return 'enterprise'
}
