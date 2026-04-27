"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { USERNAME_MAX, USERNAME_REGEX } from "@/lib/constants"

/**
 * Champ "claim" de la landing : pseudo → /signup avec pré-remplissage.
 * Filtre la saisie pour rester dans le format autorisé (lowercase + a-z0-9-).
 */
export function ClaimForm() {
  const router = useRouter()
  const [value, setValue] = useState("")

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
      className="flex w-full max-w-lg flex-col gap-3 sm:flex-row"
    >
      <div className="flex flex-1 items-center rounded-2xl border-2 border-input bg-white pl-4 pr-2 shadow-soft transition-colors focus-within:border-forest">
        <span className="select-none text-sm font-medium text-muted-foreground">
          goodlink/
        </span>
        <input
          value={value}
          onChange={handleChange}
          placeholder="ton-pseudo"
          aria-label="Choisis ton pseudo"
          autoComplete="off"
          className="flex-1 bg-transparent py-3 text-base font-medium text-forest placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>
      <Button type="submit" size="lg" variant="accent" disabled={!valid}>
        Réclamer
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  )
}
