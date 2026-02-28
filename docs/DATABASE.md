# Schéma de la base de données — RestoFlow

Documentation complète des 33 tables, vues et fonctions PostgreSQL (Supabase).

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Tables](#tables)
  - [Core](#core)
  - [Stocks & Produits](#stocks--produits)
  - [Fournisseurs & Commandes](#fournisseurs--commandes)
  - [Cave à vins](#cave-à-vins)
  - [Recettes](#recettes)
  - [Personnel & Planning](#personnel--planning)
  - [HACCP](#haccp)
  - [Finance & Marges](#finance--marges)
  - [Prévisions](#prévisions)
  - [RBAC & Sécurité](#rbac--sécurité)
  - [Notifications](#notifications)
  - [Prix & Lots](#prix--lots)
  - [Caisse & Antifraud](#caisse--antifraud)
- [Vue](#vue)
- [Fonctions](#fonctions)
- [RLS (Row Level Security)](#rls)
- [Types helper](#types-helper)

---

## Vue d'ensemble

```
33 tables · 1 vue · 3 fonctions SQL
Isolation : RLS par organization_id
Auth : JWT Clerk avec claims org_id et user_id
```

---

## Tables

### Core

#### `organizations`

Table centrale — chaque restaurant = 1 organisation.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant unique |
| `clerk_org_id` | text | ID organisation Clerk |
| `nom` | text | Nom du restaurant |
| `slug` | text? | Slug URL |
| `email_contact` | text? | Email de contact |
| `telephone` | text? | Téléphone |
| `adresse` | text? | Adresse postale |
| `siret` | text? | Numéro SIRET |
| `logo_url` | text? | URL du logo |
| `plan` | text | Plan actif : `trial` \| `starter` \| `pro` \| `enterprise` |
| `trial_ends_at` | timestamptz? | Date fin d'essai |
| `stripe_customer_id` | text? | ID client Stripe |
| `stripe_subscription_id` | text? | ID abonnement Stripe |
| `subscription_status` | text? | Statut Stripe (`active`, `past_due`, etc.) |
| `parent_organization_id` | uuid? (FK) | Organisation parent (multi-sites) |
| `seuil_ecart_livraison` | numeric | Seuil % d'écart pour alertes livraison |
| `timezone` | text | Fuseau horaire |
| `devise` | text | Devise (EUR) |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Dernière modification |

#### `staff`

Membres de l'équipe liés à une organisation. Lien entre Clerk users et rôles internes.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant unique |
| `organization_id` | uuid (FK) | Organisation |
| `nom` | text | Nom de famille |
| `prenom` | text | Prénom |
| `initiales` | text | Initiales (affiché kiosque) |
| `email` | text? | Email |
| `telephone` | text? | Téléphone |
| `clerk_user_id` | text? | ID utilisateur Clerk |
| `clerk_org_role` | text? | Rôle Clerk (`org:admin`, `org:member`) |
| `pin_hash` | text? | Hash bcrypt du PIN kiosque |
| `pin_changed_at` | timestamptz? | Date dernier changement de PIN |
| `role` | text | Rôle : `patron` \| `manager` \| `employe` \| `livreur` |
| `permissions` | jsonb | Permissions custom (legacy) |
| `type_contrat` | text? | `CDI` \| `CDD` \| `Apprentissage` \| `Extra` \| `Freelance` |
| `taux_horaire` | numeric? | Taux horaire brut (€) |
| `date_embauche` | date? | Date d'embauche |
| `date_fin_contrat` | date? | Date fin de contrat |
| `actif` | boolean | Actif (false = archivé) |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Dernière modification |

---

### Stocks & Produits

#### `produits`

Catalogue de produits (ingrédients, matières premières).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `nom` | text | Nom du produit |
| `description` | text? | Description |
| `categorie` | text | Catégorie (Viande, Poisson, Légume, etc.) |
| `unite` | text | Unité de stock (kg, L, piece, etc.) |
| `prix_unitaire` | numeric? | Prix unitaire courant (€) |
| `seuil_alerte` | numeric | Seuil de stock critique |
| `allergenes` | text[]? | Liste d'allergènes |
| `actif` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `mouvements_stock`

Historique de tous les mouvements de stock.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `produit_id` | uuid (FK → produits) | |
| `type` | text | `entree` \| `sortie` \| `perte` \| `inventaire` \| `transfert` |
| `quantite` | numeric | Quantité (toujours positive) |
| `prix_unitaire` | numeric? | Prix unitaire au moment du mouvement |
| `motif` | text? | Motif (pour pertes) |
| `note` | text? | Note libre |
| `created_by` | text? | ID du créateur |
| `created_at` | timestamptz | |

---

### Fournisseurs & Commandes

#### `fournisseurs`

Catalogue des fournisseurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `nom` | text | Nom du fournisseur |
| `contact_nom` | text? | Nom du contact |
| `contact_email` | text? | Email du contact |
| `contact_telephone` | text? | Téléphone |
| `adresse` | text? | Adresse |
| `delai_livraison` | integer? | Délai moyen de livraison (jours) |
| `conditions_paiement` | text? | Conditions de paiement |
| `score_fiabilite` | numeric? | Score de fiabilité calculé (0-100) |
| `nb_livraisons` | integer | Nombre total de livraisons |
| `nb_ecarts` | integer | Nombre d'écarts constatés |
| `actif` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `produit_fournisseur`

Table de liaison produit ↔ fournisseur (prix, référence, conversion).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `produit_id` | uuid (FK → produits) | |
| `fournisseur_id` | uuid (FK → fournisseurs) | |
| `reference` | text? | Référence fournisseur |
| `prix_negocie` | numeric? | Prix négocié |
| `unite_commande` | text? | Unité de commande (carton, etc.) |
| `qte_min` | numeric? | Quantité minimum de commande |
| `fournisseur_principal` | boolean | Fournisseur principal pour ce produit |
| `facteur_conversion` | numeric? | Facteur de conversion (unité commande → stock) |
| `unite_reference` | text? | Unité de référence pour conversion |
| `created_at` | timestamptz | |

#### `commandes`

Bons de commande fournisseur.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `fournisseur_id` | uuid (FK → fournisseurs) | |
| `numero` | text | Numéro de commande |
| `statut` | text | `brouillon` \| `envoyee` \| `livree` \| `annulee` |
| `date_livraison_prevue` | date? | Date de livraison prévue |
| `date_livraison_reelle` | date? | Date de livraison effective |
| `total_ht` | numeric? | Total HT |
| `note` | text? | Note |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `commande_lignes`

Lignes d'une commande.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `commande_id` | uuid (FK → commandes) | |
| `produit_id` | uuid (FK → produits) | |
| `quantite_commandee` | numeric | Quantité commandée |
| `quantite_recue` | numeric? | Quantité reçue (rempli à la réception) |
| `prix_unitaire` | numeric? | Prix unitaire |
| `note_ecart` | text? | Note si écart quantité |
| `created_at` | timestamptz | |

#### `retours_fournisseur`

Bons de retour fournisseur.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `commande_id` | uuid (FK → commandes) | |
| `fournisseur_id` | uuid (FK → fournisseurs) | |
| `numero` | text | Numéro du retour |
| `statut` | text | `brouillon` \| `envoye` \| `accepte` \| `refuse` \| `rembourse` |
| `total_ht` | numeric? | Total HT du retour |
| `pdf_url` | text? | URL du PDF généré |
| `envoye_par_email` | boolean | Envoyé par email |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `lignes_retour`

Lignes d'un retour fournisseur.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `retour_id` | uuid (FK → retours_fournisseur) | |
| `produit_id` | uuid (FK → produits) | |
| `quantite_retournee` | numeric | Quantité retournée |
| `prix_unitaire` | numeric? | Prix unitaire |
| `motif` | text? | Motif du retour |
| `created_at` | timestamptz | |

---

### Cave à vins

#### `vins`

Catalogue des vins.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `nom` | text | Nom du vin |
| `appellation` | text? | Appellation |
| `categorie` | text | Rouge, Blanc, Rosé, Champagne, etc. |
| `zone` | text | Zone de stockage |
| `fournisseur_id` | uuid? (FK → fournisseurs) | |
| `prix_achat_ht` | numeric? | Prix d'achat HT |
| `prix_vente_ttc` | numeric? | Prix de vente TTC (bouteille) |
| `vendu_au_verre` | boolean | Vendu au verre |
| `prix_verre_ttc` | numeric? | Prix au verre |
| `contenance_verre` | numeric? | Contenance d'un verre (cl) |
| `stock_bouteilles` | integer | Stock actuel en bouteilles |
| `seuil_alerte` | integer | Seuil d'alerte |
| `actif` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `mouvements_cave`

Mouvements d'entrée/sortie de vins.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `vin_id` | uuid (FK → vins) | |
| `type` | text | Type de mouvement |
| `quantite` | integer | Nombre de bouteilles |
| `prix_unitaire` | numeric? | Prix unitaire |
| `note` | text? | |
| `created_at` | timestamptz | |

---

### Recettes

#### `recettes`

Fiches recettes du restaurant.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `nom` | text | Nom de la recette |
| `type` | text | Entrée, Plat, Dessert, Boisson, etc. |
| `description` | text? | Description / instructions |
| `prix_vente_ttc` | numeric? | Prix de vente TTC |
| `pourcentage_ficelles` | numeric? | % ficelles (déchets, épluchures) |
| `nb_portions` | integer? | Nombre de portions |
| `allergenes` | text[]? | Allergènes calculés |
| `importe_ia` | boolean | Importé via IA |
| `cout_matiere` | numeric? | Coût matière calculé (€) |
| `food_cost_pct` | numeric? | Food cost (%) |
| `marge_pct` | numeric? | Marge (%) |
| `coefficient` | numeric? | Coefficient multiplicateur |
| `actif` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `recette_ingredients`

Ingrédients d'une recette.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `recette_id` | uuid (FK → recettes) | |
| `produit_id` | uuid? (FK → produits) | Produit lié |
| `vin_id` | uuid? (FK → vins) | Vin lié |
| `quantite` | numeric | Quantité |
| `unite` | text | Unité |
| `cout_unitaire` | numeric? | Coût unitaire |
| `ordre` | integer? | Ordre d'affichage |
| `created_at` | timestamptz | |

---

### Personnel & Planning

#### `employes`

Données RH des employés (paie, contrat).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `prenom` | text | |
| `nom` | text | |
| `poste` | text | Poste (Cuisinier, Serveur, etc.) |
| `email` | text? | |
| `telephone` | text? | |
| `couleur` | text? | Couleur dans le planning |
| `taux_horaire` | numeric? | Taux horaire brut (€) |
| `heures_contrat` | numeric | Heures hebdo contractuelles |
| `actif` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `creneaux_planning`

Créneaux horaires du planning.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `employe_id` | uuid (FK → employes) | |
| `date` | date | Date du créneau |
| `heure_debut` | time | Heure de début |
| `heure_fin` | time | Heure de fin |
| `poste` | text? | Poste assigné |
| `service` | text? | Service (midi, soir) |
| `note` | text? | |
| `statut` | text | `planifie` \| `confirme` \| `annule` |
| `cout_prevu` | numeric? | Coût estimé |
| `created_at` | timestamptz | |

#### `fiches_paie`

Fiches de paie mensuelles.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `employe_id` | uuid (FK → employes) | |
| `mois` | text | Mois (YYYY-MM) |
| `heures_normales` | numeric | Heures normales travaillées |
| `heures_sup` | numeric? | Heures supplémentaires |
| `heures_absences` | numeric? | Heures d'absence |
| `salaire_brut` | numeric | Salaire brut |
| `cotisations` | numeric | Cotisations sociales (22% hardcodé) |
| `salaire_net` | numeric | Salaire net |
| `primes` | numeric? | Primes |
| `avantages` | numeric? | Avantages en nature |
| `importe_ia` | boolean | Généré par IA |
| `statut` | text | `brouillon` \| `valide` \| `paye` |
| `validated_at` | timestamptz? | Date de validation |
| `created_at` | timestamptz | |

---

### HACCP

#### `haccp_templates`

Templates de contrôles HACCP.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `nom` | text | Nom du contrôle |
| `type` | text | température, visuel, nettoyage, etc. |
| `description` | text? | Description |
| `frequence` | text | quotidien, hebdomadaire, etc. |
| `valeur_min` | numeric? | Valeur minimum acceptable |
| `valeur_max` | numeric? | Valeur maximum acceptable |
| `unite` | text? | Unité (°C, etc.) |
| `actif` | boolean | |
| `created_at` | timestamptz | |

#### `haccp_releves`

Relevés de contrôle HACCP effectués.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `template_id` | uuid? (FK → haccp_templates) | |
| `nom_controle` | text | Nom du contrôle |
| `type` | text | Type de contrôle |
| `valeur` | numeric? | Valeur mesurée |
| `unite` | text? | Unité |
| `resultat` | text | `conforme` \| `non_conforme` |
| `action_corrective` | text? | Action corrective si non conforme |
| `zone` | text? | Zone (cuisine, chambre froide, etc.) |
| `equipement` | text? | Équipement contrôlé |
| `employe_nom` | text? | Nom de l'employé |
| `created_at` | timestamptz | |

---

### Finance & Marges

#### `objectifs_kpi`

Objectifs financiers mensuels.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `mois` | text | Mois (YYYY-MM) |
| `food_cost_cible` | numeric | Food cost cible (%) |
| `masse_salariale_cible` | numeric | Masse salariale cible (%) |
| `marge_nette_cible` | numeric | Marge nette cible (%) |
| `ca_cible` | numeric? | CA cible (€) |
| `created_at` | timestamptz | |

#### `snapshots_food_cost`

Snapshots mensuels des indicateurs financiers.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `mois` | text | Mois (YYYY-MM) |
| `ca_total` | numeric | Chiffre d'affaires total |
| `cout_matieres` | numeric | Coût matières |
| `masse_salariale` | numeric | Masse salariale |
| `nb_couverts` | integer? | Nombre de couverts |
| `source` | text? | Source des données |
| `food_cost_reel` | numeric? | Food cost réel (%) |
| `marge_brute` | numeric? | Marge brute (€) |
| `marge_nette` | numeric? | Marge nette (€) |
| `ticket_moyen` | numeric? | Ticket moyen (€) |
| `created_at` | timestamptz | |

#### `sessions_inventaire`

Sessions d'inventaire.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `nom` | text | Nom de la session |
| `zone` | text | Zone inventoriée |
| `note` | text? | Note |
| `statut` | text | `en_cours` \| `valide` \| `annule` |
| `validated_at` | timestamptz? | Date de validation |
| `created_at` | timestamptz | |

#### `lignes_inventaire`

Lignes d'inventaire (comptage par produit/vin).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `session_id` | uuid (FK → sessions_inventaire) | |
| `produit_id` | uuid? (FK → produits) | |
| `vin_id` | uuid? (FK → vins) | |
| `stock_theorique` | numeric | Stock théorique |
| `quantite_comptee` | numeric? | Quantité comptée |
| `unite` | text? | Unité |
| `note` | text? | Note |
| `counted_at` | timestamptz? | Date de comptage |

---

### Prévisions

#### `previsions`

Prévisions de fréquentation et CA.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `date_prevision` | date | Date prévisionnelle |
| `couverts_midi` | integer? | Couverts midi prévus |
| `couverts_soir` | integer? | Couverts soir prévus |
| `ca_prevu` | numeric? | CA prévu (€) |
| `meteo_condition` | text? | Condition météo |
| `meteo_temperature` | numeric? | Température (°C) |
| `est_ferie` | boolean | Jour férié |
| `est_vacances` | boolean | Période vacances |
| `evenement_local` | text? | Événement local |
| `confiance` | text | `haute` \| `moyenne` \| `basse` |
| `produits_prioritaires` | jsonb? | Produits à commander en priorité |
| `couverts_reel_midi` | integer? | Couverts réels midi |
| `couverts_reel_soir` | integer? | Couverts réels soir |
| `ca_reel` | numeric? | CA réel (€) |
| `created_at` | timestamptz | |

---

### RBAC & Sécurité

#### `role_permissions`

Permissions custom par organisation et rôle.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `role` | text | `manager` \| `employe` \| `livreur` |
| `allowed_routes` | text[] | Routes autorisées |
| `allowed_actions` | text[] | Actions autorisées |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Contrainte unique** : `(organization_id, role)`

#### `pin_sessions`

Sessions PIN (table de référence — les sessions sont en réalité JWT).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `staff_id` | uuid (FK → staff) | |
| `token_hash` | text | Hash du token |
| `expires_at` | timestamptz | Date d'expiration |
| `created_at` | timestamptz | |

---

### Notifications

#### `notifications`

Notifications in-app.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `staff_id` | uuid? (FK → staff) | Staff ciblé (null = tous) |
| `type` | text | Type de notification |
| `titre` | text | Titre |
| `message` | text | Contenu |
| `lue` | boolean | Lue ou non |
| `metadata` | jsonb? | Données supplémentaires |
| `canal` | text[] | Canaux : `in_app`, `web_push`, `email` |
| `created_at` | timestamptz | |

#### `notification_preferences`

Préférences de notification par type et par staff.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `staff_id` | uuid (FK → staff) | |
| `type` | text | Type de notification |
| `in_app` | boolean | Recevoir in-app |
| `web_push` | boolean | Recevoir en push |
| `email` | boolean | Recevoir par email |

#### `push_subscriptions`

Abonnements Web Push (Service Worker).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `staff_id` | uuid (FK → staff) | |
| `endpoint` | text | URL endpoint push |
| `p256dh` | text | Clé publique ECDH |
| `auth_key` | text | Clé d'authentification |
| `created_at` | timestamptz | |

---

### Prix & Lots

#### `prix_produit_historique`

Historique des prix des produits.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `produit_id` | uuid (FK → produits) | |
| `fournisseur_id` | uuid? (FK → fournisseurs) | |
| `prix` | numeric | Prix relevé |
| `prix_precedent` | numeric? | Prix précédent |
| `variation_pct` | numeric? | Variation en % |
| `source` | text | Source du prix (livraison, manuel) |
| `date_releve` | date | Date du relevé |
| `commande_id` | uuid? (FK → commandes) | Commande associée |
| `created_at` | timestamptz | |

#### `lots_produit`

Lots de produits avec DLC/DLUO.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `produit_id` | uuid (FK → produits) | |
| `numero_lot` | text? | Numéro de lot |
| `quantite` | numeric | Quantité |
| `dlc` | date? | Date Limite de Consommation |
| `dluo` | date? | Date Limite d'Utilisation Optimale |
| `statut` | text | `actif` \| `consomme` \| `expire` \| `jete` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### Caisse & Antifraud

#### `config_caisse`

Configuration de la connexion caisse.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `source` | text | Source (nom du logiciel de caisse) |
| `api_key` | text? | Clé API |
| `webhook_secret` | text? | Secret de vérification webhook |
| `api_endpoint` | text? | URL de l'API caisse |
| `seuil_alerte_annulation` | numeric? | Seuil d'annulation suspect (€) |
| `alertes_actives` | boolean | Alertes anti-fraude actives |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `events_caisse`

Événements reçus de la caisse.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `organization_id` | uuid (FK) | |
| `event_type` | text | Type d'événement (vente, annulation, etc.) |
| `montant` | numeric | Montant (€) |
| `mode_paiement` | text? | CB, espèces, etc. |
| `employe_nom` | text? | Nom de l'employé |
| `nb_couverts` | integer? | Nombre de couverts |
| `motif` | text? | Motif (pour annulations) |
| `service` | text? | Service (midi, soir) |
| `source` | text | Source des données |
| `created_at` | timestamptz | |

---

## Vue

### `stock_actuel`

Vue calculée du stock actuel par produit (somme des mouvements).

| Colonne | Type | Description |
|---------|------|-------------|
| `produit_id` | uuid | |
| `organization_id` | uuid | |
| `nom` | text | Nom du produit |
| `categorie` | text | Catégorie |
| `unite` | text | Unité |
| `prix_unitaire` | numeric? | Prix unitaire courant |
| `seuil_alerte` | numeric | Seuil d'alerte |
| `quantite_actuelle` | numeric | Stock actuel calculé |
| `derniere_maj` | timestamptz? | Date du dernier mouvement |
| `en_alerte` | boolean | `quantite_actuelle <= seuil_alerte` |

---

## Fonctions

### `get_org_id()`

Extrait l'`organization_id` du JWT Clerk.

```sql
-- Retourne l'org_id des claims JWT
SELECT auth.jwt() -> 'org_id'
```

Utilisée dans les politiques RLS pour isoler les données.

### `get_clerk_user_id()`

Extrait le `user_id` du JWT Clerk.

```sql
-- Retourne le user_id (sub) des claims JWT
SELECT auth.jwt() -> 'sub'
```

### `init_haccp_templates(org_id uuid)`

Initialise les templates HACCP par défaut pour une nouvelle organisation (températures frigos, nettoyage, etc.).

---

## RLS

Toutes les tables ont des politiques RLS activées. Le pattern est identique :

```sql
-- Politique SELECT (lecture)
CREATE POLICY "org_isolation_select" ON table_name
  FOR SELECT USING (organization_id = get_org_id());

-- Politique INSERT
CREATE POLICY "org_isolation_insert" ON table_name
  FOR INSERT WITH CHECK (organization_id = get_org_id());

-- Politique UPDATE
CREATE POLICY "org_isolation_update" ON table_name
  FOR UPDATE USING (organization_id = get_org_id());

-- Politique DELETE
CREATE POLICY "org_isolation_delete" ON table_name
  FOR DELETE USING (organization_id = get_org_id());
```

**Principe** : Chaque requête est automatiquement filtrée par `organization_id` grâce au JWT Clerk. Un utilisateur ne peut jamais accéder aux données d'une autre organisation.

**Exception** : Le client admin (`SUPABASE_SERVICE_ROLE_KEY`) contourne le RLS — utilisé uniquement dans les webhooks Clerk/Stripe.

---

## Types helper

Types TypeScript exportés depuis `types/database.ts` pour usage dans le code :

```typescript
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
```
