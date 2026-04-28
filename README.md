# GoodLink

> SaaS « link in bio » à la Linktree, propulsé par Next.js 15 + Supabase. Multi-pages, types de liens, statistiques, QR codes.

Un compte = jusqu'à 20 pages publiques (chacune avec son `agoodlink.net/<pseudo>`), édition complète (avatar, bio, fond, couleurs), 3 types de liens (lien, séparateur de section, social avec icône auto-générée), statistiques de vues / clics, et générateur de QR codes indépendant.

---

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions, React 19)
- **TypeScript** strict
- **Tailwind CSS** + composants type shadcn/ui (style « new-york »)
- **Supabase** : Postgres + Auth + Storage (`@supabase/ssr` ≥ 0.10)
- **Validation** : Zod (avec discriminated unions pour les types de liens)
- **Drag-and-drop** : `@dnd-kit`
- **Compression d'image** : `browser-image-compression` (Web Worker, sortie WebP)
- **QR codes** : `qr-code-styling` (rendu canvas/svg, download PNG/SVG)
- **Toasts** : `sonner`
- **Icônes** : `lucide-react` + 2 SVG inline (TikTok, Spotify)

---

## Démarrage rapide

### 1. Cloner et installer

```bash
git clone <ton-repo> goodlink
cd goodlink
npm install
```

### 2. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com), crée un nouveau projet.
2. **Project Settings → API** → note `Project URL` et `anon public key`.

### 3. Initialiser le schéma v2

1. Ouvre **SQL Editor → New query** dans Supabase.
2. Colle l'intégralité de [`supabase/schema.sql`](supabase/schema.sql) → **Run**.

Le script crée :
- `pages` (1 user → N pages, max 20 par compte free)
- `links` (avec colonne `type` ∈ {`link`, `header`, `social`} et `platform`)
- `page_views`, `link_clicks` (analytics)
- `qr_codes` (générateur indépendant)
- Triggers `set_updated_at` + `handle_new_user` (1ère page créée auto au signup)
- RLS policies (lecture publique + écriture par owner)
- Buckets Storage `avatars` + `backgrounds`

> Le script est **idempotent** — peut être ré-exécuté sans rien casser. La 1re exécution drop les anciennes tables `profiles`/`links` v1 si présentes.

### 4. (Recommandé en dev) Désactive `Confirm email`

*Authentication → Providers → Email → décoche `Confirm email`*. L'inscription ouvre une session immédiate.

### 5. Variables d'environnement

`.env.local` à la racine :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Lancer en local

```bash
npm run dev
```

→ [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de dev |
| `npm run build` | Build production |
| `npm run start` | Démarre le build prod |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## Architecture

```
app/
  (auth)/                Layout + login + signup (group route)
  auth/                  Callbacks Supabase (callback, signout)
  dashboard/
    page.tsx             Liste des pages (PagesGrid + PageCard + NewPageForm)
    layout.tsx           Layout + nav top (Pages / QR codes / Déconnexion)
    actions.ts           Server Actions pages + liens
    pages/[id]/page.tsx  Éditeur d'une page (DashboardEditor)
    qr/
      page.tsx           Liste/CRUD des QR codes
      actions.ts         Server Actions QR
      _components/       QrList, QrCard, QrForm, QrPreview
    _components/         AnalyticsCard, ProfileSection, AppearanceSection,
                         LinksSection, LinkItem, AddLinkForm, AvatarUpload,
                         BackgroundUpload, LivePreview, DashboardNav,
                         PagesGrid, PageCard, NewPageForm, DashboardEditor
  [username]/            Page publique + Open Graph + 404 + tracking views
  r/[id]/route.ts        Tracker de clic + redirect 302
  _components/           Landing-only (claim-form)
  layout.tsx             Root layout (lang="fr", Inter, Toaster sonner)
  page.tsx               Landing
  not-found.tsx          404 globale
components/
  ui/                    Primitives (button, input, label, card, slider, ...)
  public-profile.tsx     Rendu partagé preview ↔ page publique (3 types liens)
  phone-frame.tsx        Mockup iPhone réutilisable
  social-icon.tsx        Icônes 8 plateformes sociales
  site-header.tsx        Header de la landing
lib/
  supabase/              Clients (browser, server, middleware)
  validations/           Schémas Zod (auth, page, links, qr)
  hooks/                 use-debounce
  page.ts                getPageByUsername (cache React)
  social-platforms.ts    Métadonnées 8 plateformes (label, color, urlExample)
  image-compression.ts   compressImage (Web Worker → WebP)
  constants.ts           Quotas, regex, longueurs, defaults
  form.ts                ZodError → field errors, humanize Supabase auth
  utils.ts               cn()
types/
  database.ts            Types Supabase v2 (pages, links, page_views,
                         link_clicks, qr_codes)
supabase/
  schema.sql             Schéma + triggers + RLS + storage (idempotent)
middleware.ts            Refresh session sur toutes les routes non-statiques
```

### Décisions clés

- **Multi-page** : 1 user = N pages (max 20). Les pages ont chacune leur `username` unique global. La 1re page est créée par le trigger Postgres `handle_new_user` à partir de `raw_user_meta_data.username`.
- **Types de liens** (validations Zod en discriminated union) :
  - `link` — bouton classique avec URL
  - `header` — séparateur de section, sans URL
  - `social` — bouton avec icône de plateforme (instagram, tiktok, twitter, youtube, github, linkedin, facebook, spotify)
- **Statistiques** :
  - Vues : insert dans `page_views` à chaque rendu de la page publique
  - Clics : passage par `/r/<link_id>` qui log dans `link_clicks` puis 302 vers l'URL réelle
  - RLS : insertion publique autorisée, lecture limitée à l'owner
- **QR codes** : feature séparée des pages, max 50 par compte. Génération via `qr-code-styling` côté client, download PNG ou SVG.
- **Auto-save dashboard** : champs profil debouncés (600 ms). Avatar/background ont leurs propres actions instantanées. CRUD liens en optimistic UI avec rollback.
- **Storage** : 2 buckets publics. Path = `<ownerId>/<pageId>/avatar-<ts>.webp` — RLS storage exige que le 1er folder soit `auth.uid()::text`.
- **Sécurité URL** : URLs des liens validées via `new URL()` + restriction http/https (pas de `javascript:` / `data:`). URLs avatars/backgrounds doivent être servies par `*.supabase.co`.
- **Username canonique** : `/Pierre` redirige vers `/pierre` (un seul URL indexé). Format DB-enforced via `^[a-z0-9-]{3,20}$`.

---

## Déploiement Vercel

1. Pousse sur GitHub.
2. [vercel.com](https://vercel.com) → **New Project** → importe le repo.
3. **Settings → Environment Variables** : ajoute les 3 vars (Production / Preview / Development).
4. Premier deploy → URL `xxx.vercel.app`. Mets à jour `NEXT_PUBLIC_SITE_URL` avec cette URL → Redeploy.
5. **Supabase → Authentication → URL Configuration** :
   - Site URL : ton URL Vercel
   - Redirect URLs : `https://<url>/auth/callback`
6. (Optionnel) Domaine custom : Vercel → Settings → Domains → ajouter → pointer les nameservers chez ton registrar (Hostinger, OVH, etc.) sur `ns1.vercel-dns.com` / `ns2.vercel-dns.com`.

---

## Quotas du plan free

| Ressource | Limite |
|---|---|
| Pages GoodLink par compte | **20** |
| QR codes par compte | **50** |
| Liens par page | illimité |
| Tailles d'image upload | 10 Mo input → ≤ 1.5 Mo après compression WebP |

---

## Limitations connues / TODO

- Anciens fichiers d'avatars/backgrounds non nettoyés à chaque change.
- Comptes signup non confirmés squattent leur username (cleanup à prévoir).
- Pas de soft-delete (suppression définitive).
- Pas d'agrégation temporelle des stats (uniquement totaux cumulés).
- Pas d'OAuth (Google, Apple) — facile à activer côté Supabase + boutons.
- Mobile : pas de "preview sheet" dans l'éditeur — utiliser le bouton « Voir cette page ».

### Vulnérabilités acceptées

`npm audit` peut signaler des alertes `postcss <8.5.10` bundlé en interne par `next` — exploitable seulement si on injecte du CSS contrôlé par l'utilisateur dans postcss au moment du build. **Aucun chemin d'attaque dans ce projet** (postcss tourne au build sur du CSS statique).
