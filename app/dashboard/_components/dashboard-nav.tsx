"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard", label: "Pages", matches: ["/dashboard"] },
  { href: "/dashboard/qr", label: "QR codes", matches: ["/dashboard/qr"] },
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

export function DashboardNav() {
  const pathname = usePathname() || ""

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
