"use client"

import { useState } from "react"
import { Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { Label } from "@/components/ui/label"
import { QrPreview } from "./qr-preview"
import { createQrSchema } from "@/lib/validations/qr"
import { fieldErrors } from "@/lib/form"
import type { CreateQrInput } from "@/lib/validations/qr"
import type { QrCode } from "@/types/database"

type Props = {
  initial?: QrCode
  onSubmit: (
    input: CreateQrInput
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onCancel: () => void
}

export function QrForm({ initial, onSubmit, onCancel }: Props) {
  const [label, setLabel] = useState(initial?.label ?? "")
  const [targetUrl, setTargetUrl] = useState(initial?.target_url ?? "")
  const [fgColor, setFgColor] = useState(initial?.fg_color ?? "#0F291E")
  const [bgColor, setBgColor] = useState(initial?.bg_color ?? "#FFFFFF")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    const parsed = createQrSchema.safeParse({
      label,
      target_url: targetUrl,
      fg_color: fgColor,
      bg_color: bgColor
    })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setBusy(true)
    const result = await onSubmit(parsed.data)
    setBusy(false)
    if (result.ok) {
      // parent ferme le form
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-white p-5 shadow-soft animate-fade-in"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-forest">
          {initial ? "Modifier le QR code" : "Nouveau QR code"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fermer"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <FormField
            label="Libellé"
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Mon QR Instagram"
            error={errors.label}
            autoFocus
            required
          />
          <FormField
            label="URL ciblée"
            name="target_url"
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            error={errors.target_url}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <ColorPickerField
              label="Couleur des points"
              value={fgColor}
              onChange={setFgColor}
              error={errors.fg_color}
            />
            <ColorPickerField
              label="Couleur du fond"
              value={bgColor}
              onChange={setBgColor}
              error={errors.bg_color}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              variant="default"
              className="flex-1"
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {initial ? "Enregistrer" : "Créer"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </div>

        <div className="flex justify-center md:items-start">
          <QrPreview
            data={targetUrl || "https://example.com"}
            fgColor={fgColor}
            bgColor={bgColor}
            label={label || "qr-code"}
            size={200}
            showDownload={false}
          />
        </div>
      </div>
    </form>
  )
}

function ColorPickerField({
  label,
  value,
  onChange,
  error
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
          aria-label={`${label} (sélecteur)`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#?[0-9a-fA-F]{0,6}$/.test(v)) {
              onChange(v.startsWith("#") ? v : `#${v}`)
            }
          }}
          className="h-11 flex-1 rounded-xl border border-input bg-background px-3 font-mono text-sm uppercase focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          maxLength={7}
          aria-label={`${label} (hex)`}
        />
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
