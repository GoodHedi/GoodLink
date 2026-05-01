"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Loader2, Share2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ShareTarget = "page" | "qr"

type Props = {
  target: ShareTarget
  onSubmit: (
    username: string,
    role: "viewer" | "editor"
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  trigger?: React.ReactNode
  /** Permet de styler le bouton trigger, ignoré si trigger est fourni. */
  className?: string
}

/**
 * Modal de partage (page ou QR). Demande un pseudo + rôle, appelle
 * onSubmit (qui invoque la server action correspondante). Pas de gestion
 * de la liste des partages existants ici — l'idée est juste d'ajouter.
 */
export function ShareModal({ target, onSubmit, trigger, className }: Props) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [role, setRole] = useState<"viewer" | "editor">("viewer")
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUsername("")
      setRole("viewer")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    startTransition(async () => {
      const result = await onSubmit(username.trim().toLowerCase(), role)
      if (result.ok) {
        toast.success("Partage envoyé")
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          title="Partager"
          className={cn("px-0", className)}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lift">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="inline-flex items-center gap-2 text-base font-bold text-forest">
                  <Share2 className="h-4 w-4" />
                  {target === "page"
                    ? "Partager cette page"
                    : "Partager ce QR code"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Entre le pseudo GoodLink de la personne. Elle verra cet
                  élément dans son onglet « Partages ».
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="share-username"
                  className="text-sm font-semibold text-forest"
                >
                  Pseudo du destinataire
                </label>
                <div className="flex h-10 items-center rounded-xl border border-input bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                  <span className="px-3 text-sm text-muted-foreground">@</span>
                  <input
                    ref={inputRef}
                    id="share-username"
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "")
                      )
                    }
                    maxLength={20}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    placeholder="pierre"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-forest">
                  Niveau d&apos;accès
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("viewer")}
                    className={cn(
                      "rounded-xl border-2 p-3 text-left transition-colors",
                      role === "viewer"
                        ? "border-forest bg-forest/5"
                        : "border-border hover:border-forest/40"
                    )}
                  >
                    <div className="text-sm font-bold text-forest">Lecteur</div>
                    <div className="text-[11px] text-muted-foreground">
                      Voir uniquement
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("editor")}
                    className={cn(
                      "rounded-xl border-2 p-3 text-left transition-colors",
                      role === "editor"
                        ? "border-forest bg-forest/5"
                        : "border-border hover:border-forest/40"
                    )}
                  >
                    <div className="text-sm font-bold text-forest">Éditeur</div>
                    <div className="text-[11px] text-muted-foreground">
                      Voir + modifier
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  disabled={isPending || !username.trim()}
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Partager
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
