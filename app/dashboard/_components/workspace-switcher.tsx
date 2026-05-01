"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  createWorkspaceAction,
  switchWorkspaceAction
} from "../settings/actions"
import type { WorkspaceSummary } from "@/lib/workspace"

type Props = {
  current: WorkspaceSummary | null
  workspaces: WorkspaceSummary[]
}

export function WorkspaceSwitcher({ current, workspaces }: Props) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [open])

  function switchTo(id: string) {
    startTransition(async () => {
      const result = await switchWorkspaceAction(id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setOpen(false)
      // Reload complet pour garantir que tous les Server Components
      // ré-évaluent le cookie workspace (router.refresh ne suffit pas
      // toujours après écriture de cookie côté action).
      window.location.assign("/dashboard")
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const result = await createWorkspaceAction({ name })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Workspace créé")
    setName("")
    setCreating(false)
    // Switch immédiat sur le nouveau + reload complet
    await switchWorkspaceAction(result.data.id)
    setOpen(false)
    window.location.assign("/dashboard")
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-forest shadow-soft transition-all hover:shadow-lift",
          open && "shadow-lift"
        )}
      >
        <span className="hidden max-w-[180px] truncate sm:inline">
          {current?.name ?? "Workspace"}
        </span>
        <span className="sm:hidden">WS</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-72 origin-top-left overflow-hidden rounded-xl border border-border bg-white shadow-lift animate-fade-in"
        >
          <div className="border-b border-border bg-cream/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tes workspaces
            </p>
          </div>

          <ul className="max-h-72 overflow-y-auto p-1">
            {workspaces.map((w) => {
              const active = w.id === current?.id
              // Pour distinguer "mon Personnel" du "Personnel d'un ami"
              // sans qu'il y ait deux entrées homonymes.
              const displayName =
                w.is_personal && !w.is_mine
                  ? `Perso · @${w.owner_username ?? "?"}`
                  : w.name
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => switchTo(w.id)}
                    role="menuitem"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-forest/5 text-forest"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-forest text-cream text-xs font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {displayName}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {w.is_personal && w.is_mine ? "Personnel · " : ""}
                        {roleLabel(w.role)}
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 text-accent" />}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="border-t border-border p-1">
            {!creating ? (
              <>
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-forest hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau workspace
                </button>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-forest hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres workspace
                </Link>
              </>
            ) : (
              <form onSubmit={handleCreate} className="space-y-2 p-1.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom du workspace"
                  maxLength={60}
                  autoFocus
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-forest px-3 py-1.5 text-sm font-semibold text-cream transition-colors hover:bg-forest/90"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false)
                      setName("")
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function roleLabel(role: string): string {
  if (role === "owner") return "Owner"
  if (role === "editor") return "Éditeur"
  return "Lecteur"
}
