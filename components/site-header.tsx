import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Top bar style "floating pill" — fixe en haut de l'écran, fond glass
 * (backdrop-blur), bord net, présente seulement sur la landing.
 */
export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-5 sm:px-5">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-2 rounded-full",
          "border border-forest/10 bg-cream/80 px-3 py-2 shadow-soft backdrop-blur-xl",
          "sm:px-4"
        )}
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full px-1.5 py-1 transition-colors hover:bg-forest/5"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-forest text-cream shadow-soft transition-transform group-hover:rotate-[-4deg]">
            <span className="text-base font-extrabold leading-none">G</span>
          </span>
          <span className="text-sm font-extrabold tracking-tight text-forest">
            GoodLink
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="#features">Fonctionnalités</NavLink>
          <NavLink href="#how">Comment ça marche</NavLink>
          <NavLink href="#qr">QR codes</NavLink>
          <NavLink href="#pricing">Plans</NavLink>
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-forest/80 transition-colors hover:bg-forest/5 hover:text-forest sm:inline-flex"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className={cn(
              "group inline-flex items-center gap-1 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream shadow-soft transition-all",
              "hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
            )}
          >
            Créer mon GoodLink
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

function NavLink({
  href,
  children
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-forest/70 transition-colors hover:bg-forest/5 hover:text-forest"
    >
      {children}
    </a>
  )
}
