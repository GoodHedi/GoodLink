"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { USERNAME_MAX, USERNAME_REGEX } from "@/lib/constants"
import { cn } from "@/lib/utils"

/**
 * Champ "claim" de la landing : pseudo → /signup avec pré-remplissage.
 * Filtre la saisie pour rester dans le format autorisé (lowercase + a-z0-9-).
 */
export function ClaimForm() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)

  const valid = USERNAME_REGEX.test(value)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    setValue(sanitized.slice(0, USERNAME_MAX))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    router.push(`/signup?username=${encodeURIComponent(value)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "group flex w-full max-w-md items-center gap-1 rounded-full border-2 bg-white p-1.5 pl-5 shadow-soft transition-all duration-200",
        focused
          ? "border-forest shadow-lift"
          : "border-forest/15 hover:border-forest/30"
      )}
    >
      <span className="select-none text-base font-bold text-muted-foreground">
        @
      </span>
      <input
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="ton-pseudo"
        aria-label="Choisis ton pseudo"
        autoComplete="off"
        className="flex-1 bg-transparent px-1 py-2 text-base font-semibold text-forest placeholder:text-forest/30 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!valid}
        className={cn(
          "inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-all",
          "disabled:cursor-not-allowed disabled:opacity-40",
          valid
            ? "bg-forest text-cream hover:bg-forest/90 hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.98]"
            : "bg-forest/10 text-forest/50"
        )}
      >
        Réclamer
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  )
}
