"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { Plan } from "@/lib/stripe"

type Props = {
  plan: Plan
}

export function CheckoutButton({ plan }: Props) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        toast.error(json.error ?? "Impossible de démarrer le paiement.")
        setBusy(false)
        return
      }
      window.location.assign(json.url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur réseau.")
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant={plan === "pro" ? "accent" : "default"}
      className="w-full"
      disabled={busy}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {plan === "pro" ? "Passer Pro" : "Passer Agence"}
    </Button>
  )
}
