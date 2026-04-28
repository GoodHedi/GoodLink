"use client"

import { useState } from "react"
import {
  Building2,
  Check,
  Copy,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  X
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  createInviteAction,
  leaveWorkspaceAction,
  removeMemberAction,
  renameWorkspaceAction,
  revokeInviteAction
} from "../actions"
import type {
  Workspace,
  WorkspaceInvite,
  WorkspaceRole
} from "@/types/database"
import type { MemberRow } from "../page"

type Props = {
  workspace: Workspace
  members: MemberRow[]
  invites: WorkspaceInvite[]
  myRole: WorkspaceRole
}

export function SettingsView({
  workspace,
  members: initialMembers,
  invites: initialInvites,
  myRole
}: Props) {
  const [name, setName] = useState(workspace.name)
  const [savingName, setSavingName] = useState(false)
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)

  const isOwner = myRole === "owner"

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (name === workspace.name || !name.trim()) return
    setSavingName(true)
    const result = await renameWorkspaceAction(workspace.id, { name })
    setSavingName(false)
    if (!result.ok) {
      toast.error(result.error)
      setName(workspace.name)
    } else {
      toast.success("Workspace renommé")
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Retirer ce membre du workspace ?")) return
    const previous = members
    setMembers(members.filter((m) => m.user_id !== userId))
    const result = await removeMemberAction(workspace.id, userId)
    if (!result.ok) {
      toast.error(result.error)
      setMembers(previous)
    } else {
      toast.success("Membre retiré")
    }
  }

  async function handleLeave() {
    if (!confirm("Quitter ce workspace ?")) return
    const result = await leaveWorkspaceAction(workspace.id)
    if (!result.ok) {
      toast.error(result.error)
    } else {
      toast.success("Tu as quitté le workspace")
      window.location.href = "/dashboard"
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
          Paramètres du workspace
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gère les membres, les invitations et les paramètres généraux.
        </p>
      </div>

      {/* Identité */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2 text-forest">
          <Building2 className="h-4 w-4" />
          <h2 className="text-lg font-bold">Identité</h2>
        </div>
        <form
          onSubmit={handleRename}
          className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="ws-name">Nom du workspace</Label>
            <input
              id="ws-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner || workspace.is_personal}
              maxLength={60}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-base focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-60"
            />
            <p className="text-xs text-muted-foreground">
              {workspace.is_personal
                ? "Workspace personnel : non renommable."
                : isOwner
                  ? "Visible par tous les membres."
                  : "Seul un owner peut renommer."}
            </p>
          </div>
          {isOwner && !workspace.is_personal && (
            <Button
              type="submit"
              disabled={savingName || name === workspace.name}
            >
              <Pencil className="h-4 w-4" />
              Enregistrer
            </Button>
          )}
        </form>
      </section>

      {/* Membres */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-forest">
            Membres ({members.length})
          </h2>
        </div>
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest text-cream font-bold">
                {(m.username ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-forest">
                  {m.username ? `@${m.username}` : "Membre"}
                  {m.is_self && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (toi)
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email ? m.email : "—"} · {roleLabel(m.role)}
                </p>
              </div>
              {isOwner && !m.is_self && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMember(m.user_id)}
                  title="Retirer du workspace"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Inviter */}
      {isOwner && (
        <InviteSection
          workspaceId={workspace.id}
          invites={invites}
          setInvites={setInvites}
        />
      )}

      {/* Quitter */}
      {!workspace.is_personal && (
        <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <h2 className="text-lg font-bold text-destructive">Zone à risque</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quitter ce workspace te retire l&apos;accès à toutes ses pages et
            QR codes. Tu peux être ré-invité par un owner si besoin.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLeave}
            className="mt-3 border-destructive text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Quitter le workspace
          </Button>
        </section>
      )}
    </div>
  )
}

function roleLabel(role: WorkspaceRole): string {
  switch (role) {
    case "owner":
      return "Owner"
    case "editor":
      return "Éditeur"
    case "viewer":
      return "Lecteur"
  }
}

// =====================================================================
// Invitations
// =====================================================================

type InviteSectionProps = {
  workspaceId: string
  invites: WorkspaceInvite[]
  setInvites: React.Dispatch<React.SetStateAction<WorkspaceInvite[]>>
}

function InviteSection({
  workspaceId,
  invites,
  setInvites
}: InviteSectionProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<WorkspaceRole>("editor")
  const [busy, setBusy] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    const result = await createInviteAction(workspaceId, { email, role })
    setBusy(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setInvites((prev) => [result.data, ...prev])
    setEmail("")
    toast.success("Invitation créée — copie le lien ci-dessous")
  }

  async function handleRevoke(inviteId: string) {
    const previous = invites
    setInvites(invites.filter((i) => i.id !== inviteId))
    const result = await revokeInviteAction(inviteId)
    if (!result.ok) {
      toast.error(result.error)
      setInvites(previous)
    } else {
      toast.success("Invitation révoquée")
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2 text-forest">
        <UserPlus className="h-4 w-4" />
        <h2 className="text-lg font-bold">Inviter un coopérateur</h2>
      </div>

      <form
        onSubmit={handleInvite}
        className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <FormField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="amie@email.com"
          required
        />
        <div className="space-y-1.5">
          <Label>Rôle</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceRole)}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <option value="editor">Éditeur</option>
            <option value="viewer">Lecteur</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <Button type="submit" disabled={busy} className="self-end">
          <Plus className="h-4 w-4" />
          Inviter
        </Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        L&apos;invitation crée un lien partageable (ci-dessous). À l&apos;heure
        actuelle aucun email n&apos;est envoyé automatiquement — tu copies le
        lien et tu le transmets à la personne.
      </p>

      {invites.length > 0 && (
        <div className="mt-5 space-y-2">
          <Label>Invitations en attente</Label>
          {invites.map((inv) => (
            <InviteRow
              key={inv.id}
              invite={inv}
              onRevoke={() => handleRevoke(inv.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function InviteRow({
  invite,
  onRevoke
}: {
  invite: WorkspaceInvite
  onRevoke: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://agoodlink.net"
    const url = `${origin}/invite/${invite.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Lien copié")
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Copie manuelle requise.")
    }
  }

  const expired = new Date(invite.expires_at) < new Date()

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-background p-3",
        expired && "opacity-60"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-forest">
          {invite.email}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {roleLabel(invite.role)} ·{" "}
          {expired ? "Expirée" : "Valide 7 jours"}
        </p>
      </div>
      {!expired && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyLink}
          title="Copier le lien d'invitation"
        >
          {copied ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRevoke}
        title="Révoquer"
        className="text-destructive hover:bg-destructive/10"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
