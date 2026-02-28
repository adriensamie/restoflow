# RestoFlow

**SaaS de gestion complète pour restaurants** — Stocks, commandes, recettes, HACCP, planning, cave, marges, facturation, IA embarquée.

RestoFlow est une application tout-en-un qui couvre l'ensemble des besoins opérationnels d'un restaurant : gestion des stocks et pertes, commandes fournisseurs, réception de livraisons, recettes et food cost, planning du personnel, conformité HACCP, cave à vins, analyse des marges, prévisions IA, et bien plus.

<!-- ![RestoFlow Dashboard](./public/screenshot.png) -->

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com), [Lucide Icons](https://lucide.dev), [Recharts](https://recharts.org) |
| Auth | [Clerk](https://clerk.com) (multi-tenant, organisations) |
| Base de données | [Supabase](https://supabase.com) (PostgreSQL + RLS via Clerk JWT) |
| Paiement | [Stripe](https://stripe.com) (abonnements, portail client) |
| IA | [Anthropic Claude Haiku 4.5](https://anthropic.com) (assistant, OCR, prévisions) |
| Validation | [Zod 4](https://zod.dev) |
| PDF | [jsPDF](https://github.com/parallax/jsPDF) |
| Notifications | [web-push](https://github.com/nicholasgcoles/web-push), [Resend](https://resend.com) |
| Auth kiosque | [jose](https://github.com/panva/jose) (JWT), [bcryptjs](https://github.com/nickvdyck/bcrypt.js) |

---

## Installation rapide

```bash
# 1. Cloner le repo
git clone https://github.com/votre-org/restoflow-app.git
cd restoflow-app

# 2. Installer les dépendances
npm install

# 3. Copier et remplir les variables d'environnement
cp .env.example .env.local
# → Editer .env.local avec vos clés (voir tableau ci-dessous)

# 4. Lancer le serveur de développement (Turbopack)
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur dev avec Turbopack |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Lint ESLint |

---

## Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase (publique) | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase (webhooks uniquement) | Oui |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk | Oui |
| `CLERK_SECRET_KEY` | Clé secrète Clerk | Oui |
| `CLERK_WEBHOOK_SECRET` | Secret pour les webhooks Clerk (Svix) | Oui |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | URL de connexion (`/sign-in`) | Oui |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | URL d'inscription (`/sign-up`) | Oui |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirection post-login (`/dashboard`) | Oui |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirection post-signup (`/onboarding`) | Oui |
| `NEXT_PUBLIC_APP_URL` | URL de l'app (`http://localhost:3000`) | Oui |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | Oui |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | Oui |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | Oui |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (Claude) | Oui |
| `RESEND_API_KEY` | Clé API Resend (emails) | Pro |
| `PIN_SESSION_SECRET` | Secret JWT pour sessions PIN kiosque | Pro |
| `VAPID_PUBLIC_KEY` | Clé publique VAPID (push notifications) | Pro |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID (push notifications) | Pro |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique VAPID (client-side) | Pro |
| `CRON_SECRET` | Secret pour sécuriser les endpoints cron | Prod |

---

## Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────────────────┐
│  Client   │────▸│  Next.js 16  │────▸│  Supabase (Postgres) │
│  React 19 │     │  App Router  │     │  RLS via Clerk JWT   │
└──────────┘     └──────┬───────┘     └──────────────────────┘
                        │
               ┌────────┼────────┐
               │        │        │
          ┌────▾───┐ ┌──▾──┐ ┌──▾─────┐
          │ Clerk  │ │ AI  │ │ Stripe │
          │ Auth   │ │Claude│ │Billing │
          └────────┘ └─────┘ └────────┘
```

**Flow d'authentification :**
1. L'utilisateur se connecte via **Clerk** (email/Google/etc.)
2. Clerk émet un **JWT** avec le `org_id` dans un template `supabase`
3. Le JWT est injecté dans les requêtes Supabase via le header `Authorization`
4. Les **politiques RLS** de Supabase isolent les données par `organization_id`

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour la documentation technique complète.

---

## Structure du projet

```
restoflow-app/
├── app/                        # Pages Next.js (App Router)
│   ├── (app)/                  # Routes authentifiées (24 pages)
│   │   ├── dashboard/          # Tableau de bord
│   │   ├── stocks/             # Gestion des stocks
│   │   ├── commandes/          # Commandes fournisseurs
│   │   ├── livraisons/         # Réception livraisons
│   │   ├── recettes/           # Recettes & food cost
│   │   ├── cave/               # Cave à vins
│   │   ├── planning/           # Planning du personnel
│   │   ├── equipe/             # Gestion d'équipe
│   │   ├── hygiene/            # Contrôles HACCP
│   │   ├── inventaire/         # Sessions d'inventaire
│   │   ├── marges/             # Analyse des marges
│   │   ├── previsions/         # Prévisions IA
│   │   ├── assistant/          # Assistant IA chat
│   │   ├── bilan/              # Bilan journalier
│   │   ├── alertes/            # Centre d'alertes
│   │   ├── billing/            # Abonnement & facturation
│   │   └── ...                 # + fournisseurs, pertes, fiches-paie, etc.
│   ├── (auth)/                 # Pages Clerk (sign-in, sign-up)
│   ├── api/                    # Routes API (17 endpoints)
│   │   ├── ia/                 # 7 endpoints IA (Claude Haiku)
│   │   ├── billing/            # Checkout & portail Stripe
│   │   ├── webhooks/           # Clerk & Stripe webhooks
│   │   ├── cron/               # Tâches planifiées (DLC, digest)
│   │   └── ...
│   └── kiosk/                  # Interface kiosque (PIN auth)
├── components/                 # Composants React (21 dossiers)
├── lib/                        # Logique métier
│   ├── actions/                # 23 fichiers de Server Actions
│   ├── validations/            # 14 fichiers de schémas Zod
│   ├── pdf/                    # 3 générateurs PDF
│   ├── supabase/               # Clients Supabase (server + admin)
│   ├── auth.ts                 # Résolution Clerk → org/staff
│   ├── rbac.ts                 # Contrôle d'accès par rôle
│   ├── pin-auth.ts             # Sessions PIN (JWT + bcrypt)
│   ├── plans.ts                # Feature gating par plan
│   ├── billing.ts              # Logique facturation
│   ├── notifications.ts        # Push, email, in-app
│   ├── conversions.ts          # Conversions d'unités
│   └── ...
├── types/
│   └── database.ts             # Types Supabase (33 tables)
└── public/
    └── sw.js                   # Service Worker (push)
```

---

## Plans & Feature Gating

RestoFlow utilise un système de plans à 4 niveaux avec gating par fonctionnalité :

| Fonctionnalité | Trial | Starter (49€) | Pro (99€) | Enterprise (199€) |
|----------------|:-----:|:-------------:|:---------:|:-----------------:|
| Stocks, commandes, recettes, planning, HACCP, marges | ✓ | ✓ | ✓ | ✓ |
| Allergènes, conversions d'unités | ✓ | ✓ | ✓ | ✓ |
| RBAC configurable, retours fournisseur | | ✓ | ✓ | ✓ |
| Evolution prix, DLC/DLUO, réappro, scoring | | ✓ | ✓ | ✓ |
| Bilan journalier | | ✓ | ✓ | ✓ |
| PIN kiosque, notifications push/email | | | ✓ | ✓ |
| Alertes prix, bilan PDF | | | ✓ | ✓ |
| IA : prévisions, assistant, OCR, analyse | | | ✓ | ✓ |
| Cave à vins, antifraud, fiches de paie | | | ✓ | ✓ |
| Multi-sites, accès API | | | | ✓ |

L'ordre de vérification est : **Plan** → **Rôle** → **Route/Action**.

---

## Déploiement

### Vercel (recommandé)

1. Connecter le repo GitHub à [Vercel](https://vercel.com)
2. Configurer toutes les variables d'environnement dans les settings du projet
3. Le build et le déploiement sont automatiques à chaque push

### Cron jobs

Configurer dans `vercel.json` :
```json
{
  "crons": [
    { "path": "/api/cron/check-dlc", "schedule": "0 6 * * *" },
    { "path": "/api/cron/digest-email", "schedule": "0 7 * * *" }
  ]
}
```

### Supabase

- Appliquer les migrations SQL
- Configurer le JWT template `supabase` dans Clerk
- Activer les politiques RLS sur toutes les tables

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | Multi-tenancy, RBAC, PIN, notifications, IA |
| [API](docs/API.md) | Routes API, Server Actions, Webhooks |
| [Base de données](docs/DATABASE.md) | 33 tables, vues, fonctions, RLS |

---

## Licence

Propriétaire — Tous droits réservés.
