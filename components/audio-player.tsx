"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  src: string
  /** Couleur d'accent — lue depuis page.link_color, par défaut blanc/forest selon contraste. */
  accentColor: string
  /** Couleur du texte / barres inactives. */
  baseColor: string
  /** Fond du lecteur (translucide sur fond image, plein sur fond uni). */
  surfaceClass?: string
}

const BARS = 36

/**
 * Lecteur audio compact avec fake waveform.
 * - Une barre par "tick" du waveform (BARS).
 * - Les hauteurs sont générées de façon déterministe à partir de l'URL
 *   (même rendu côté serveur/client → pas de mismatch d'hydratation).
 * - Pendant la lecture, les barres jusqu'à la position courante prennent
 *   accentColor + animation pulse subtile ; les autres restent baseColor.
 * - Clic sur la bande = seek à la position correspondante.
 */
export function AudioPlayer({
  src,
  accentColor,
  baseColor,
  surfaceClass
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const bandRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0) // 0 → 1

  // Générateur déterministe de hauteurs : hash simple de l'URL → seed.
  const heights = useMemo(() => generateHeights(src, BARS), [src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => {
      if (audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration)
      }
    }
    const onLoaded = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
    }
  }, [])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }

  function seekFromEvent(clientX: number) {
    const audio = audioRef.current
    const band = bandRef.current
    if (!audio || !band || !duration) return
    const rect = band.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
    setProgress(ratio)
  }

  const elapsed = duration * progress
  const activeIndex = Math.floor(progress * BARS)

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 backdrop-blur",
        surfaceClass
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause" : "Lire"}
        style={{ backgroundColor: accentColor }}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-soft transition-transform hover:scale-105 active:scale-95"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 translate-x-0.5 fill-current" />
        )}
      </button>

      <div
        ref={bandRef}
        role="slider"
        aria-label="Position de lecture"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        tabIndex={0}
        onClick={(e) => seekFromEvent(e.clientX)}
        onKeyDown={(e) => {
          const audio = audioRef.current
          if (!audio || !duration) return
          if (e.key === "ArrowRight") {
            audio.currentTime = Math.min(duration, audio.currentTime + 2)
          } else if (e.key === "ArrowLeft") {
            audio.currentTime = Math.max(0, audio.currentTime - 2)
          } else if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            toggle()
          }
        }}
        className="flex h-10 flex-1 cursor-pointer items-center gap-[2px]"
      >
        {heights.map((h, i) => {
          const isActive = i <= activeIndex
          return (
            <span
              key={i}
              aria-hidden
              className={cn(
                "block w-[3px] rounded-full transition-all duration-150",
                isPlaying && isActive && "animate-pulse"
              )}
              style={{
                height: `${h}%`,
                backgroundColor: isActive ? accentColor : baseColor,
                opacity: isActive ? 1 : 0.45
              }}
            />
          )
        })}
      </div>

      <span
        className="shrink-0 text-[11px] font-medium tabular-nums"
        style={{ color: baseColor }}
      >
        {formatTime(elapsed)} / {formatTime(duration)}
      </span>
    </div>
  )
}

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

/**
 * Hash simple (xfnv1a) → PRNG déterministe (mulberry32) → hauteurs.
 * Garantit le même rendu côté SSR et client (pas d'hydratation cassée).
 */
function generateHeights(seed: string, count: number): number[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let state = h >>> 0
  const rand = () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const arr: number[] = []
  for (let i = 0; i < count; i++) {
    // Petite enveloppe : plus haut au milieu, plus bas aux extrémités.
    const center = (i / (count - 1)) * 2 - 1 // -1 → 1
    const envelope = 1 - Math.pow(center, 2) * 0.55
    const noise = 0.35 + rand() * 0.65
    arr.push(Math.max(20, Math.min(95, noise * envelope * 100)))
  }
  return arr
}
