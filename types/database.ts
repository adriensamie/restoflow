// types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          clerk_org_id: string
          nom: string
          slug: string | null
          email_contact: string | null
          telephone: string | null
          adresse: string | null
          siret: string | null
          logo_url: string | null
          plan: 'trial' | 'starter' | 'pro' | 'enterprise'
          trial_ends_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          parent_organization_id: string | null
          seuil_ecart_livraison: number
          timezone: string
          devise: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_org_id: string
          nom: string
          slug?: string | null
          email_contact?: string | null
          telephone?: string | null
          adresse?: string | null
          siret?: string | null
          logo_url?: string | null
          plan?: 'trial' | 'starter' | 'pro' | 'enterprise'
          trial_ends_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          parent_organization_id?: string | null
          seuil_ecart_livraison?: number
          timezone?: string
          devise?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }

      staff: {
        Row: {
          id: string
          organization_id: string
          nom: string
          prenom: string
          initiales: string
          email: string | null
          telephone: string | null
          clerk_user_id: string | null
          clerk_org_role: string | null
          pin_hash: string | null
          pin_changed_at: string | null
          role: 'patron' | 'manager' | 'employe' | 'livreur'
          permissions: Json
          type_contrat: 'CDI' | 'CDD' | 'Apprentissage' | 'Extra' | 'Freelance' | null
          taux_horaire: number | null
          date_embauche: string | null
          date_fin_contrat: string | null
          actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          nom: string
          prenom: string
          email?: string | null
          telephone?: string | null
          clerk_user_id?: string | null
          clerk_org_role?: string | null
          pin_hash?: string | null
          pin_changed_at?: string | null
          role?: 'patron' | 'manager' | 'employe' | 'livreur'
          permissions?: Json
          type_contrat?: 'CDI' | 'CDD' | 'Apprentissage' | 'Extra' | 'Freelance' | null
          taux_horaire?: number | null
          date_embauche?: string | null
          date_fin_contrat?: string | null
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['staff']['Insert']>
      }

      produits: {
        Row: {
          id: string
          organization_id: string
          nom: string
          description: string | null
          categorie: string
          unite: string
          prix_unitaire: number | null
          seuil_alerte: number
          allergenes: string[] | null
          actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          nom: string
          description?: string | null
          categorie?: string
          unite?: string
          prix_unitaire?: number | null
          seuil_alerte?: number
          allergenes?: string[] | null
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['produits']['Insert']>
      }

      mouvements_stock: {
        Row: {
          id: string
          organization_id: string
          produit_id: string
          type: 'entree' | 'sortie' | 'perte' | 'inventaire' | 'transfert'
          quantite: number
          prix_unitaire: number | null
          motif: string | null
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          produit_id: string
          type: 'entree' | 'sortie' | 'perte' | 'inventaire' | 'transfert'
          quantite: number
          prix_unitaire?: number | null
          motif?: string | null
          note?: string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['mouvements_stock']['Insert']>
      }

      fournisseurs: {
        Row: {
          id: string
          organization_id: string
          nom: string
          contact_nom: string | null
          contact_email: string | null
          contact_telephone: string | null
          adresse: string | null
          delai_livraison: number | null
          conditions_paiement: string | null
          score_fiabilite: number | null
          nb_livraisons: number
          nb_ecarts: number
          actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          nom: string
          contact_nom?: string | null
          contact_email?: string | null
          contact_telephone?: string | null
          adresse?: string | null
          delai_livraison?: number | null
          conditions_paiement?: string | null
          score_fiabilite?: number | null
          nb_livraisons?: number
          nb_ecarts?: number
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['fournisseurs']['Insert']>
      }

      produit_fournisseur: {
        Row: {
          id: string
          organization_id: string
          produit_id: string
          fournisseur_id: string
          reference: string | null
          prix_negocie: number | null
          unite_commande: string | null
          qte_min: number | null
          fournisseur_principal: boolean
          facteur_conversion: number | null
          unite_reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          produit_id: string
          fournisseur_id: string
          reference?: string | null
          prix_negocie?: number | null
          unite_commande?: string | null
          qte_min?: number | null
          fournisseur_principal?: boolean
          facteur_conversion?: number | null
          unite_reference?: string | null
        }
        Update: Partial<Database['public']['Tables']['produit_fournisseur']['Insert']>
      }

      commandes: {
        Row: {
          id: string
          organization_id: string
          fournisseur_id: string
          numero: string
          statut: string
          date_livraison_prevue: string | null
          date_livraison_reelle: string | null
          total_ht: number | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          fournisseur_id: string
          numero: string
          statut?: string
          date_livraison_prevue?: string | null
          date_livraison_reelle?: string | null
          total_ht?: number | null
          note?: string | null
        }
        Update: Partial<Database['public']['Tables']['commandes']['Insert']>
      }

      commande_lignes: {
        Row: {
          id: string
          commande_id: string
          produit_id: string
          quantite_commandee: number
          quantite_recue: number | null
          prix_unitaire: number | null
          note_ecart: string | null
          created_at: string
        }
        Insert: {
          id?: string
          commande_id: string
          produit_id: string
          quantite_commandee: number
          quantite_recue?: number | null
          prix_unitaire?: number | null
          note_ecart?: string | null
        }
        Update: Partial<Database['public']['Tables']['commande_lignes']['Insert']>
      }

      vins: {
        Row: {
          id: string
          organization_id: string
          nom: string
          appellation: string | null
          categorie: string
          zone: string
          fournisseur_id: string | null
          prix_achat_ht: number | null
          prix_vente_ttc: number | null
          vendu_au_verre: boolean
          prix_verre_ttc: number | null
          contenance_verre: number | null
          stock_bouteilles: number
          seuil_alerte: number
          actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          nom: string
          appellation?: string | null
          categorie: string
          zone: string
          fournisseur_id?: string | null
          prix_achat_ht?: number | null
          prix_vente_ttc?: number | null
          vendu_au_verre?: boolean
          prix_verre_ttc?: number | null
          contenance_verre?: number | null
          stock_bouteilles?: number
          seuil_alerte?: number
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['vins']['Insert']>
      }

      mouvements_cave: {
        Row: {
          id: string
          organization_id: string
          vin_id: string
          type: string
          quantite: number
          prix_unitaire: number | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          vin_id: string
          type: string
          quantite: number
          prix_unitaire?: number | null
          note?: string | null
        }
        Update: Partial<Database['public']['Tables']['mouvements_cave']['Insert']>
      }

      sessions_inventaire: {
        Row: {
          id: string
          organization_id: string
          nom: string
          zone: string
          note: string | null
          statut: string
          validated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          nom: string
          zone: string
          note?: string | null
          statut?: string
          validated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['sessions_inventaire']['Insert']>
      }

      lignes_inventaire: {
        Row: {
          id: string
          organization_id: string
          session_id: string
          produit_id: string | null
          vin_id: string | null
          stock_theorique: number
          quantite_comptee: number | null
          unite: string | null
          note: string | null
          counted_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string
          session_id: string
          produit_id?: string | null
          vin_id?: string | null
          stock_theorique: number
          quantite_comptee?: number | null
          unite?: string | null
          note?: string | null
          counted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['lignes_inventaire']['Insert']>
      }

      config_caisse: {
        Row: {
          id: string
          organization_id: string
          source: string
          api_key: string | null
          webhook_secret: string | null
          api_endpoint: string | null
          seuil_alerte_annulation: number | null
          alertes_actives: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          source: string
          api_key?: string | null
          webhook_secret?: string | null
          api_endpoint?: string | null
          seuil_alerte_annulation?: number | null
          alertes_actives?: boolean
        }
        Update: Partial<Database['public']['Tables']['config_caisse']['Insert']>
      }

      events_caisse: {
        Row: {
          id: string
          organization_id: string
          event_type: string
          montant: number
          mode_paiement: string | null
          employe_nom: string | null
          nb_couverts: number | null
          motif: string | null
          service: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          event_type: string
          montant: number
          mode_paiement?: string | null
          employe_nom?: string | null
          nb_couverts?: number | null
          motif?: string | null
          service?: string | null
          source: string
        }
        Update: Partial<Database['public']['Tables']['events_caisse']['Insert']>
      }

      objectifs_kpi: {
        Row: {
          id: string
          organization_id: string
          mois: string
          food_cost_cible: number
          masse_salariale_cible: number
          marge_nette_cible: number
          ca_cible: number | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          mois: string
          food_cost_cible: number
          masse_salariale_cible: number
          marge_nette_cible: number
          ca_cible?: number | null
        }
        Update: Partial<Database['public']['Tables']['objectifs_kpi']['Insert']>
      }

      snapshots_food_cost: {
        Row: {
          id: string
          organization_id: string
          mois: string
          ca_total: number
          cout_matieres: number
          masse_salariale: number
          nb_couverts: number | null
          source: string | null
          food_cost_reel: number | null
          marge_brute: number | null
          marge_nette: number | null
          ticket_moyen: number | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          mois: string
          ca_total: number
          cout_matieres: number
          masse_salariale: number
          nb_couverts?: number | null
          source?: string | null
          food_cost_reel?: number | null
          marge_brute?: number | null
          marge_nette?: number | null
          ticket_moyen?: number | null
        }
        Update: Partial<Database['public']['Tables']['snapshots_food_cost']['Insert']>
      }

      previsions: {
        Row: {
          id: string
          organization_id: string
          date_prevision: string
          couverts_midi: number | null
          couverts_soir: number | null
          ca_prevu: number | null
          meteo_condition: string | null
          meteo_temperature: number | null
          est_ferie: boolean
          est_vacances: boolean
          evenement_local: string | null
          confiance: string
          produits_prioritaires: Json | null
          couverts_reel_midi: number | null
          couverts_reel_soir: number | null
          ca_reel: number | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          date_prevision: string
          couverts_midi?: number | null
          couverts_soir?: number | null
          ca_prevu?: number | null
          meteo_condition?: string | null
          meteo_temperature?: number | null
          est_ferie?: boolean
          est_vacances?: boolean
          evenement_local?: string | null
          confiance?: string
          produits_prioritaires?: Json | null
          couverts_reel_midi?: number | null
          couverts_reel_soir?: number | null
          ca_reel?: number | null
        }
        Update: Partial<Database['public']['Tables']['previsions']['Insert']>
      }

      recettes: {
        Row: {
          id: string
          organization_id: string
          nom: string
          type: string
          description: string | null
          prix_vente_ttc: number | null
          pourcentage_ficelles: number | null
          nb_portions: number | null
          allergenes: string[] | null
          importe_ia: boolean
          cout_matiere: number | null
          food_cost_pct: number | null
          marge_pct: number | null
          coefficient: number | null
          actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          nom: string
          type: string
          description?: string | null
          prix_vente_ttc?: number | null
          pourcentage_ficelles?: number | null
          nb_portions?: number | null
          allergenes?: string[] | null
          importe_ia?: boolean
          cout_matiere?: number | null
          food_cost_pct?: number | null
          marge_pct?: number | null
          coefficient?: number | null
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['recettes']['Insert']>
      }

      recette_ingredients: {
        Row: {
          id: string
          organization_id: string
          recette_id: string
          produit_id: string | null
          vin_id: string | null
          quantite: number
          unite: string
          cout_unitaire: number | null
          ordre: number | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          recette_id: string
          produit_id?: string | null
          vin_id?: string | null
          quantite: number
          unite: string
          cout_unitaire?: number | null
          ordre?: number | null
        }
        Update: Partial<Database['public']['Tables']['recette_ingredients']['Insert']>
      }

      employes: {
        Row: {
          id: string
          organization_id: string
          prenom: string
          nom: string
          poste: string
          email: string | null
          telephone: string | null
          couleur: string | null
          taux_horaire: number | null
          heures_contrat: number
          actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          prenom: string
          nom: string
          poste: string
          email?: string | null
          telephone?: string | null
          couleur?: string | null
          taux_horaire?: number | null
          heures_contrat?: number
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['employes']['Insert']>
      }

      creneaux_planning: {
        Row: {
          id: string
          organization_id: string
          employe_id: string
          date: string
          heure_debut: string
          heure_fin: string
          poste: string | null
          service: string | null
          note: string | null
          statut: string
          cout_prevu: number | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          employe_id: string
          date: string
          heure_debut: string
          heure_fin: string
          poste?: string | null
          service?: string | null
          note?: string | null
          statut?: string
          cout_prevu?: number | null
        }
        Update: Partial<Database['public']['Tables']['creneaux_planning']['Insert']>
      }

      fiches_paie: {
        Row: {
          id: string
          organization_id: string
          employe_id: string
          mois: string
          heures_normales: number
          heures_sup: number | null
          heures_absences: number | null
          salaire_brut: number
          cotisations: number
          salaire_net: number
          primes: number | null
          avantages: number | null
          importe_ia: boolean
          statut: string
          validated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          employe_id: string
          mois: string
          heures_normales: number
          heures_sup?: number | null
          heures_absences?: number | null
          salaire_brut: number
          cotisations?: number
          salaire_net?: number
          primes?: number | null
          avantages?: number | null
          importe_ia?: boolean
          statut?: string
          validated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['fiches_paie']['Insert']>
      }

      haccp_releves: {
        Row: {
          id: string
          organization_id: string
          template_id: string | null
          nom_controle: string
          type: string
          valeur: number | null
          unite: string | null
          resultat: string
          action_corrective: string | null
          zone: string | null
          equipement: string | null
          employe_nom: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          template_id?: string | null
          nom_controle: string
          type: string
          valeur?: number | null
          unite?: string | null
          resultat: string
          action_corrective?: string | null
          zone?: string | null
          equipement?: string | null
          employe_nom?: string | null
        }
        Update: Partial<Database['public']['Tables']['haccp_releves']['Insert']>
      }

      haccp_templates: {
        Row: {
          id: string
          organization_id: string
          nom: string
          type: string
          description: string | null
          frequence: string
          valeur_min: number | null
          valeur_max: number | null
          unite: string | null
          actif: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          nom: string
          type: string
          description?: string | null
          frequence: string
          valeur_min?: number | null
          valeur_max?: number | null
          unite?: string | null
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['haccp_templates']['Insert']>
      }

      role_permissions: {
        Row: {
          id: string
          organization_id: string
          role: 'manager' | 'employe' | 'livreur'
          allowed_routes: string[]
          allowed_actions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          role: 'manager' | 'employe' | 'livreur'
          allowed_routes: string[]
          allowed_actions?: string[]
        }
        Update: Partial<Database['public']['Tables']['role_permissions']['Insert']>
      }

      pin_sessions: {
        Row: {
          id: string
          organization_id: string
          staff_id: string
          token_hash: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          staff_id: string
          token_hash: string
          expires_at: string
        }
        Update: Partial<Database['public']['Tables']['pin_sessions']['Insert']>
      }

      retours_fournisseur: {
        Row: {
          id: string
          organization_id: string
          commande_id: string
          fournisseur_id: string
          numero: string
          statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'rembourse'
          total_ht: number | null
          pdf_url: string | null
          envoye_par_email: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          commande_id: string
          fournisseur_id: string
          numero: string
          statut?: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'rembourse'
          total_ht?: number | null
          pdf_url?: string | null
          envoye_par_email?: boolean
        }
        Update: Partial<Database['public']['Tables']['retours_fournisseur']['Insert']>
      }

      lignes_retour: {
        Row: {
          id: string
          retour_id: string
          produit_id: string
          quantite_retournee: number
          prix_unitaire: number | null
          motif: string | null
          created_at: string
        }
        Insert: {
          id?: string
          retour_id: string
          produit_id: string
          quantite_retournee: number
          prix_unitaire?: number | null
          motif?: string | null
        }
        Update: Partial<Database['public']['Tables']['lignes_retour']['Insert']>
      }

      notifications: {
        Row: {
          id: string
          organization_id: string
          staff_id: string | null
          type: string
          titre: string
          message: string
          lue: boolean
          metadata: Json | null
          canal: string[]
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          staff_id?: string | null
          type: string
          titre: string
          message: string
          lue?: boolean
          metadata?: Json | null
          canal?: string[]
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }

      notification_preferences: {
        Row: {
          id: string
          organization_id: string
          staff_id: string
          type: string
          in_app: boolean
          web_push: boolean
          email: boolean
        }
        Insert: {
          id?: string
          organization_id: string
          staff_id: string
          type: string
          in_app?: boolean
          web_push?: boolean
          email?: boolean
        }
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>
      }

      push_subscriptions: {
        Row: {
          id: string
          organization_id: string
          staff_id: string
          endpoint: string
          p256dh: string
          auth_key: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          staff_id: string
          endpoint: string
          p256dh: string
          auth_key: string
        }
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>
      }

      prix_produit_historique: {
        Row: {
          id: string
          organization_id: string
          produit_id: string
          fournisseur_id: string | null
          prix: number
          prix_precedent: number | null
          variation_pct: number | null
          source: string
          date_releve: string
          commande_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          produit_id: string
          fournisseur_id?: string | null
          prix: number
          prix_precedent?: number | null
          variation_pct?: number | null
          source?: string
          date_releve?: string
          commande_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['prix_produit_historique']['Insert']>
      }

      lots_produit: {
        Row: {
          id: string
          organization_id: string
          produit_id: string
          numero_lot: string | null
          quantite: number
          dlc: string | null
          dluo: string | null
          statut: 'actif' | 'consomme' | 'expire' | 'jete'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          produit_id: string
          numero_lot?: string | null
          quantite: number
          dlc?: string | null
          dluo?: string | null
          statut?: 'actif' | 'consomme' | 'expire' | 'jete'
        }
        Update: Partial<Database['public']['Tables']['lots_produit']['Insert']>
      }
    }

    Views: {
      stock_actuel: {
        Row: {
          produit_id: string
          organization_id: string
          nom: string
          categorie: string
          unite: string
          prix_unitaire: number | null
          seuil_alerte: number
          quantite_actuelle: number
          derniere_maj: string | null
          en_alerte: boolean
        }
      }
    }

    Functions: {
      get_org_id: {
        Args: Record<never, never>
        Returns: string
      }
      get_clerk_user_id: {
        Args: Record<never, never>
        Returns: string
      }
      init_haccp_templates: {
        Args: { org_id: string }
        Returns: void
      }
    }

    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Types helpers
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type Produit = Database['public']['Tables']['produits']['Row']
export type ProduitInsert = Database['public']['Tables']['produits']['Insert']
export type MouvementStock = Database['public']['Tables']['mouvements_stock']['Row']
export type MouvementStockInsert = Database['public']['Tables']['mouvements_stock']['Insert']
export type StockActuel = Database['public']['Views']['stock_actuel']['Row']
export type Fournisseur = Database['public']['Tables']['fournisseurs']['Row']
export type Commande = Database['public']['Tables']['commandes']['Row']
export type CommandeLigne = Database['public']['Tables']['commande_lignes']['Row']
export type Vin = Database['public']['Tables']['vins']['Row']
export type Recette = Database['public']['Tables']['recettes']['Row']
export type RecetteIngredient = Database['public']['Tables']['recette_ingredients']['Row']
export type Employe = Database['public']['Tables']['employes']['Row']
export type CreneauPlanning = Database['public']['Tables']['creneaux_planning']['Row']
export type FichePaie = Database['public']['Tables']['fiches_paie']['Row']
export type HaccpReleve = Database['public']['Tables']['haccp_releves']['Row']
export type HaccpTemplate = Database['public']['Tables']['haccp_templates']['Row']
export type Prevision = Database['public']['Tables']['previsions']['Row']
export type RolePermission = Database['public']['Tables']['role_permissions']['Row']
export type PinSession = Database['public']['Tables']['pin_sessions']['Row']
export type RetourFournisseur = Database['public']['Tables']['retours_fournisseur']['Row']
export type LigneRetour = Database['public']['Tables']['lignes_retour']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationPreference = Database['public']['Tables']['notification_preferences']['Row']
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row']
export type PrixHistorique = Database['public']['Tables']['prix_produit_historique']['Row']
export type LotProduit = Database['public']['Tables']['lots_produit']['Row']
export type ProduitFournisseur = Database['public']['Tables']['produit_fournisseur']['Row']
