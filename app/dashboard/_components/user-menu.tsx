"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CreditCard, LogOut, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { tierLabel } from "@/lib/constants"
import type { AccountTier } from "@/types/database"

type Props = {
  username: string | null
  email: string
  tier?: AccountTier
}

export function UserMenu({ username, email, tier }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Outside-click pour fermer
  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [open])

  const initial = (username || email || "?").charAt(0).toUpperCase()
  const handle = username ? `@${username}` : email

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-white px-1.5 py-1 pr-3 text-sm font-semibold text-forest shadow-soft transition-all hover:shadow-lift",
          open && "shadow-lift"
        )}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-cream">
          {initial}
        </span>
        <span className="hidden max-w-[140px] truncate sm:inline">
          {handle}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-border bg-white shadow-lift animate-fade-in"
        >
          <div className="border-b border-border bg-cream/40 p-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest text-cream font-bold">
                {initial}
              </span>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-forest">
                  {handle}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {email}
                </p>
                {tier && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    {tierLabel(tier)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-1">
            <Link
              href="/dashboard/billing"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <CreditCard className="h-4 w-4" />
              Abonnement
            </Link>

            <button
              type="button"
              role="menuitem"
              disabled
              title="Bientôt"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground disabled:cursor-not-allowed"
            >
              <UserIcon className="h-4 w-4" />
              Compte (bientôt)
            </button>

            <form action="/auth/signout" method="post" role="menuitem">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
