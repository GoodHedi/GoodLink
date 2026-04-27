"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ACCEPTED_IMAGE_TYPES, compressImage } from "@/lib/image-compression"
import { createClient } from "@/lib/supabase/client"
import { IMAGE_MAX_DIMENSION } from "@/lib/constants"

type Props = {
  ownerId: string
  pageId: string
  backgroundUrl: string | null
  onChange: (url: string | null) => Promise<void>
}

export function BackgroundUpload({
  ownerId,
  pageId,
  backgroundUrl,
  onChange
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setBusy(true)
    try {
      const compressed = await compressImage(file, {
        maxWidthOrHeight: Math.round(IMAGE_MAX_DIMENSION * 1.5),
        maxSizeMB: 1.5
      })
      const supabase = createClient()
      // Convention : <ownerId>/<pageId>/background-<ts>.webp
      const path = `${ownerId}/${pageId}/background-${Date.now()}.webp`
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
      <Label>Image de fond</Label>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        onChange={handleSelect}
      />
      {backgroundUrl ? (
        <div className="overflow-hidden rounded-xl border border-input">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backgroundUrl}
              alt=""
              className="h-32 w-full object-cover"
            />
            {busy && (
              <div className="absolute inset-0 grid place-items-center bg-black/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
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
          className="flex h-28 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          Téléverser une image
        </button>
      )}
    </div>
  )
}
