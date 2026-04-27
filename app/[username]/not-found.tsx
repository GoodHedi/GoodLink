import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Profil introuvable",
  robots: { index: false, follow: false }
}

export default function UsernameNotFound() {
  return (
    <main className="min-h-svh grid place-items-center bg-cream px-6">
      <div className="max-w-sm space-y-4 text-center animate-fade-in">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-forest text-3xl font-extrabold text-cream shadow-lift">
          ?
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-forest">
          Personne ici
        </h1>
        <p className="text-muted-foreground">
          Ce GoodLink n&apos;existe pas (ou plus). Tu peux toujours réclamer ce
          pseudo si tu le veux.
        </p>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/signup">Créer mon GoodLink</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
