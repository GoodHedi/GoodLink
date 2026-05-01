"use client"

import { useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function PortalButton() {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const json = await res.json()
      if (!res.ok || !json.url) {
        toast.error(json.error ?? "Impossible d'ouvrir le portail.")
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
      variant="outline"
      size="sm"
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ExternalLink className="h-3.5 w-3.5" />
      )}
      Gérer mon abonnement
    </Button>
  )
}
