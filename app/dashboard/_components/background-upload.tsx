"use client"

import { useCallback, useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useFileDrop } from "@/lib/hooks/use-file-drop"
import { ACCEPTED_IMAGE_TYPES, compressImage } from "@/lib/image-compression"
import { createClient } from "@/lib/supabase/client"
import { IMAGE_MAX_DIMENSION } from "@/lib/constants"
import { isUuid } from "@/lib/uuid"

type Kind = "mobile" | "desktop"

type Props = {
  pageId: string
  backgroundUrl: string | null
  /** "mobile" = image dans la carte centrale (visible partout).
   *  "desktop" = image autour de la carte (visible seulement sur grand écran). */
  kind: Kind
  label: string
  hint?: string
  onChange: (url: string | null) => Promise<void>
}

export function BackgroundUpload({
  pageId,
  backgroundUrl,
  kind,
  label,
  hint,
  onChange
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Format image non supporté.")
        return
      }
      if (!isUuid(pageId)) {
        toast.error("Identifiant de page invalide.")
        return
      }
      setBusy(true)
      try {
        // Desktop : un poil plus grand car visible sur écrans wide.
        const maxDim =
          kind === "desktop"
            ? Math.round(IMAGE_MAX_DIMENSION * 2)
            : Math.round(IMAGE_MAX_DIMENSION * 1.5)
        const maxMB = kind === "desktop" ? 2 : 1.5

        const compressed = await compressImage(file, {
          maxWidthOrHeight: maxDim,
          maxSizeMB: maxMB
        })

        const supabase = createClient()
        // Le 1er dossier doit être l'ID de l'uploader (auth.uid()) pour passer la
        // RLS storage. Pas page.owner_id : un editor invité n'est pas owner_id.
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Pas connecté.")
        const path = `${user.id}/${pageId}/background-${kind}-${Date.now()}.webp`
        const { error: upErr } = await supabase.storage
          .from("backgrounds")
          .upload(path, compressed, {
            upsert: true,
            contentType: "image/webp"
          })
        if (upErr) throw new Error(upErr.message)

        const {
          data: { publicUrl }
        } = supabase.storage.from("backgrounds").getPublicUrl(path)

        await onChange(publicUrl)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de l'upload.")
      } finally {
        setBusy(false)
      }
    },
    [kind, onChange, pageId]
  )

  const { isDragOver, dropProps } = useFileDrop({
    accept: ["image/"],
    onFile: handleFile
  })

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) void handleFile(file)
  }

  async function handleRemove() {
    setBusy(true)
    try {
      await onChange(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        onChange={handleSelect}
      />
      {backgroundUrl ? (
        <div
          {...dropProps}
          className={cn(
            "overflow-hidden rounded-xl border transition-colors",
            isDragOver
              ? "border-accent ring-2 ring-accent/40"
              : "border-input"
          )}
        >
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backgroundUrl}
              alt=""
              className="h-32 w-full object-cover"
            />
            {(busy || isDragOver) && (
              <div className="absolute inset-0 grid place-items-center bg-black/50 text-white">
                {busy ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <span className="text-sm font-semibold">
                    Relâche pour remplacer
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t border-border bg-card p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Changer
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          {...dropProps}
          className={cn(
            "flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm font-medium transition-colors disabled:opacity-50",
            isDragOver
              ? "border-accent bg-accent/10 text-accent"
              : "border-input bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span>
            {isDragOver
              ? "Relâche pour téléverser"
              : "Téléverser ou glisser une image"}
          </span>
        </button>
      )}
    </div>
  )
}
