import Link from "next/link"
import { ArrowRight, Layout, Share2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PhoneFrame } from "@/components/phone-frame"
import { PublicProfile } from "@/components/public-profile"
import { SiteHeader } from "@/components/site-header"
import { ClaimForm } from "./_components/claim-form"

// --- Profil de démonstration utilisé pour le mockup en hero ---
const DEMO_PROFILE = {
  username: "lucie",
  display_name: "Lucie Martin",
  bio: "📷 Photographe à Lyon\n✨ Workshops & shootings",
  avatar_url: null,
  background_url: null,
  background_color: "#0F291E",
  background_overlay: 0.3
}

const DEMO_LINKS = [
  { id: "1", title: "🎬 Mes derniers shootings", url: "https://example.com" },
  { id: "2", title: "📚 Workshop photo nature", url: "https://example.com" },
  { id: "3", title: "💌 Me contacter", url: "https://example.com" },
  { id: "4", title: "🛍️ Boutique de tirages", url: "https://example.com" }
]

const STEPS = [
  {
    icon: Sparkles,
    title: "Inscris-toi",
    description: "Réclame ton pseudo unique en moins de 30 secondes."
  },
  {
    icon: Layout,
    title: "Personnalise",
    description: "Photo, bio, couleurs, image de fond. Tu pilotes tout."
  },
  {
    icon: Share2,
    title: "Partage",
    description:
      "Une URL courte à mettre dans ta bio Instagram, TikTok, partout."
  }
]

export default function HomePage() {
  return (
    <div className="bg-cream">
      <SiteHeader />

      {/* HERO */}
      <section className="container pb-16 pt-4 lg:pb-28 lg:pt-12">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold leading-[0.95] tracking-tight text-forest sm:text-6xl lg:text-7xl">
              Un seul lien<br />
              pour tout ton univers.
            </h1>
            <p className="max-w-md text-lg text-forest/70">
              Crée ta page perso en 30 secondes. Réunis tous tes liens, ta bio
              et ta personnalité en une URL à partager partout.
            </p>
            <ClaimForm />
            <p className="text-xs text-muted-foreground">
              Gratuit. Sans carte bancaire. Tu peux tout modifier plus tard.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PhoneFrame>
              <PublicProfile
                profile={DEMO_PROFILE}
                links={DEMO_LINKS}
                showFooter
              />
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="border-y border-border bg-white">
        <div className="container py-16 lg:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
              Aussi simple que possible
            </h2>
            <p className="mt-3 text-muted-foreground">
              Trois étapes, et c&apos;est en ligne.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="relative space-y-3 rounded-2xl border border-border bg-cream/50 p-6"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-soft">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="absolute right-6 top-6 text-5xl font-extrabold text-forest/10 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-xl font-bold text-forest">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 text-center lg:py-24">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
            Prêt à lancer ton GoodLink&nbsp;?
          </h2>
          <p className="text-muted-foreground">
            Rejoins ceux qui ont déjà simplifié leur bio.
          </p>
          <Button asChild size="lg" variant="accent">
            <Link href="/signup">
              Créer ma page gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-white">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-xs text-muted-foreground sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-forest"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-forest text-cream">
              G
            </span>
            GoodLink
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">
              Connexion
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Inscription
            </Link>
          </div>
          <p>© {new Date().getFullYear()} GoodLink</p>
        </div>
      </footer>
    </div>
  )
}
