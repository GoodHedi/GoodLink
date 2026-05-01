"use client"

import { useState, useTransition } from "react"
import {
  Briefcase,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Users,
  XCircle
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  createAgencyCodeAction,
  revokeAgencyCodeAction
} from "../actions"
import type { AgencyCode } from "@/types/database"

type ClientRow = {
  client_account_id: string
  client_username: string | null
  code_id: string
  joined_at: string
}

type Props = {
  codes: AgencyCode[]
  clients: ClientRow[]
}

export function AgencyView({ codes: initialCodes, clients }: Props) {
  const [codes, setCodes] = useState(initialCodes)
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Liste des clients groupée par code_id
  const clientsByCode = new Map<string, ClientRow[]>()
  for (const c of clients) {
    const list = clientsByCode.get(c.code_id) ?? []
    list.push(c)
    clientsByCode.set(c.code_id, list)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const result = await createAgencyCodeAction({ label })
    setCreating(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setCodes((prev) => [result.data, ...prev])
    setLabel("")
    toast.success("Code créé")
  }

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(null), 1800)
    })
  }

  function handleRevoke(codeId: string) {
    if (
      !confirm(
        "Révoquer ce code ? Les comptes activés via ce code repasseront en Visiteur et leurs pages seront dépubliées. Action irréversible."
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await revokeAgencyCodeAction(codeId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setCodes((prev) =>
        prev.map((c) =>
          c.id === codeId ? { ...c, revoked_at: new Date().toISOString() } : c
        )
      )
      toast.success(
        result.data.downgraded > 0
          ? `Code révoqué — ${result.data.downgraded} compte(s) downgradé(s).`
          : "Code révoqué."
      )
    })
  }

  return (
    <div className="container space-y-8 py-8 lg:py-12">
      <div>
        <h1 className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
          <Briefcase className="h-6 w-6" />
          Espace Agence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Génère des codes pour activer le statut « Client agence » sur les
          comptes que tu gères. Tant que le code n&apos;est pas révoqué, tes
          clients ont accès aux fonctionnalités Pro et leurs pages restent en
          ligne.
        </p>
      </div>

      {/* Création de code */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-forest">
          <KeyRound className="h-4 w-4" />
          Nouveau code
        </h2>
        <form onSubmit={handleCreate} className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Libellé interne (ex. Client Restaurant Lyon)"
            maxLength={60}
            className="h-10 flex-1 min-w-[260px] rounded-xl border border-input bg-background px-4 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
          <Button type="submit" variant="accent" disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Créer un code
          </Button>
        </form>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Le code est généré aléatoirement (96 bits). Partage-le avec ton
          client : il l&apos;activera depuis son dashboard.
        </p>
      </section>

      {/* Liste des codes */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Mes codes ({codes.length})
        </h2>
        {codes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Aucun code pour l&apos;instant.
          </p>
        ) : (
          <ul className="space-y-2">
            {codes.map((c) => {
              const isRevoked = !!c.revoked_at
              const codeClients = clientsByCode.get(c.id) ?? []
              return (
                <li
                  key={c.id}
                  className={cn(
                    "rounded-xl border bg-card p-4 shadow-soft",
                    isRevoked
                      ? "border-border opacity-60"
                      : "border-border"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm font-bold text-forest">
                          {c.code}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyCode(c.code)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Copier"
                        >
                          {copied === c.code ? (
                            <Check className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        {isRevoked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                            Révoqué
                          </span>
                        )}
                      </div>
                      {c.label && (
                        <p className="mt-1 text-sm font-semibold text-forest">
                          {c.label}
                        </p>
                      )}
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {codeClients.length} client
                        {codeClients.length > 1 ? "s" : ""} actif
                        {codeClients.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    {!isRevoked && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevoke(c.id)}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Révoquer
                      </Button>
                    )}
                  </div>

                  {codeClients.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-border pt-3">
                      {codeClients.map((c) => (
                        <li
                          key={c.client_account_id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-forest">
                            @{c.client_username ?? c.client_account_id.slice(0, 8)}
                          </span>
                          <span className="text-muted-foreground">
                            depuis {new Date(c.joined_at).toLocaleDateString("fr-FR")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
