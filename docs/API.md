# Référence API — RestoFlow

Documentation de toutes les routes API, Server Actions et Webhooks.

---

## Table des matières

- [Routes API](#routes-api)
  - [IA (Claude Haiku)](#ia-claude-haiku)
  - [Billing (Stripe)](#billing-stripe)
  - [Notifications](#notifications)
  - [Stocks](#stocks)
  - [Retours fournisseur](#retours-fournisseur)
  - [Caisse](#caisse)
  - [Cron Jobs](#cron-jobs)
- [Webhooks](#webhooks)
- [Server Actions](#server-actions)

---

## Routes API

Toutes les routes API sont dans `app/api/`. Elles utilisent les Route Handlers de Next.js.

### IA (Claude Haiku)

Toutes les routes IA requièrent l'authentification Clerk et la feature `assistant_ia` ou `previsions_ia` (plan Pro+).

#### `POST /api/ia/assistant`

Assistant chat streaming — répond aux questions contextuelles sur les données du restaurant.

```typescript
// Headers
Authorization: Bearer <clerk-token>

// Body
{
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  context?: { page: string, data?: any }
}

// Response: ReadableStream (text/event-stream)
```

#### `POST /api/ia/analyser-bl`

Analyse un bon de livraison (image) et extrait les données structurées.

```typescript
// Body
{
  image: string  // base64
}

// Response
{
  fournisseur: string,
  date: string,
  lignes: Array<{
    produit: string,
    quantite: number,
    unite: string,
    prix_unitaire: number
  }>
}
```

#### `POST /api/ia/analyser-fiche`

Analyse une fiche technique de recette.

```typescript
// Body
{
  image: string  // base64
}

// Response
{
  nom: string,
  type: string,
  nb_portions: number,
  ingredients: Array<{ nom: string, quantite: number, unite: string }>,
  etapes: string[]
}
```

#### `POST /api/ia/analyser-photo-produit`

Identifie un produit à partir d'une photo.

```typescript
// Body
{
  image: string  // base64
}

// Response
{
  nom: string,
  categorie: string,
  unite: string,
  allergenes: string[]
}
```

#### `POST /api/ia/analyser-photo-recette`

Extrait les informations d'une recette à partir d'une photo de plat.

```typescript
// Body
{
  image: string  // base64
}

// Response
{
  nom: string,
  type: string,
  ingredients: Array<{ nom: string, quantite: number, unite: string }>,
  description: string
}
```

#### `POST /api/ia/analyser-produit`

Enrichit les données d'un produit (catégorie, allergènes, etc.).

```typescript
// Body
{
  nom: string,
  description?: string
}

// Response
{
  categorie: string,
  unite: string,
  allergenes: string[],
  description: string
}
```

#### `POST /api/ia/previsions`

Génère des prévisions de fréquentation et CA.

```typescript
// Body
{
  historique: Array<{ date: string, couverts: number, ca: number }>,
  date_cible: string,
  meteo?: { condition: string, temperature: number },
  est_ferie?: boolean,
  est_vacances?: boolean,
  evenement_local?: string
}

// Response
{
  couverts_midi: number,
  couverts_soir: number,
  ca_prevu: number,
  confiance: 'haute' | 'moyenne' | 'basse',
  produits_prioritaires: string[]
}
```

---

### Billing (Stripe)

#### `POST /api/billing/checkout`

Crée une session Stripe Checkout pour un abonnement.

```typescript
// Auth: Clerk (patron uniquement)
// Body
{
  plan: 'starter' | 'pro' | 'enterprise'
}

// Response
{
  url: string  // URL de redirection Stripe Checkout
}
```

#### `POST /api/billing/portal`

Crée un lien vers le portail client Stripe.

```typescript
// Auth: Clerk (patron uniquement)
// Body: {}

// Response
{
  url: string  // URL du portail Stripe
}
```

---

### Notifications

#### `POST /api/notifications/subscribe`

Enregistre un abonnement push notification (Service Worker).

```typescript
// Auth: Clerk
// Body
{
  subscription: {
    endpoint: string,
    keys: {
      p256dh: string,
      auth: string
    }
  }
}

// Response
{ success: true }
```

---

### Stocks

#### `GET /api/stocks/produits`

Export CSV de tous les produits de l'organisation.

```typescript
// Auth: Clerk
// Response: text/csv
```

---

### Retours fournisseur

#### `POST /api/retours/envoyer-email`

Envoie le bon de retour par email au fournisseur via Resend.

```typescript
// Auth: Clerk
// Body
{
  retourId: string
}

// Response
{ success: true }
```

---

### Caisse

#### `POST /api/caisse/webhook`

Reçoit les événements de la caisse enregistreuse (ventes, annulations, etc.).

```typescript
// Auth: webhook_secret (header X-Webhook-Secret)
// Body
{
  event_type: string,
  montant: number,
  mode_paiement?: string,
  employe_nom?: string,
  nb_couverts?: number,
  motif?: string,
  service?: string
}

// Response
{ received: true }
```

---

### Cron Jobs

Routes déclenchées par un scheduler (Vercel Cron). Protégées par `CRON_SECRET`.

#### `GET /api/cron/check-dlc`

Vérifie les lots dont la DLC/DLUO approche et crée des notifications `dlc_proche`.

```
Schedule: 0 6 * * * (tous les jours à 6h)
```

#### `GET /api/cron/digest-email`

Envoie un email résumé quotidien aux patrons/managers (alertes, stocks critiques, etc.).

```
Schedule: 0 7 * * * (tous les jours à 7h)
```

---

## Webhooks

### `POST /api/webhooks/clerk`

Reçoit les événements Clerk (via Svix) pour synchroniser les organisations et utilisateurs.

| Événement | Action |
|-----------|--------|
| `organization.created` | Crée une ligne `organizations` |
| `organization.updated` | Met à jour `organizations` |
| `organizationMembership.created` | Crée un enregistrement `staff` |
| `organizationMembership.updated` | Met à jour `staff.role` |
| `organizationMembership.deleted` | Désactive `staff.actif = false` |

**Vérification** : Signature Svix via `CLERK_WEBHOOK_SECRET`.

### `POST /api/webhooks/stripe`

Reçoit les événements Stripe pour gérer les abonnements.

| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | Active l'abonnement, met à jour le plan |
| `customer.subscription.updated` | Met à jour `subscription_status` |
| `customer.subscription.deleted` | Remet le plan à `trial` |
| `invoice.payment_failed` | Met le statut à `past_due` |

**Vérification** : Signature Stripe via `STRIPE_WEBHOOK_SECRET`.

### `POST /api/caisse/webhook`

Reçoit les événements de la caisse enregistreuse (POS).

**Vérification** : Header `X-Webhook-Secret` comparé à `config_caisse.webhook_secret`.

---

## Server Actions

Toutes les Server Actions sont dans `lib/actions/`. Elles sont appelées directement depuis les composants React.

### Stocks (`stocks.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `creerProduit` | `(data) → void` | Crée un nouveau produit |
| `modifierProduit` | `(id, data) → void` | Modifie un produit existant |
| `archiverProduit` | `(id) → void` | Archive un produit (actif=false) |
| `ajouterMouvement` | `(data) → void` | Ajoute un mouvement de stock (entree/sortie/perte) |
| `enregistrerInventaire` | `(data) → void` | Enregistre un inventaire rapide |
| `supprimerProduit` | `(id) → void` | Supprime définitivement un produit |

### Commandes & Fournisseurs (`commandes.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `creerFournisseur` | `(data) → void` | Crée un fournisseur |
| `modifierFournisseur` | `(id, data) → void` | Modifie un fournisseur |
| `supprimerFournisseur` | `(id) → void` | Supprime un fournisseur |
| `lierProduitFournisseur` | `(data) → void` | Lie un produit à un fournisseur |
| `creerCommande` | `(data) → void` | Crée une commande |
| `envoyerCommande` | `(id) → void` | Passe le statut à "envoyée" |
| `receptionnerLivraison` | `(data) → void` | Réceptionne une livraison (+ écarts, prix) |

### Recettes (`recettes.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `creerRecette` | `(data) → void` | Crée une recette |
| `modifierRecette` | `(id, data) → void` | Modifie une recette |
| `ajouterIngredient` | `(data) → void` | Ajoute un ingrédient à une recette |
| `supprimerIngredient` | `(id, recetteId) → void` | Supprime un ingrédient |
| `recalculerCouts` | `(recetteId) → void` | Recalcule le coût matière et food cost |
| `archiverRecette` | `(id) → void` | Archive une recette |
| `supprimerRecette` | `(id) → void` | Supprime une recette |

### Cave à vins (`cave.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `creerVin` | `(data) → void` | Ajoute un vin à la cave |
| `modifierVin` | `(id, data) → void` | Modifie un vin |
| `ajouterMouvementCave` | `(data) → void` | Entrée/sortie de bouteilles |
| `archiverVin` | `(id) → void` | Archive un vin |

### Planning (`planning.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `creerEmploye` | `(data) → void` | Crée un employé |
| `modifierEmploye` | `(id, data) → void` | Modifie un employé |
| `archiverEmploye` | `(id) → void` | Archive un employé |
| `creerCreneau` | `(data) → void` | Crée un créneau horaire |
| `modifierStatutCreneau` | `(id, statut) → void` | Change le statut d'un créneau |
| `supprimerCreneau` | `(id) → void` | Supprime un créneau |
| `dupliquerSemaine` | `(dateDebut, dateFin, offset) → void` | Duplique une semaine de planning |

### Équipe & Paie (`equipe.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `creerFichePaie` | `(data) → void` | Crée une fiche de paie |
| `validerFichePaie` | `(id) → void` | Valide une fiche de paie |
| `marquerPaye` | `(id) → void` | Marque une fiche comme payée |
| `genererFichesDepuisPlanning` | `(mois) → void` | Génère les fiches à partir du planning |

### HACCP (`haccp.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `initTemplatesDefaut` | `() → void` | Initialise les templates HACCP par défaut |
| `creerReleve` | `(data) → void` | Crée un relevé de contrôle |
| `creerTemplate` | `(data) → void` | Crée un template de contrôle |
| `supprimerTemplate` | `(id) → void` | Supprime un template |

### Inventaire (`inventaire.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `creerSessionInventaire` | `(data) → void` | Crée une session d'inventaire |
| `sauvegarderLigneInventaire` | `(data) → void` | Enregistre une ligne d'inventaire |
| `validerInventaire` | `(sessionId) → void` | Valide et applique les écarts |
| `annulerInventaire` | `(sessionId) → void` | Annule une session |

### Marges (`marges.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `sauvegarderObjectifs` | `(data) → void` | Sauvegarde les objectifs KPI du mois |
| `sauvegarderSnapshot` | `(data) → void` | Sauvegarde un snapshot food cost |

### Prévisions (`previsions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `sauvegarderPrevision` | `(data) → void` | Enregistre une prévision |
| `sauvegarderReel` | `(data) → void` | Enregistre les données réelles |

### Notifications (`notifications.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getNotifications` | `(limit?) → Notification[]` | Liste des notifications |
| `getUnreadCount` | `() → number` | Nombre de non-lues |
| `markAsRead` | `(notificationId) → void` | Marque une notification comme lue |
| `markAllAsRead` | `() → void` | Marque toutes comme lues |
| `getNotificationPreferences` | `() → Preferences` | Préférences notification |
| `updatePreference` | `(data) → void` | Met à jour une préférence |

### PIN Kiosque (`pin.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `setStaffPin` | `(staffId, pin) → void` | Définit le PIN d'un employé |
| `removeStaffPin` | `(staffId) → void` | Supprime le PIN |
| `authenticatePin` | `(orgId, staffId, pin) → Staff` | Auth PIN (avec staffId) |
| `authenticatePinKiosk` | `(orgId, pin) → Staff` | Auth PIN kiosque (scan all staff) |
| `validatePinSessionWithCheck` | `() → Session \| null` | Vérifie la session PIN |
| `logoutPin` | `() → void` | Déconnexion kiosque |
| `getStaffListForKiosk` | `(orgId) → Staff[]` | Liste des employés avec PIN |

### RBAC (`rbac.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getPermissionsForRole` | `(role) → Permissions` | Permissions d'un rôle |
| `getAllRolePermissions` | `() → AllPermissions` | Toutes les permissions |
| `updateRolePermissions` | `(data) → void` | Met à jour les permissions (patron only) |

### Retours Fournisseur (`retours.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `crierRetour` | `(data) → void` | Crée un retour fournisseur |
| `getRetours` | `() → Retour[]` | Liste des retours |
| `getRetourDetail` | `(retourId) → Retour` | Détail d'un retour |
| `majStatutRetour` | `(retourId, statut) → void` | Met à jour le statut |
| `envoyerRetour` | `(retourId) → void` | Marque comme envoyé |

### Historique Prix (`prix.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `enregistrerPrix` | `(data) → void` | Enregistre un prix |
| `getPrixHistorique` | `(produitId, limit?) → Prix[]` | Historique des prix d'un produit |
| `getAlertesHausse` | `(seuilPct?) → Alerte[]` | Alertes de hausse de prix |

### Lots & DLC (`lots.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `creerLot` | `(data) → void` | Crée un lot avec DLC/DLUO |
| `getLots` | `(produitId?) → Lot[]` | Liste des lots |
| `getLotsProchesExpiration` | `(joursAvant) → Lot[]` | Lots proches de l'expiration |
| `majStatutLot` | `(lotId, statut) → void` | Met à jour le statut (consomme/expire/jete) |

### Allergènes (`allergenes.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `calculerAllergenesRecette` | `(recetteId) → string[]` | Calcule les allergènes d'une recette |
| `updateProduitAllergenes` | `(produitId, allergenes) → void` | Met à jour les allergènes d'un produit |

### Réappro (`reorder.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getSuggestionsReappro` | `() → Suggestion[]` | Suggestions de réapprovisionnement |

### Score Fournisseur (`fournisseur-score.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `calculerScoreFournisseur` | `(fournisseurId) → Score` | Calcule le score de fiabilité |
| `getScoresFournisseurs` | `() → Score[]` | Scores de tous les fournisseurs |

### Bilan (`bilan.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getBilanJournee` | `(date) → BilanJournee` | Bilan complet de la journée |

### Multi-sites (`multi-sites.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getChildOrganizations` | `() → Org[]` | Organisations enfants |
| `linkChildOrganization` | `(childClerkOrgId) → void` | Lie une organisation enfant |
| `getConsolidatedKPIs` | `(mois) → KPIs` | KPIs consolidés multi-sites |
| `getComparaisonSites` | `(mois) → Comparaison` | Comparaison entre sites |

### Antifraud (`antifraud.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `sauvegarderConfigCaisse` | `(data) → void` | Configure la connexion caisse |
| `ajouterEventManuel` | `(data) → void` | Ajoute un événement manuel |

### Paramètres (`parametres.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `sauvegarderParametres` | `(data) → void` | Sauvegarde les paramètres |

### Reset (`reset.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `reinitialiserApplication` | `() → void` | Réinitialise toutes les données de l'organisation |

---

## Générateurs PDF (`lib/pdf/`)

| Fonction | Fichier | Description |
|----------|---------|-------------|
| `generateBilanJourneePDF` | `bilan-journee.ts` | PDF du bilan journalier |
| `generateBonRetourPDF` | `bon-retour.ts` | PDF du bon de retour fournisseur |
| `generateFicheAllergenesPDF` | `fiche-allergenes.ts` | PDF des fiches allergènes |

Toutes retournent un `Uint8Array` (contenu PDF).

---

## Schémas de validation (`lib/validations/`)

Chaque domaine a un fichier de schémas Zod correspondant :

| Fichier | Schémas principaux |
|---------|-------------------|
| `stocks.ts` | creerProduitSchema, modifierProduitSchema, ajouterMouvementSchema |
| `commandes.ts` | creerFournisseurSchema, creerCommandeSchema, receptionnerLivraisonSchema |
| `recettes.ts` | creerRecetteSchema, ajouterIngredientSchema |
| `cave.ts` | creerVinSchema, mouvementCaveSchema |
| `planning.ts` | creerEmployeSchema, creerCreneauSchema |
| `inventaire.ts` | creerSessionSchema, ligneInventaireSchema |
| `marges.ts` | objectifsSchema, snapshotSchema |
| `previsions-actions.ts` | previsionSchema, reelSchema |
| `parametres.ts` | parametresSchema |
| `pin.ts` | setPinSchema, authenticatePinSchema |
| `rbac.ts` | updateRolePermissionsSchema |
| `retours.ts` | creerRetourSchema, majStatutSchema |
| `antifraud.ts` | configCaisseSchema, eventManuelSchema |
| `bilan.ts` | bilanDateSchema |
