"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { Label } from "@/components/ui/label"
import { QrPreview } from "./qr-preview"
import { createQrSchema } from "@/lib/validations/qr"
import { fieldErrors } from "@/lib/form"
import {
  ACCEPTED_IMAGE_TYPES,
  compressImage
} from "@/lib/image-compression"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { CreateQrInput } from "@/lib/validations/qr"
import type { QrCode } from "@/types/database"

type Props = {
  ownerId: string
  initial?: QrCode
  onSubmit: (
    input: CreateQrInput
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onCancel: () => void
}

export function QrForm({ ownerId, initial, onSubmit, onCancel }: Props) {
  const [label, setLabel] = useState(initial?.label ?? "")
  const [targetUrl, setTargetUrl] = useState(initial?.target_url ?? "")
  const [fgColor, setFgColor] = useState(initial?.fg_color ?? "#0F291E")
  const [bgColor, setBgColor] = useState(initial?.bg_color ?? "#FFFFFF")
  const [logoUrl, setLogoUrl] = useState<string | null>(
    initial?.logo_url ?? null
  )
  const [logoUploading, setLogoUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setLogoUploading(true)
    try {
      // Logos petits — 256px largement suffisant au centre d'un QR code.
      const compressed = await compressImage(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 512
      })
      const supabase = createClient()
      const path = `${ownerId}/qr-${Date.now()}.webp`
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, {
          upsert: true,
          contentType: "image/webp"
        })
      if (upErr) throw new Error(upErr.message)

      const {
        data: { publicUrl }
      } = supabase.storage.from("avatars").getPublicUrl(path)

      setLogoUrl(publicUrl)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de l'upload du logo."
      )
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    const parsed = createQrSchema.safeParse({
      label,
      target_url: targetUrl,
      fg_color: fgColor,
      bg_color: bgColor,
      logo_url: logoUrl
    })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setBusy(true)
    const result = await onSubmit(parsed.data)
    setBusy(false)
    if (!result.ok) {
      // Le parent affiche déjà le toast — on garde l'utilisateur sur le form.
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

          {/* Logo central */}
          <div className="space-y-2">
            <Label>Logo central (optionnel)</Label>
            <input
              ref={logoInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              onChange={handleLogoSelect}
            />
            {logoUrl ? (
              <div className="flex items-center gap-3 rounded-xl border border-input bg-background p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="flex-1 text-xs text-muted-foreground">
                  Apparaîtra au centre du QR code, scannabilité préservée.
                </div>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={logoUploading}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Changer
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={logoUploading}
                    onClick={() => setLogoUrl(null)}
                    title="Retirer"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={logoUploading}
                onClick={() => logoInputRef.current?.click()}
                className={cn(
                  "flex h-20 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 text-sm font-medium text-muted-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground disabled:opacity-50"
                )}
              >
                {logoUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Compression…
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5" />
                    Ajouter un logo au centre
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              variant="default"
              className="flex-1"
              disabled={busy || logoUploading}
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
            logoUrl={logoUrl}
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
