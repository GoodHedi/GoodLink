import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Page introuvable" }

export default function NotFound() {
  return (
    <main className="min-h-svh grid place-items-center bg-cream px-6">
      <div className="max-w-sm space-y-4 text-center animate-fade-in">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-forest text-2xl font-extrabold text-cream shadow-lift">
          404
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-forest">
          Page introuvable
        </h1>
        <p className="text-muted-foreground">
          Cette page n&apos;existe pas. Tu t&apos;es peut-être trompé de lien.
        </p>
        <Button asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </main>
  )
}
