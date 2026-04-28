import Link from "next/link"
import {
  ArrowUpRight,
  BarChart3,
  Layers,
  Layout,
  QrCode,
  Share2,
  Sparkles,
  Wand2
} from "lucide-react"
import { PhoneFrame } from "@/components/phone-frame"
import { PublicProfile } from "@/components/public-profile"
import { SiteHeader } from "@/components/site-header"
import { ClaimForm } from "./_components/claim-form"

// --- Profil démo affiché dans le mockup téléphone ---
const DEMO_PROFILE = {
  username: "lucie",
  display_name: "Lucie Martin",
  bio: "Photographe à Lyon. Workshops, shootings, communauté.",
  avatar_url: null,
  background_url: null,
  background_color: "#0F291E",
  background_overlay: 0.3,
  link_color: "#FFFFFF",
  link_shape: "pill" as const,
  font_family: "sans" as const
}

const DEMO_LINKS = [
  {
    id: "1",
    type: "link" as const,
    title: "Mes derniers shootings",
    url: "https://example.com",
    platform: null
  },
  {
    id: "2",
    type: "link" as const,
    title: "Workshop photo nature — mai",
    url: "https://example.com",
    platform: null
  },
  {
    id: "3",
    type: "link" as const,
    title: "Boutique de tirages limités",
    url: "https://example.com",
    platform: null
  },
  {
    id: "4",
    type: "link" as const,
    title: "Me contacter",
    url: "https://example.com",
    platform: null
  }
]

const FEATURES = [
  {
    icon: Layers,
    title: "Pages multiples",
    description:
      "Une page pour ta marque, une pour ton perso, une pour ton side project. Jusqu'à 20 par compte."
  },
  {
    icon: Wand2,
    title: "Personnalisation totale",
    description:
      "Avatar, image de fond, couleurs, voile, types de liens. Pas de template imposé."
  },
  {
    icon: BarChart3,
    title: "Statistiques natives",
    description:
      "Vues, clics par lien, en temps réel. Sans tracker tiers, sans cookies."
  },
  {
    icon: QrCode,
    title: "QR codes",
    description:
      "Génère des QR codes vers n'importe quelle URL. Téléchargement PNG ou SVG, couleurs custom."
  },
  {
    icon: Share2,
    title: "Une URL courte",
    description:
      "agoodlink.net/ton-pseudo. Mémorisable, partout dans tes bios."
  },
  {
    icon: Sparkles,
    title: "Aucun bagage",
    description:
      "Pas de pub, pas d'analytics tiers, hébergé en Europe. Léger et rapide."
  }
]

const STEPS = [
  {
    n: "01",
    title: "Crée ton compte",
    description:
      "Pseudo, email, mot de passe. Trente secondes, une confirmation par email."
  },
  {
    n: "02",
    title: "Compose ta page",
    description:
      "Avatar, bio, couleur, image de fond. Ajoute autant de liens que tu veux et drag-and-drop pour réordonner."
  },
  {
    n: "03",
    title: "Partage ton URL",
    description:
      "Mets agoodlink.net/ton-pseudo dans ta bio Instagram, TikTok, mail, partout."
  }
]

const MARQUEE_WORDS = [
  "Pages multiples",
  "Statistiques",
  "QR codes",
  "Sans code",
  "Sans pub",
  "Hébergé en Europe",
  "Open source",
  "Sans tracker"
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden bg-cream">
      <SiteHeader />

      {/* ============================== HERO ============================== */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32">
        {/* Halos colorés en fond */}
        <div className="blob -top-20 -left-24 h-[420px] w-[420px] bg-accent/30 animate-blob" />
        <div
          className="blob top-40 right-[-120px] h-[480px] w-[480px] bg-forest/15 animate-blob"
          style={{ animationDelay: "-4s" }}
        />
        <div className="absolute inset-0 -z-10 bg-grid opacity-60" />

        <div className="container relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-forest/80 backdrop-blur animate-fade-in-up">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                Nouveau · Multi-pages, QR codes, stats
              </span>

              <h1 className="mt-6 text-[3.25rem] font-extrabold leading-[0.95] tracking-tight text-forest sm:text-7xl lg:text-[5.5rem] animate-fade-in-up delay-100">
                Un seul lien.
                <br />
                <span className="relative inline-block">
                  <span className="italic text-accent">Tout</span>{" "}
                  <span className="italic">ton univers.</span>
                  <svg
                    aria-hidden
                    className="absolute -bottom-3 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                  >
                    <path
                      d="M2 8 Q 80 2 150 6 T 298 5"
                      stroke="hsl(var(--accent))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mt-8 max-w-md text-lg text-forest/70 animate-fade-in-up delay-200">
                Crée plusieurs pages perso, customise tout, suis tes
                statistiques, génère tes QR codes. Tout dans un seul outil,
                tout à toi.
              </p>

              <div className="mt-8 animate-fade-in-up delay-300">
                <ClaimForm />
              </div>

              <p className="mt-3 text-xs text-forest/50 animate-fade-in-up delay-400">
                Gratuit. Sans carte bancaire. Sans pub.
              </p>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              {/* Phone flottant */}
              <div className="animate-float">
                <PhoneFrame>
                  <PublicProfile
                    profile={DEMO_PROFILE}
                    links={DEMO_LINKS}
                    showFooter
                  />
                </PhoneFrame>
              </div>

              {/* Petit "ticker" décoratif */}
              <div className="absolute -left-6 top-12 hidden rotate-[-6deg] rounded-2xl border border-forest/10 bg-white px-3 py-2 shadow-lift sm:flex sm:items-center sm:gap-2 animate-float-slow">
                <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs font-semibold text-forest">
                  +47 clics aujourd&apos;hui
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== MARQUEE ============================== */}
      <section
        aria-hidden
        className="relative overflow-hidden border-y border-forest/10 bg-forest py-6 text-cream"
      >
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap pr-12">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS, ...MARQUEE_WORDS].map(
            (word, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-12 text-2xl font-extrabold uppercase tracking-tight sm:text-3xl"
              >
                <span>{word}</span>
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
              </span>
            )
          )}
        </div>
      </section>

      {/* ============================== FEATURES ============================== */}
      <section
        id="features"
        className="relative bg-white py-24 sm:py-32"
      >
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Fonctionnalités
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
              Tout ce dont t&apos;as besoin.
              <br />
              <span className="text-forest/40">Rien que tu n&apos;utiliseras pas.</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className="group relative overflow-hidden rounded-3xl border border-forest/10 bg-cream/40 p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-cream hover:shadow-lift"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-cream transition-all group-hover:bg-accent group-hover:text-accent-foreground group-hover:rotate-[-4deg]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-forest">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-forest/65">
                    {feature.description}
                  </p>
                  <ArrowUpRight className="absolute right-6 top-7 h-5 w-5 -translate-y-1 translate-x-1 text-forest/20 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-forest group-hover:opacity-100" />
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================== HOW ============================== */}
      <section id="how" className="relative bg-cream py-24 sm:py-32">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Comment ça marche
              </span>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
                Trois étapes,
                <br />
                <span className="italic text-forest/60">trente secondes.</span>
              </h2>
              <p className="mt-6 max-w-sm text-base text-forest/65">
                Pas d&apos;onboarding interminable. Pas de paywall caché.
                T&apos;es en ligne dès la 1re minute.
              </p>
            </div>

            <ol className="relative space-y-3">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="group relative overflow-hidden rounded-3xl border border-forest/10 bg-white p-6 sm:p-8 transition-all hover:border-forest/20"
                >
                  <div className="flex items-start gap-5 sm:gap-7">
                    <span className="font-mono text-3xl font-extrabold tabular-nums text-forest/15 transition-colors group-hover:text-accent sm:text-5xl">
                      {step.n}
                    </span>
                    <div className="flex-1 pt-1">
                      <h3 className="text-xl font-bold text-forest sm:text-2xl">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-forest/65 sm:text-base">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ============================== QR codes spotlight ============================== */}
      <section
        id="qr"
        className="relative overflow-hidden bg-forest py-24 text-cream sm:py-32"
      >
        <div className="blob -bottom-32 -right-32 h-[500px] w-[500px] bg-accent/20 animate-blob" />
        <div className="container relative">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                QR codes
              </span>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Un QR code,
                <br />
                <span className="text-accent">un point d&apos;entrée.</span>
              </h2>
              <p className="mt-6 max-w-md text-base text-cream/70">
                Pour ta carte de visite, ton menu, un panneau d&apos;événement.
                Couleurs personnalisées, téléchargement PNG ou SVG, prêt à
                imprimer en 5 secondes.
              </p>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  Tester gratuitement
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <QrSample color="#23C45A" />
                <QrSample color="#F3EFE9" inverted />
                <QrSample color="#F3EFE9" inverted />
                <QrSample color="#23C45A" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== CTA final ============================== */}
      <section className="relative bg-cream py-24 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-forest/10 bg-white p-10 text-center shadow-soft sm:p-16">
            <Layout className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
              Prêt à publier ?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-forest/65">
              Tu peux avoir ta page en ligne avant la fin de cette pub
              YouTube que t&apos;es en train de skipper.
            </p>
            <div className="mt-8 flex justify-center">
              <ClaimForm />
            </div>
          </div>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="border-t border-forest/10 bg-forest text-cream/80">
        <div className="container py-12">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-extrabold text-cream"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-forest shadow-soft">
                G
              </span>
              <span className="text-lg tracking-tight">GoodLink</span>
            </Link>

            <nav className="flex flex-wrap items-center gap-6 text-sm">
              <a
                href="#features"
                className="hover:text-cream"
              >
                Fonctionnalités
              </a>
              <a href="#how" className="hover:text-cream">
                Comment ça marche
              </a>
              <a href="#qr" className="hover:text-cream">
                QR codes
              </a>
              <Link href="/login" className="hover:text-cream">
                Connexion
              </Link>
              <Link href="/signup" className="hover:text-cream">
                Inscription
              </Link>
            </nav>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-cream/10 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} GoodLink. Hébergé en Europe.</p>
            <p>
              Conçu et développé avec attention.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function QrSample({
  color,
  inverted = false
}: {
  color: string
  inverted?: boolean
}) {
  // Petit visuel décoratif simulant un QR code (pas un vrai QR — on en
  // génère des vrais via /dashboard/qr).
  return (
    <div
      className={`grid h-32 w-32 grid-cols-7 grid-rows-7 gap-0.5 rounded-2xl p-2 shadow-lift transition-transform hover:-translate-y-1 sm:h-40 sm:w-40 ${
        inverted ? "bg-cream" : "bg-forest"
      }`}
      style={{ backgroundColor: inverted ? "#F3EFE9" : "#0F291E" }}
      aria-hidden
    >
      {Array.from({ length: 49 }).map((_, i) => {
        const isCorner =
          (i < 3 && (i % 7 < 3 || i % 7 > 3)) ||
          [0, 1, 2, 7, 8, 9, 14, 15, 16].includes(i) ||
          [4, 5, 6, 11, 12, 13, 18, 19, 20].includes(i) ||
          [28, 29, 30, 35, 36, 37, 42, 43, 44].includes(i)
        const filled = isCorner || (i * 7) % 3 === 0 || (i * 11) % 5 === 0
        return (
          <div
            key={i}
            className="rounded-[2px]"
            style={{
              backgroundColor: filled ? color : "transparent"
            }}
          />
        )
      })}
    </div>
  )
}
