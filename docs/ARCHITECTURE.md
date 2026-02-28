# Architecture technique — RestoFlow

Documentation technique détaillée de l'architecture de RestoFlow pour développeurs.

---

## Table des matières

- [Multi-tenancy](#multi-tenancy)
- [RBAC (Contrôle d'accès par rôle)](#rbac)
- [Feature Gating (Plans)](#feature-gating)
- [PIN Kiosque](#pin-kiosque)
- [Server Actions](#server-actions)
- [Notifications](#notifications)
- [Intégration IA](#intégration-ia)
- [Conversions d'unités](#conversions-dunités)
- [Middleware](#middleware)
- [Rate Limiting](#rate-limiting)

---

## Multi-tenancy

RestoFlow est multi-tenant via les organisations Clerk. Chaque restaurant = 1 organisation Clerk = 1 ligne dans `organizations`.

### Flow d'authentification

```
Utilisateur → Clerk (login) → JWT avec org_id
                                    │
                                    ▼
                    Next.js Server Action / API Route
                                    │
                          getOrgUUID() / getCurrentStaff()
                                    │
                                    ▼
                    Supabase (JWT injecté dans Authorization header)
                                    │
                              RLS policy :
                    organization_id = get_org_id()
```

### Clerk → Supabase

1. **Clerk JWT Template** (`supabase`) — contient `org_id` et `user_id` dans les claims
2. **`lib/supabase/server.ts`** — crée un client Supabase SSR avec le token Clerk :
   ```typescript
   const token = await getToken({ template: 'supabase' })
   // Injecté dans le header Authorization: Bearer <token>
   ```
3. **Fonctions SQL Supabase** :
   - `get_org_id()` — extrait `org_id` du JWT (`auth.jwt() -> 'org_id'`)
   - `get_clerk_user_id()` — extrait `user_id` du JWT

### Client Admin (bypass RLS)

`lib/supabase/admin.ts` — client avec `SUPABASE_SERVICE_ROLE_KEY` pour les webhooks Clerk/Stripe uniquement. Contourne le RLS.

### Résolution utilisateur

`lib/auth.ts` fournit :

| Fonction | Rôle |
|----------|------|
| `getOrgUUID()` | Clerk `orgId` → UUID de la table `organizations` |
| `getCurrentStaff()` | Retourne `{ orgId, staffId, role, nom, prenom }` |

**Fallback patron** : Si aucun enregistrement `staff` n'existe mais que le Clerk `orgRole === 'org:admin'`, le rôle `patron` est accordé automatiquement.

---

## RBAC

RestoFlow implémente 4 rôles avec un système de permissions configurable par organisation.

### Rôles

| Rôle | Description |
|------|-------------|
| `patron` | Propriétaire — accès total (short-circuit) |
| `manager` | Responsable — accès étendu |
| `employe` | Employé — accès limité |
| `livreur` | Livreur — accès livraisons/stocks |

### Short-circuit patron

Toute vérification RBAC retourne `true` immédiatement pour le rôle `patron`. Pas de requête DB.

### Permissions par défaut

Si aucune configuration custom n'existe dans `role_permissions`, les défauts s'appliquent :

**Routes :**
```
patron  : ['*']
manager : ['/dashboard', '/alertes', '/stocks', '/pertes', '/commandes',
           '/livraisons', '/cave', '/inventaire', '/marges', '/recettes',
           '/previsions', '/equipe', '/planning', '/fiches-paie',
           '/hygiene', '/assistant', '/bilan']
employe : ['/dashboard', '/stocks', '/planning', '/hygiene']
livreur : ['/dashboard', '/livraisons', '/stocks']
```

**Actions :**
```
patron  : ['*']
manager : ['stocks.write', 'commandes.write', 'livraisons.write',
           'recettes.write', 'inventaire.write', 'haccp.write',
           'equipe.read', 'planning.write', 'retours.write']
employe : ['stocks.read', 'planning.read', 'haccp.write']
livreur : ['livraisons.write', 'stocks.read']
```

### Configuration custom

Le patron peut personnaliser les permissions via `/parametres` (Roles Config). Les permissions sont stockées dans la table `role_permissions` (clé unique : `organization_id` + `role`).

### Fonctions RBAC (`lib/rbac.ts`)

| Fonction | Description |
|----------|-------------|
| `getCurrentStaff()` | Résolution staff cachée (`React.cache()`) |
| `canAccessRoute(route)` | Vérifie l'accès à une route (match exact ou préfixe) |
| `getAllowedRoutes(role, orgId)` | Liste des routes autorisées |
| `requireRole(roles[])` | Throw si rôle insuffisant |

### Ordre de vérification

```
1. requireAccess(feature)    → Plan autorise la fonctionnalité ?
2. requireRole(roles[])      → Rôle suffisant ?
3. canAccessRoute(route)     → Route accessible ?
```

---

## Feature Gating

Chaque fonctionnalité est associée à un plan minimum. Le gating est vérifié **avant** le RBAC.

### `lib/plans.ts` — Feature Matrix

```typescript
type Plan = 'trial' | 'starter' | 'pro' | 'enterprise'
```

| Plan | Prix | Features ajoutées |
|------|------|-------------------|
| `trial` | Gratuit | stocks, commandes, recettes, planning, HACCP, marges, fournisseurs, inventaire, alertes, allergenes, conversions_unites |
| `starter` | 49€/mois | + rbac_config, quick_switch, retour_fournisseur, evolution_prix, dlc_tracking, suggestions_reappro, scoring_fournisseur, bilan_journee |
| `pro` | 99€/mois | + previsions_ia, assistant_ia, antifraud, cave, import_bl, fiches_paie, integrations, pin_kiosque, notifs_push_email, alertes_prix, bilan_pdf |
| `enterprise` | 199€/mois | + multi_sites, api_access |

### `lib/billing.ts` — Vérification d'accès

| Fonction | Description |
|----------|-------------|
| `getOrgBilling()` | Retourne `{ plan, trialEndsAt, isTrialExpired, daysLeft, ... }` |
| `hasAccess(feature)` | `boolean` — feature disponible sur le plan actuel ? |
| `requireAccess(feature)` | Throw si non autorisé |
| `checkAccess(feature)` | Retourne `{ allowed, plan }` pour l'UX |

---

## PIN Kiosque

Le mode kiosque permet aux employés de s'authentifier via un code PIN à 4 chiffres sans compte Clerk.

### Architecture

```
Employé → PIN Pad → authenticatePinKiosk()
                           │
                    bcryptjs.compare(pin, hash)
                           │
                    createPinSession() → JWT (jose, HS256)
                           │
                    Cookie httpOnly "restoflow-pin-session"
                           │
                    Validé côté serveur via validatePinSession()
```

### Détails

| Aspect | Valeur |
|--------|--------|
| Hash | bcryptjs, coût 12 |
| Token | JWT HS256 via `jose` |
| TTL | 8 heures |
| Cookie | `restoflow-pin-session`, httpOnly, secure (prod), sameSite lax |
| Secret | `PIN_SESSION_SECRET` (env var) |
| Rate limit | 5 tentatives / 5 minutes par staff ou par org (kiosque) |

### Payload JWT

```typescript
{
  staffId: string
  orgId: string
  role: string
  nom: string
  prenom: string
  pinChangedAt: string | null  // Invalidation si PIN changé
}
```

### Invalidation

Si `staff.pin_changed_at` a changé depuis la création du token, la session est invalidée automatiquement.

---

## Server Actions

Toutes les mutations de données passent par des Server Actions Next.js dans `lib/actions/`.

### Pattern standard

Chaque action suit ce pattern :

```typescript
'use server'

export async function creerProduit(data: CreerProduitInput) {
  // 1. Validation — Zod schema
  const parsed = creerProduitSchema.parse(data)

  // 2. Auth — Résolution org + staff
  const orgId = await getOrgUUID()

  // 3. Feature gate (si applicable)
  await requireAccess('stocks')

  // 4. Query — Supabase avec scope org
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('produits')
    .insert({ ...parsed, organization_id: orgId })

  // 5. Error check
  if (error) throw new Error('Erreur lors de la création')

  // 6. Side effects — Notifications, prix, etc.
  await dispatchNotification({ ... })

  // 7. Revalidate — Cache invalidation
  revalidatePath('/stocks')
}
```

### Conventions

- **Scope org** : Toute requête inclut `.eq('organization_id', orgId)`
- **Cast `as any`** : Contournement des types Supabase non résolus (jusqu'à `supabase gen types typescript`)
- **Error check** : Chaque mutation vérifie `{ error }` et throw en cas d'échec
- **Revalidation** : `revalidatePath()` appelé après chaque mutation

### Fichiers d'actions (23)

| Fichier | Domaine | Actions principales |
|---------|---------|---------------------|
| `stocks.ts` | Produits & mouvements | creerProduit, modifierProduit, ajouterMouvement |
| `commandes.ts` | Commandes & fournisseurs | creerCommande, envoyerCommande, receptionnerLivraison |
| `recettes.ts` | Recettes & coûts | creerRecette, ajouterIngredient, recalculerCouts |
| `cave.ts` | Cave à vins | creerVin, ajouterMouvementCave |
| `planning.ts` | Planning | creerEmploye, creerCreneau, dupliquerSemaine |
| `equipe.ts` | Paie | creerFichePaie, genererFichesDepuisPlanning |
| `haccp.ts` | HACCP | initTemplatesDefaut, creerReleve, creerTemplate |
| `inventaire.ts` | Inventaire | creerSessionInventaire, validerInventaire |
| `marges.ts` | Marges | sauvegarderObjectifs, sauvegarderSnapshot |
| `previsions.ts` | Prévisions | sauvegarderPrevision, sauvegarderReel |
| `notifications.ts` | Notifications | getNotifications, markAsRead, updatePreference |
| `pin.ts` | PIN kiosque | setStaffPin, authenticatePin, authenticatePinKiosk |
| `rbac.ts` | Permissions | getAllRolePermissions, updateRolePermissions |
| `retours.ts` | Retours fournisseur | crierRetour, envoyerRetour, majStatutRetour |
| `prix.ts` | Historique prix | enregistrerPrix, getPrixHistorique, getAlertesHausse |
| `lots.ts` | Lots & DLC | creerLot, getLotsProchesExpiration, majStatutLot |
| `allergenes.ts` | Allergènes | calculerAllergenesRecette, updateProduitAllergenes |
| `reorder.ts` | Réappro | getSuggestionsReappro |
| `fournisseur-score.ts` | Score fournisseur | calculerScoreFournisseur, getScoresFournisseurs |
| `bilan.ts` | Bilan journalier | getBilanJournee |
| `multi-sites.ts` | Multi-sites | getConsolidatedKPIs, getComparaisonSites |
| `antifraud.ts` | Antifraud caisse | sauvegarderConfigCaisse, ajouterEventManuel |
| `parametres.ts` | Paramètres | sauvegarderParametres |
| `reset.ts` | Reset | reinitialiserApplication |

---

## Notifications

RestoFlow supporte 3 canaux de notification : in-app, push, et email.

### Types de notifications

| Type | Déclencheur |
|------|-------------|
| `stock_critique` | Stock sous le seuil d'alerte |
| `ecart_livraison` | Écart quantité commandée vs reçue |
| `haccp_non_conforme` | Relevé HACCP hors normes |
| `annulation_suspecte` | Annulation détectée en caisse |
| `hausse_prix` | Variation prix > 10% |
| `dlc_proche` | DLC/DLUO proche (cron quotidien) |
| `retour_statut` | Changement statut retour fournisseur |
| `commande_statut` | Changement statut commande |
| `info` | Notification informative |

### Flow de dispatch

```
Événement métier → dispatchNotification()
                          │
                   Lire notification_preferences
                   (org + staff + type)
                          │
                   Construire canaux :
                   [in_app] + [web_push?] + [email?]
                          │
                   createNotification()
                          │
               ┌──────────┼──────────┐
               │          │          │
          INSERT DB   web-push   Resend
          (notifications)         (email)
```

### Configuration VAPID

```typescript
webpush.setVapidDetails(
  'mailto:contact@restoflow.fr',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)
```

Le Service Worker (`public/sw.js`) gère la réception côté client. Les souscriptions push sont stockées dans `push_subscriptions`.

---

## Intégration IA

RestoFlow utilise **Claude Haiku 4.5** (Anthropic) pour 7 fonctionnalités IA, toutes accessibles via des routes API sous `/api/ia/`.

### Endpoints IA

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ia/assistant` | POST | Assistant chat streaming — répond aux questions sur les données du restaurant |
| `/api/ia/analyser-bl` | POST | OCR de bons de livraison — extrait fournisseur, produits, quantités, prix |
| `/api/ia/analyser-fiche` | POST | Analyse de fiches techniques recettes — extrait ingrédients et étapes |
| `/api/ia/analyser-photo-produit` | POST | Identification de produits à partir de photos |
| `/api/ia/analyser-photo-recette` | POST | Extraction d'informations de recette depuis une photo |
| `/api/ia/analyser-produit` | POST | Enrichissement données produit (catégorie, allergènes, unité) |
| `/api/ia/previsions` | POST | Prévisions de fréquentation et CA basées sur l'historique |

### Pattern des routes IA

```typescript
export async function POST(req: Request) {
  // 1. Auth — Vérifier l'utilisateur Clerk
  const { userId, orgId } = await auth()

  // 2. Rate limit
  const rl = await withRateLimit(...)

  // 3. Feature gate
  await requireAccess('assistant_ia')

  // 4. Parse body
  const body = await req.json()

  // 5. Appel Claude
  const anthropic = new Anthropic()
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [...]
  })

  // 6. Retourner la réponse (ou stream)
  return Response.json({ result })
}
```

### Resend (emails)

Le client Resend est instancié **paresseusement** dans les API routes (pas au niveau module) pour éviter les erreurs de build si la clé API est absente.

---

## Conversions d'unités

`lib/conversions.ts` gère les conversions entre unités de poids, volume et pièces.

### Catégories d'unités

| Catégorie | Unités | Base |
|-----------|--------|------|
| `poids` | kg (1000g), g (1g), mg (0.001g) | gramme |
| `volume` | L (1000ml), cl (10ml), ml (1ml) | millilitre |
| `piece` | carton, piece, unite, botte, barquette | 1:1 |

### Fonctions

| Fonction | Description |
|----------|-------------|
| `convertUnits(value, from, to, facteur?)` | Conversion entre unités. Retourne `null` si impossible |
| `getAvailableUnits(category?)` | Liste des unités disponibles |
| `getUnitCategory(unit)` | Catégorie d'une unité |
| `formatConversion(value, from, to, facteur?)` | Format lisible : `"2.5 L"` |

### Conversion cross-catégorie

Pour convertir entre catégories (ex: kg → pièces), un `facteur_conversion` doit être défini dans `produit_fournisseur.facteur_conversion`.

---

## Middleware

`middleware.ts` protège les routes via Clerk.

### Routes publiques (bypass auth)

```
/                          Landing page
/sign-in(.*)               Clerk sign-in
/sign-up(.*)               Clerk sign-up
/api/webhooks/(.*)         Webhooks Clerk & Stripe
/api/caisse/webhook(.*)    Webhook caisse
/api/cron/(.*)             Tâches cron
/kiosk(.*)                 Interface kiosque
/cgu                       CGU
/confidentialite           Politique de confidentialité
```

### Logique

1. Si pas de `userId` → redirect `/sign-in`
2. Si pas de `orgId` (et pas sur `/onboarding`) → redirect `/onboarding`
3. Sinon → accès autorisé

---

## Rate Limiting

### API Rate Limiting (`lib/api-rate-limit.ts`)

Wrapper pour les routes API :
```typescript
withRateLimit(handler, {
  maxRequests: 20,
  windowMs: 60_000,
  prefix: 'ia-assistant'
})
```

Clé : `userId` (si authentifié) ou IP. Retourne HTTP 429 avec header `Retry-After`.

### In-Memory Rate Limiting (`lib/rate-limit.ts`)

Pour les opérations sensibles (PIN brute force) :
```typescript
checkRateLimit(`pin:${staffId}`, 5, 5 * 60 * 1000)
// → { allowed: boolean, remaining: number, resetAt: number }
```

Nettoyage automatique toutes les 5 minutes.
