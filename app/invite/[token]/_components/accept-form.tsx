"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { acceptInviteAction } from "../actions"

export function AcceptForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false)

  async function handleAccept() {
    setBusy(true)
    const result = await acceptInviteAction(token)
    if (!result.ok) {
      toast.error(result.error)
      setBusy(false)
    }
    // Sur succès le server action redirige déjà vers /dashboard
  }

  return (
    <Button
      type="button"
      size="lg"
      variant="accent"
      className="w-full"
      disabled={busy}
      onClick={handleAccept}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      Accepter et rejoindre
    </Button>
  )
}
