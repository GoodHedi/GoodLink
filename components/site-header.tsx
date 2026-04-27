import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="container py-5">
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-extrabold text-forest"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-cream shadow-soft">
            G
          </span>
          <span className="text-lg tracking-tight">GoodLink</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild variant="accent" size="sm">
            <Link href="/signup">Créer mon GoodLink</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
