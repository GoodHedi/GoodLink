"use client"

import { useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { createPageSchema, type CreatePageInput } from "@/lib/validations/page"
import { fieldErrors } from "@/lib/form"
import { USERNAME_MAX } from "@/lib/constants"

type Props = {
  onCreate: (input: CreatePageInput) => Promise<boolean>
  onCancel: () => void
}

export function NewPageForm({ onCreate, onCancel }: Props) {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const sanitized = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, USERNAME_MAX)
    setUsername(sanitized)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    const parsed = createPageSchema.safeParse({
      username,
      display_name: displayName || undefined
    })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setBusy(true)
    const ok = await onCreate(parsed.data)
    setBusy(false)
    if (!ok) {
      // Les erreurs serveur (pseudo pris, quota...) sont affichées via toast
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft animate-fade-in"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-forest">Nouvelle page</h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fermer"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <FormField
        label="Pseudo (URL)"
        name="username"
        prefix="agoodlink/"
        placeholder="ma-page-perso"
        value={username}
        onChange={handleUsernameChange}
        error={errors.username}
        hint="3 à 20 caractères : minuscules, chiffres ou tirets."
        autoFocus
        required
      />

      <FormField
        label="Nom affiché (optionnel)"
        name="display_name"
        placeholder="Laisse vide pour reprendre le pseudo"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={errors.display_name}
      />

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="accent"
          className="flex-1"
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Créer la page
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
