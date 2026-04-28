"use client"

import { useState } from "react"
import { Heading, Link2, Loader2, Plus, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { Label } from "@/components/ui/label"
import { SocialIcon } from "@/components/social-icon"
import { cn } from "@/lib/utils"
import {
  createLinkSchema,
  type CreateLinkInput
} from "@/lib/validations/links"
import { fieldErrors } from "@/lib/form"
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/constants"
import { SOCIAL_PLATFORM_META } from "@/lib/social-platforms"

type Props = {
  onAdd: (input: CreateLinkInput) => Promise<boolean>
}

type LinkKind = "link" | "header" | "social"

const KIND_TABS: { value: LinkKind; label: string; icon: typeof Link2 }[] = [
  { value: "link", label: "Lien", icon: Link2 },
  { value: "header", label: "Section", icon: Heading },
  { value: "social", label: "Réseau", icon: Share2 }
]

export function AddLinkForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<LinkKind>("link")
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [platform, setPlatform] = useState<SocialPlatform>("instagram")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  function reset() {
    setKind("link")
    setTitle("")
    setUrl("")
    setPlatform("instagram")
    setErrors({})
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="accent"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Ajouter un lien
      </Button>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    const payload: unknown =
      kind === "header"
        ? { type: "header", title }
        : kind === "social"
          ? { type: "social", title, url, platform }
          : { type: "link", title, url }

    const parsed = createLinkSchema.safeParse(payload)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setBusy(true)
    const ok = await onAdd(parsed.data)
    setBusy(false)
    if (ok) {
      reset()
      setOpen(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-muted/40 p-4 animate-fade-in"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-forest">Nouveau lien</p>
        <button
          type="button"
          aria-label="Fermer"
          onClick={() => {
            reset()
            setOpen(false)
          }}
          className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Type tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-background p-1">
        {KIND_TABS.map((tab) => {
          const Icon = tab.icon
          const active = kind === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setKind(tab.value)
                setErrors({})
              }}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-forest text-cream shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-pressed={active}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Champs spécifiques au type */}
      {kind === "social" && (
        <div className="space-y-1.5">
          <Label htmlFor="platform">Plateforme</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {SOCIAL_PLATFORMS.map((p) => {
              const active = platform === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  title={SOCIAL_PLATFORM_META[p].label}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-lg border transition-all",
                    active
                      ? "border-forest bg-forest text-cream"
                      : "border-border bg-background text-foreground hover:border-forest"
                  )}
                  aria-pressed={active}
                  aria-label={SOCIAL_PLATFORM_META[p].label}
                >
                  <SocialIcon platform={p} className="h-5 w-5" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <FormField
        label={kind === "header" ? "Titre de la section" : "Titre"}
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={
          kind === "header"
            ? "Mes réseaux"
            : kind === "social"
              ? "@ton-pseudo"
              : "Mon Instagram"
        }
        error={errors.title}
        autoFocus
        required
      />

      {kind !== "header" && (
        <FormField
          label="URL"
          name="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            kind === "social"
              ? SOCIAL_PLATFORM_META[platform].urlExample
              : "https://example.com"
          }
          error={errors.url}
          required
        />
      )}

      <Button
        type="submit"
        variant="default"
        size="default"
        disabled={busy}
        className="w-full"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Ajouter
      </Button>
    </form>
  )
}
