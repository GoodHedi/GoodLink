# GoodLink

> SaaS « link in bio » à la Linktree, propulsé par Next.js 14 + Supabase.

Un seul lien à partager qui regroupe l'avatar, la bio et tous les liens d'un utilisateur. Page publique sur `goodlink.tld/<pseudo>`, dashboard pour personnaliser, image de fond ou couleur unie, drag-and-drop des liens, aperçu live dans un mockup d'iPhone — toute l'interface en français.

---

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **React 19**
- **TypeScript** strict
- **Tailwind CSS** + composants type shadcn/ui (style « new-york »)
- **Supabase** : Postgres + Auth + Storage (`@supabase/ssr` ≥ 0.10)
- **Validation** : Zod
- **Drag-and-drop** : `@dnd-kit`
- **Compression d'image** : `browser-image-compression` (Web Worker, sortie WebP)
- **Toasts** : `sonner`
- **Icônes** : `lucide-react`

---

## Démarrage rapide

### 1. Cloner et installer

```bash
git clone <ton-repo> goodlink
cd goodlink
npm install
```

### 2. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com), crée un nouveau projet (région la plus proche).
2. Une fois la base prête, ouvre **Project Settings → API**.
3. Note les deux valeurs :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Initialiser le schéma

1. Ouvre **SQL Editor → New query**.
2. Copie tout le contenu de [`supabase/schema.sql`](supabase/schema.sql).
3. Lance **Run**.

Le script crée :
- les tables `profiles` et `links` (avec contraintes username, bio max 160, etc.)
- les triggers (`handle_new_user` pour l'auto-création du profil à l'inscription, `set_updated_at`)
- les **policies RLS** (lecture publique, écriture seulement par le propriétaire)
- les buckets Storage `avatars` et `backgrounds` (publics) et leurs policies (chaque user n'écrit que dans `<son uid>/...`)

> Le script est **idempotent** — tu peux le ré-exécuter sans rien casser.

### 4. (Optionnel) Configurer la confirmation d'email

Par défaut, Supabase exige une confirmation email avant la première connexion.

- **Garder activé** (recommandé en prod) : l'utilisateur reçoit un email avec un lien qui pointe vers `${NEXT_PUBLIC_SITE_URL}/auth/callback`. Le formulaire d'inscription affiche un écran « Vérifie ton email ».
- **Désactiver** (pratique en dev) : *Authentication → Providers → Email → décoche `Confirm email`*. L'inscription ouvre directement une session et redirige vers le dashboard.

> En prod, configure aussi un **SMTP custom** (*Authentication → Email Templates → Settings*) si tu veux dépasser les limites du SMTP gratuit Supabase.

### 5. Variables d'environnement

Crée un fichier `.env.local` à la racine en t'inspirant de [`.env.local.example`](.env.local.example) :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Lancer en local

```bash
npm run dev
```

Puis ouvre [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de dev (Next + Tailwind watch) |
| `npm run build` | Build production |
| `npm run start` | Démarre le build prod (après `build`) |
| `npm run lint` | ESLint via `next lint` |
| `npm run typecheck` | `tsc --noEmit` |

---

## Architecture

```
app/
  (auth)/                Layout + login + signup (group route, pas de segment URL)
  auth/                  Callbacks Supabase (callback OAuth/email, signout POST)
  dashboard/             Espace privé (Server Components + Server Actions)
  [username]/            Page publique + Open Graph dynamique + 404 propre
  _components/           Composants spécifiques à la landing (claim form)
  layout.tsx             Root layout (lang="fr", Inter, Toaster sonner)
  page.tsx               Landing
  not-found.tsx          404 globale
components/
  ui/                    Primitives (button, input, label, card, slider, ...)
  public-profile.tsx     Rendu partagé : preview dashboard ↔ page publique
  phone-frame.tsx        Mockup iPhone réutilisable (landing + dashboard preview)
  site-header.tsx        Header de la landing
lib/
  supabase/              Clients (browser, server, middleware)
  validations/           Schémas Zod (auth, profile, links)
  hooks/                 use-debounce
  profile.ts             getProfileByUsername (cache React, dédupe metadata + page)
  image-compression.ts   compressImage (Web Worker → WebP)
  constants.ts           RESERVED_USERNAMES, regex, longueurs, defaults
  form.ts                ZodError → field errors, humanize Supabase auth errors
  utils.ts               cn()
types/
  database.ts            Types Supabase (Database, Profile, Link, ...)
supabase/
  schema.sql             Tables + RLS + storage + triggers (idempotent)
middleware.ts            Refresh session sur toutes les routes non-statiques
```

### Décisions clés

- **Création du profil à l'inscription** : trigger Postgres `handle_new_user` qui lit `raw_user_meta_data.username` (passé via `signUp({ options: { data: { username } } })`). Atomique avec la création de `auth.users` — fonctionne que la confirmation email soit activée ou non.
- **RLS** : lecture publique sur `profiles` et `links`. Écriture limitée à `auth.uid() = id` (resp. `profile_id`) — toutes les Server Actions revérifient explicitement.
- **Storage** : 2 buckets publics. Convention de chemin `<uid>/...` enforced par les policies storage (`auth.uid()::text = (storage.foldername(name))[1]`).
- **Uploads** : compression côté client en Web Worker (`browser-image-compression` → WebP, max 1280px / 1 Mo) → upload direct vers Storage (le client browser auth a la permission grâce aux policies) → Server Action `setAvatarUrlAction(url)` pour persister l'URL.
- **Live preview** : un unique composant `<PublicProfile>` rend la même chose dans le mockup du dashboard et sur la page publique. Aucune divergence visuelle possible.
- **Sécurité URL** : les URLs des liens sont validées via `new URL()` côté Zod et limitées à `http`/`https` (pas de `javascript:`, `data:`...). Les URLs des avatars/backgrounds doivent être servies par `*.supabase.co`.
- **Username canonique** : `/Pierre` redirige vers `/pierre` (un seul URL indexé par profil). Le format est validé en DB par un check constraint `^[a-z0-9-]{3,20}$` + index unique.
- **Auto-save dashboard** : les champs profil (display_name, bio, couleur, voile sombre) sont sauvegardés automatiquement avec un debounce de 600 ms. Avatar et background ont leurs propres actions instantanées. CRUD des liens en optimistic UI avec rollback en cas d'échec.

---

## Déploiement Vercel

1. **Pousse le code** sur GitHub / GitLab / Bitbucket.
2. Sur [vercel.com](https://vercel.com) → **New Project** → importe le repo. Pas de réglage build à toucher (Next.js auto-détecté).
3. Dans **Settings → Environment Variables**, ajoute pour les trois environnements (Production / Preview / Development) :

   | Nom | Valeur |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
   | `NEXT_PUBLIC_SITE_URL` | `https://goodlink.tld` (en prod), `http://localhost:3000` (en dev) |

4. **Déploie** une première fois.
5. Une fois l'URL Vercel connue, retourne dans **Supabase → Authentication → URL Configuration** :
   - **Site URL** : `https://goodlink.tld`
   - **Redirect URLs** : ajoute `https://goodlink.tld/auth/callback` (sinon les liens de confirmation email casseront)
6. (Optionnel) Configure un domaine custom dans **Vercel → Settings → Domains**, puis mets à jour `NEXT_PUBLIC_SITE_URL` et la **Site URL** Supabase en conséquence.

---

## Limitations connues / TODO

- L'historique des avatars/backgrounds uploadés n'est pas nettoyé. Chaque change crée un nouveau fichier `avatar-<timestamp>.webp` à côté de l'ancien. À automatiser via une edge function ou un cron Supabase.
- Les usernames de comptes non-confirmés (créés mais email pas validé) restent réservés. Cleanup à prévoir.
- Pas de soft-delete sur les liens — la suppression est définitive.
- Pas d'analytics par lien (clicks). Facile à ajouter (table `link_clicks` + Server Action de tracking).
- Pas de connexion OAuth (Google, Apple). Trivial à activer côté Supabase + ajouter les boutons dans `/login` et `/signup`.
- Pas de Sheet preview en mobile dans le dashboard : sur petit écran, l'aperçu se consulte via le bouton « Voir ma page » du header (ouverture en nouvel onglet).

### Vulnérabilités acceptées

`npm audit` signale 2 alertes **moderate** sur `postcss <8.5.10`, bundlé en interne par `next` (`node_modules/next/node_modules/postcss`). Le CVE concerne la stringification CSS — exploitable seulement si on injecte du CSS contrôlé par l'utilisateur dans postcss au moment du build. **Aucun chemin d'attaque dans ce projet** (postcss tourne au build sur du CSS statique). À la prochaine release patch de Next, lance `npm update next`.
