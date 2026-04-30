"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Loader2,
  Mic,
  Music2,
  Square,
  Trash2,
  Upload,
  UploadCloud
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useFileDrop } from "@/lib/hooks/use-file-drop"
import { createClient } from "@/lib/supabase/client"
import { isUuid } from "@/lib/uuid"

const MAX_BYTES = 1 * 1024 * 1024 // 1 MB strict
const MAX_RECORD_SECONDS = 60 // garde-fou pour ne pas dépasser 1 MB en webm/opus

/**
 * Whitelist stricte des Content-Type stockés. Le navigateur peut renvoyer
 * `text/html` pour un fichier renommé en .mp3 — on refuse de propager ça
 * vers le bucket public Supabase pour éviter qu'il serve du HTML.
 */
const ALLOWED_AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg"
])

/** Extension → MIME canonique pour fallback si type navigateur inconnu. */
const EXT_TO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  webm: "audio/webm"
}

function safeAudioContentType(rawType: string, ext: string): string | null {
  const t = rawType.toLowerCase().split(";")[0]?.trim()
  if (t && ALLOWED_AUDIO_MIMES.has(t)) return t
  // Pas un MIME audio propre → essaie via l'extension
  return EXT_TO_MIME[ext.toLowerCase()] ?? null
}

type Props = {
  pageId: string
  audioUrl: string | null
  onChange: (url: string | null) => Promise<void>
}

type Mode = "upload" | "record"

export function AudioUpload({ pageId, audioUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [busy, setBusy] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>("upload")

  useEffect(() => {
    setDuration(null)
  }, [audioUrl])

  // ----- Validation + upload commun (drop, file picker, recorder) -----
  const processBlob = useCallback(
    async (blob: Blob, ext: string, contentType: string) => {
      if (blob.size > MAX_BYTES) {
        toast.error(
          `Fichier trop lourd : ${(blob.size / 1024 / 1024).toFixed(2)} MB. Limite 1 MB.`
        )
        return
      }

      // Whitelist du Content-Type avant envoi au bucket public.
      const safeType = safeAudioContentType(contentType, ext)
      if (!safeType) {
        toast.error("Format audio non supporté.")
        return
      }

      // Garde-fou : pageId doit être un UUID propre avant d'être concaténé
      // dans le path storage (anti path injection / corruption).
      if (!isUuid(pageId)) {
        toast.error("Identifiant de page invalide.")
        return
      }

      setBusy(true)
      try {
        const supabase = createClient()
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Pas connecté.")
        const path = `${user.id}/${pageId}/audio-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from("audios")
          .upload(path, blob, {
            upsert: true,
            contentType: safeType
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
    },
    [onChange, pageId]
  )

  const handleFile = useCallback(
    async (file: File) => {
      const isAudio =
        file.type.startsWith("audio/") ||
        /\.(mp3|m4a|aac|ogg|webm)$/i.test(file.name)
      if (!isAudio) {
        toast.error("Format audio non supporté.")
        return
      }
      const ext = (file.name.split(".").pop() || "mp3").toLowerCase()
      await processBlob(file, ext, file.type || "audio/mpeg")
    },
    [processBlob]
  )

  const { isDragOver, dropProps } = useFileDrop({
    accept: ["audio/"],
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
      <Label>Audio (optionnel)</Label>
      <p className="-mt-1 text-xs text-muted-foreground">
        1 audio léger par page (max 1 MB). Téléverse un fichier ou enregistre
        directement avec ton micro.
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
              onClick={() => setMode("upload")}
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
      ) : null}

      {/* Toggle mode */}
      <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors",
            mode === "upload"
              ? "bg-white text-forest shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UploadCloud className="mr-1 inline h-3.5 w-3.5" />
          Téléverser
        </button>
        <button
          type="button"
          onClick={() => setMode("record")}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors",
            mode === "record"
              ? "bg-white text-forest shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Mic className="mr-1 inline h-3.5 w-3.5" />
          Enregistrer
        </button>
      </div>

      {mode === "upload" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          {...dropProps}
          className={cn(
            "flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm font-medium transition-colors disabled:opacity-50",
            isDragOver
              ? "border-accent bg-accent/10 text-accent"
              : "border-input bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span>
            {isDragOver
              ? "Relâche pour téléverser"
              : "Téléverser ou glisser un audio"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            MP3/M4A/AAC/OGG/WebM · max 1 MB
          </span>
        </button>
      ) : (
        <AudioRecorder onRecorded={processBlob} disabled={busy} />
      )}
    </div>
  )
}

// ===== Sous-composant : enregistrement via MediaRecorder =====

function AudioRecorder({
  onRecorded,
  disabled
}: {
  onRecorded: (blob: Blob, ext: string, contentType: string) => Promise<void>
  disabled: boolean
}) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    return () => {
      // Cleanup au démontage
      stopStream()
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function start() {
    if (recording) return
    if (typeof MediaRecorder === "undefined") {
      toast.error("Ton navigateur ne supporte pas l'enregistrement audio.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Choisit le meilleur mime supporté (webm/opus = compact)
      const mime = pickSupportedMime()
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stopStream()
        const blobType = recorder.mimeType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: blobType })
        const ext = blobType.includes("ogg")
          ? "ogg"
          : blobType.includes("mp4")
            ? "m4a"
            : "webm"
        await onRecorded(blob, ext, blobType)
      }

      recorder.start()
      setRecording(true)
      setSeconds(0)
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          const next = s + 1
          if (next >= MAX_RECORD_SECONDS) {
            stop()
          }
          return next
        })
      }, 1000)
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible d'accéder au micro."
      toast.error(msg)
    }
  }

  function stop() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    const r = recorderRef.current
    if (r && r.state !== "inactive") {
      r.stop()
    }
    setRecording(false)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 p-5">
      {recording ? (
        <>
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
            Enregistrement…{" "}
            <span className="tabular-nums">{formatDuration(seconds)}</span>
          </div>
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={stop}
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Arrêter
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Limite : {MAX_RECORD_SECONDS}s ou 1 MB.
          </p>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="accent"
            size="sm"
            disabled={disabled}
            onClick={start}
          >
            <Mic className="h-3.5 w-3.5" />
            Démarrer l&apos;enregistrement
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Le navigateur va te demander l&apos;accès au micro.
          </p>
        </>
      )}
    </div>
  )
}

function pickSupportedMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4"
  ]
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return null
}

function formatDuration(s: number): string {
  if (!Number.isFinite(s)) return "—"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}
