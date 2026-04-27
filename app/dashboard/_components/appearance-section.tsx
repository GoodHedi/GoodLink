"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { BackgroundUpload } from "./background-upload"
import type { Page } from "@/types/database"

type Props = {
  page: Page
  onChange: (patch: Partial<Page>) => void
  onBackgroundChange: (url: string | null) => Promise<void>
}

const SUGGESTED_COLORS = [
  "#F3EFE9",
  "#FFFFFF",
  "#0F291E",
  "#23C45A",
  "#FCA5A5",
  "#FCD34D",
  "#A78BFA",
  "#60A5FA"
]

export function AppearanceSection({
  page,
  onChange,
  onBackgroundChange
}: Props) {
  const hasBackground = Boolean(page.background_url)

  function handleHexInput(value: string) {
    if (!/^#?[0-9a-fA-F]{0,6}$/.test(value)) return
    onChange({
      background_color: value.startsWith("#") ? value : `#${value}`
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apparence</CardTitle>
        <CardDescription>
          Couleur unie ou image personnalisée pour cette page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BackgroundUpload
          ownerId={page.owner_id}
          pageId={page.id}
          backgroundUrl={page.background_url}
          onChange={onBackgroundChange}
        />

        {!hasBackground && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="bg-color">Couleur de fond</Label>
            <div className="flex items-center gap-3">
              <input
                id="bg-color"
                type="color"
                value={page.background_color}
                onChange={(e) =>
                  onChange({ background_color: e.target.value })
                }
                className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
                aria-label="Sélecteur de couleur"
              />
              <input
                type="text"
                value={page.background_color}
                onChange={(e) => handleHexInput(e.target.value)}
                className="h-11 flex-1 rounded-xl border border-input bg-background px-4 font-mono text-sm uppercase focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                maxLength={7}
                aria-label="Code hexadécimal"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTED_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="h-8 w-8 rounded-full border border-border ring-offset-2 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{ backgroundColor: color }}
                  aria-label={`Choisir la couleur ${color}`}
                  onClick={() => onChange({ background_color: color })}
                />
              ))}
            </div>
          </div>
        )}

        {hasBackground && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <Label>Voile sombre</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {Math.round(page.background_overlay * 100)}%
              </span>
            </div>
            <Slider
              value={[page.background_overlay]}
              onValueChange={([v]) =>
                onChange({ background_overlay: v ?? 0 })
              }
              min={0}
              max={0.8}
              step={0.05}
              aria-label="Opacité du voile sombre"
            />
            <p className="text-xs text-muted-foreground">
              Augmente le voile pour rendre le texte plus lisible si l&apos;image
              est claire.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
