-- Migration: Multi-site RLS support
-- Allows parent orgs (enterprise) to access data from child organizations
-- Run this ENTIRE file in Supabase SQL Editor

-- 0. Fix get_org_id() to always return the PARENT org (ignore child orgs)
-- Without this fix, multiple orgs sharing the same clerk_org_id break .single() queries
CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.organizations
  WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
    AND parent_organization_id IS NULL
  LIMIT 1
$$;

-- 1. Helper function: returns all org IDs accessible to current user
-- (the parent org + any child organizations)
CREATE OR REPLACE FUNCTION public.get_accessible_org_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT array_agg(id) FROM public.organizations
  WHERE id = public.get_org_id()
     OR parent_organization_id = public.get_org_id()
$$;

-- 2. Update RLS policies for all tables with organization_id
-- Pattern: DROP old policy, CREATE new one with ANY(get_accessible_org_ids())

-- NOTE: Your existing policies may have different names.
-- Adjust the DROP POLICY names to match your actual policy names.
-- If a DROP fails because the policy doesn't exist, it's safe to ignore.

-- Helper: For each table, we create a permissive policy that covers SELECT/INSERT/UPDATE/DELETE

-- ─── produits ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  -- Drop existing policies (ignore errors if they don't exist)
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON produits; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "produits_org_policy" ON produits; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON produits; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON produits
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── fournisseurs ────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON fournisseurs; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "fournisseurs_org_policy" ON fournisseurs; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON fournisseurs; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON fournisseurs
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── employes ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON employes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "employes_org_policy" ON employes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON employes; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON employes
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── commandes ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON commandes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "commandes_org_policy" ON commandes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON commandes; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON commandes
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── mouvements_stock ────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON mouvements_stock; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "mouvements_stock_org_policy" ON mouvements_stock; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON mouvements_stock; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON mouvements_stock
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── vins ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON vins; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "vins_org_policy" ON vins; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON vins; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON vins
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── mouvements_cave ─────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON mouvements_cave; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "mouvements_cave_org_policy" ON mouvements_cave; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON mouvements_cave; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON mouvements_cave
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── recettes ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON recettes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "recettes_org_policy" ON recettes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON recettes; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON recettes
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── recette_ingredients ─────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON recette_ingredients; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "recette_ingredients_org_policy" ON recette_ingredients; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON recette_ingredients; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON recette_ingredients
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── haccp_templates ─────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON haccp_templates; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "haccp_templates_org_policy" ON haccp_templates; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON haccp_templates; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON haccp_templates
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── haccp_releves ───────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON haccp_releves; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "haccp_releves_org_policy" ON haccp_releves; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON haccp_releves; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON haccp_releves
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── creneaux_planning ──────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON creneaux_planning; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "creneaux_planning_org_policy" ON creneaux_planning; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON creneaux_planning; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON creneaux_planning
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── fiches_paie ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON fiches_paie; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "fiches_paie_org_policy" ON fiches_paie; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON fiches_paie; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON fiches_paie
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── sessions_inventaire ─────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON sessions_inventaire; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "sessions_inventaire_org_policy" ON sessions_inventaire; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON sessions_inventaire; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON sessions_inventaire
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── lignes_inventaire ───────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON lignes_inventaire; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "lignes_inventaire_org_policy" ON lignes_inventaire; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON lignes_inventaire; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON lignes_inventaire
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── events_caisse ───────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON events_caisse; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "events_caisse_org_policy" ON events_caisse; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON events_caisse; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON events_caisse
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── config_caisse ───────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON config_caisse; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "config_caisse_org_policy" ON config_caisse; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON config_caisse; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON config_caisse
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── objectifs_kpi ───────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON objectifs_kpi; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "objectifs_kpi_org_policy" ON objectifs_kpi; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON objectifs_kpi; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON objectifs_kpi
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── snapshots_food_cost ─────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON snapshots_food_cost; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "snapshots_food_cost_org_policy" ON snapshots_food_cost; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON snapshots_food_cost; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON snapshots_food_cost
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── previsions ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON previsions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "previsions_org_policy" ON previsions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON previsions; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON previsions
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── produit_fournisseur ─────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON produit_fournisseur; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "produit_fournisseur_org_policy" ON produit_fournisseur; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON produit_fournisseur; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON produit_fournisseur
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── staff ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON staff; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "staff_org_policy" ON staff; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON staff; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON staff
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── organizations (self + children) ─────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON organizations; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "organizations_org_policy" ON organizations; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON organizations; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON organizations
  USING (id = ANY(get_accessible_org_ids()));

-- ─── role_permissions ────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON role_permissions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "role_permissions_org_policy" ON role_permissions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON role_permissions; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON role_permissions
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── pin_sessions ────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON pin_sessions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "pin_sessions_org_policy" ON pin_sessions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON pin_sessions; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON pin_sessions
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── retours_fournisseur ─────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON retours_fournisseur; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "retours_fournisseur_org_policy" ON retours_fournisseur; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON retours_fournisseur; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON retours_fournisseur
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── notifications ───────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON notifications; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "notifications_org_policy" ON notifications; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON notifications; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON notifications
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── notification_preferences ────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON notification_preferences; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "notification_preferences_org_policy" ON notification_preferences; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON notification_preferences; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON notification_preferences
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── push_subscriptions ──────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON push_subscriptions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "push_subscriptions_org_policy" ON push_subscriptions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON push_subscriptions; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON push_subscriptions
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── prix_produit_historique ─────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON prix_produit_historique; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "prix_produit_historique_org_policy" ON prix_produit_historique; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON prix_produit_historique; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON prix_produit_historique
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── lots_produit ────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON lots_produit; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "lots_produit_org_policy" ON lots_produit; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON lots_produit; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON lots_produit
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── commande_lignes (FK via commande_id, RLS via organization_id) ────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON commande_lignes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "commande_lignes_org_policy" ON commande_lignes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON commande_lignes; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON commande_lignes
  USING (organization_id = ANY(get_accessible_org_ids()));

-- ─── lignes_retour (FK via retour_id, RLS via organization_id) ────────────
DO $$ BEGIN
  BEGIN DROP POLICY IF EXISTS "org_isolation" ON lignes_retour; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "lignes_retour_org_policy" ON lignes_retour; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Enable access for org members" ON lignes_retour; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
CREATE POLICY "org_multi_site_access" ON lignes_retour
  USING (organization_id = ANY(get_accessible_org_ids()));
