"use client"

import { useCallback, useRef, useState } from "react"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useFileDrop } from "@/lib/hooks/use-file-drop"
import { ACCEPTED_IMAGE_TYPES, compressImage } from "@/lib/image-compression"
import { createClient } from "@/lib/supabase/client"
import { isUuid } from "@/lib/uuid"

type Props = {
  pageId: string
  avatarUrl: string | null
  displayName: string
  username: string
  onChange: (url: string | null) => Promise<void>
}

export function AvatarUpload({
  pageId,
  avatarUrl,
  displayName,
  username,
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
        const compressed = await compressImage(file)
        const supabase = createClient()
        // Le 1er dossier doit être l'ID de l'uploader (auth.uid()) pour passer la
        // RLS storage. Pas page.owner_id : un editor invité n'est pas owner_id.
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Pas connecté.")
        const path = `${user.id}/${pageId}/avatar-${Date.now()}.webp`
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

        await onChange(publicUrl)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de l'upload.")
      } finally {
        setBusy(false)
      }
    },
    [onChange, pageId]
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

  const initial = (displayName || username).charAt(0).toUpperCase() || "?"

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        {...dropProps}
        className={cn(
          "relative shrink-0 rounded-full transition-all",
          isDragOver && "ring-4 ring-accent ring-offset-2"
        )}
        aria-label="Changer l'avatar"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-20 w-20 rounded-full object-cover ring-4 ring-cream shadow-soft"
          />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-2xl font-bold text-forest ring-4 ring-cream shadow-soft">
            {initial}
          </div>
        )}
        {(busy || isDragOver) && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white">
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </div>
        )}
      </button>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          onChange={handleSelect}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          {avatarUrl ? "Changer la photo" : "Ajouter une photo"}
        </Button>
        {avatarUrl && (
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
        )}
        <p className="text-[10px] text-muted-foreground">
          Tu peux aussi glisser une image sur l&apos;avatar.
        </p>
      </div>
    </div>
  )
}
