"use client"

import { useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { createLinkSchema, type CreateLinkInput } from "@/lib/validations/links"
import { fieldErrors } from "@/lib/form"

type Props = {
  onAdd: (input: CreateLinkInput) => Promise<boolean>
}

export function AddLinkForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  function reset() {
    setTitle("")
    setUrl("")
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
    const parsed = createLinkSchema.safeParse({ title, url })
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
      className="space-y-3 rounded-xl border border-border bg-muted/40 p-4 animate-fade-in"
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
      <FormField
        label="Titre"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Mon Instagram"
        error={errors.title}
        autoFocus
        required
      />
      <FormField
        label="URL"
        name="url"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://instagram.com/pierre"
        error={errors.url}
        required
      />
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
