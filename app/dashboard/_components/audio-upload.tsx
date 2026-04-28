"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Music2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const MAX_BYTES = 1 * 1024 * 1024 // 1 MB strict
const ACCEPTED = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/aac", "audio/webm", "audio/ogg"]

type Props = {
  ownerId: string
  pageId: string
  audioUrl: string | null
  onChange: (url: string | null) => Promise<void>
}

export function AudioUpload({ ownerId, pageId, audioUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [busy, setBusy] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)

  useEffect(() => {
    setDuration(null)
  }, [audioUrl])

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(mp3|m4a|aac|ogg|webm)$/i)) {
      toast.error("Format audio non supporté (MP3/M4A/AAC/OGG/WebM).")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error(
        `Fichier trop lourd : ${(file.size / 1024 / 1024).toFixed(2)} MB. Limite 1 MB.`
      )
      return
    }

    setBusy(true)
    try {
      const supabase = createClient()
      const ext = (file.name.split(".").pop() || "mp3").toLowerCase()
      const path = `${ownerId}/${pageId}/audio-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("audios")
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "audio/mpeg"
        })
      if (upErr) throw new Error(upErr.message)

      const {
        data: { publicUrl }
      } = supabase.storage.from("audios").getPublicUrl(path)

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
      <Label>Audio (optionnel)</Label>
      <p className="-mt-1 text-xs text-muted-foreground">
        1 audio léger par page (max 1 MB). MP3/M4A/AAC/OGG/WebM.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="sr-only"
        onChange={handleSelect}
      />
      {audioUrl ? (
        <div className="overflow-hidden rounded-xl border border-input">
          <div className="flex items-center gap-3 bg-muted/30 p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
              <Music2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                preload="metadata"
                className="h-9 w-full"
                onLoadedMetadata={(e) =>
                  setDuration(e.currentTarget.duration)
                }
              />
              {duration !== null && (
                <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                  Durée : {formatDuration(duration)}
                </p>
              )}
            </div>
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
          className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          Téléverser un audio
        </button>
      )}
    </div>
  )
}

function formatDuration(s: number): string {
  if (!Number.isFinite(s)) return "—"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}
