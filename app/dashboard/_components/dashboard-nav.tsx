"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { AccountTier } from "@/types/database"

const BASE_TABS = [
  { href: "/dashboard", label: "Pages", matches: ["/dashboard"] },
  { href: "/dashboard/qr", label: "QR codes", matches: ["/dashboard/qr"] },
  {
    href: "/dashboard/shared",
    label: "Partages",
    matches: ["/dashboard/shared"]
  },
  {
    href: "/dashboard/stats",
    label: "Stats",
    matches: ["/dashboard/stats"]
  },
  {
    href: "/dashboard/settings",
    label: "Paramètres",
    matches: ["/dashboard/settings"]
  }
]

const AGENCY_TAB = {
  href: "/dashboard/agency",
  label: "Agence",
  matches: ["/dashboard/agency"]
}

const ACTIVATE_CODE_TAB = {
  href: "/dashboard/activate-code",
  label: "Code",
  matches: ["/dashboard/activate-code"]
}

type Props = { tier: AccountTier }

export function DashboardNav({ tier }: Props) {
  const pathname = usePathname() || ""

  // - tier 'agence'         → onglet "Agence" (gestion des codes)
  // - tier visiteur/pro/etc → onglet "Code" (activation d'un code reçu)
  // Inséré entre Partages et Stats dans tous les cas pour la cohérence.
  const sideTab = tier === "agence" ? AGENCY_TAB : ACTIVATE_CODE_TAB
  const TABS = [...BASE_TABS.slice(0, 3), sideTab, ...BASE_TABS.slice(3)]

  return (
    <nav className="flex items-center gap-1">
      {TABS.map((tab) => {
        const active = tab.matches.some((prefix) => {
          if (prefix === "/dashboard") {
            // "Pages" actif uniquement sur /dashboard et /dashboard/pages/*
            // (pas sur /dashboard/qr, /dashboard/stats, /dashboard/settings)
            return (
              pathname === "/dashboard" ||
              pathname.startsWith("/dashboard/pages")
            )
          }
          return pathname.startsWith(prefix)
        })
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-forest text-cream"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
