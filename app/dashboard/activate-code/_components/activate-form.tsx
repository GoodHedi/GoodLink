"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { activateAgencyCodeAction } from "../../agency/actions"
import type { AccountTier } from "@/types/database"

type Props = {
  currentTier: AccountTier
}

export function ActivateForm({ currentTier }: Props) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    const result = await activateAgencyCodeAction({ code })
    setBusy(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Code activé. Tu es maintenant Client agence.")
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <div className="space-y-1.5">
        <label htmlFor="code" className="text-sm font-semibold text-forest">
          Code agence
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={40}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder="A1B2-C3D4-E5F6-7890-..."
          className="h-11 w-full rounded-xl border border-input bg-background px-4 font-mono text-sm tracking-wider focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      <Button
        type="submit"
        variant="accent"
        className="w-full"
        disabled={busy || !code.trim()}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Activer
      </Button>

      <p className="text-[11px] text-muted-foreground">
        Tu es actuellement{" "}
        <span className="font-semibold text-forest">
          {currentTier === "visiteur"
            ? "Visiteur"
            : currentTier === "pro"
              ? "Pro"
              : "Client agence"}
        </span>
        . L&apos;activation remplacera ton statut. Si l&apos;agence révoque
        son code, tu repasseras Visiteur et tes pages seront dépubliées.
      </p>
    </form>
  )
}
