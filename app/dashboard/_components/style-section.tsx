"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  FONT_FAMILIES,
  LINK_SHAPES,
  TEMPLATES,
  type Template
} from "@/lib/style-options"
import type { Page } from "@/types/database"

type Props = {
  page: Page
  onChange: (patch: Partial<Page>) => void
}

export function StyleSection({ page, onChange }: Props) {
  function applyTemplate(t: Template) {
    onChange(t.style)
  }

  function handleHexInput(value: string) {
    if (!/^#?[0-9a-fA-F]{0,6}$/.test(value)) return
    onChange({ link_color: value.startsWith("#") ? value : `#${value}` })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Style</CardTitle>
        <CardDescription>
          Couleurs, forme des boutons, typographie. Choisis un template ou
          ajuste à la main.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Templates */}
        <div className="space-y-2">
          <Label>Templates</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-2 transition-all hover:border-forest hover:-translate-y-0.5 hover:shadow-soft"
                aria-label={`Appliquer le template ${t.name}`}
              >
                <div
                  className="flex h-12 w-full flex-col items-center justify-center gap-1 rounded-lg p-1.5"
                  style={{ backgroundColor: t.style.background_color }}
                >
                  <div
                    className={cn(
                      "h-1.5 w-7",
                      t.style.link_shape === "pill" && "rounded-full",
                      t.style.link_shape === "rounded" && "rounded",
                      t.style.link_shape === "square" && "rounded-none"
                    )}
                    style={{ backgroundColor: t.style.link_color }}
                  />
                  <div
                    className={cn(
                      "h-1.5 w-5",
                      t.style.link_shape === "pill" && "rounded-full",
                      t.style.link_shape === "rounded" && "rounded",
                      t.style.link_shape === "square" && "rounded-none"
                    )}
                    style={{ backgroundColor: t.style.link_color }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-forest">
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Couleur des liens */}
        <div className="space-y-2">
          <Label htmlFor="link-color">Couleur des boutons</Label>
          <div className="flex items-center gap-3">
            <input
              id="link-color"
              type="color"
              value={page.link_color}
              onChange={(e) => onChange({ link_color: e.target.value })}
              className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
              aria-label="Sélecteur de couleur des liens"
            />
            <input
              type="text"
              value={page.link_color}
              onChange={(e) => handleHexInput(e.target.value)}
              className="h-11 flex-1 rounded-xl border border-input bg-background px-4 font-mono text-sm uppercase focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              maxLength={7}
              aria-label="Code hexadécimal"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            La couleur du texte s&apos;ajuste automatiquement pour rester
            lisible.
          </p>
        </div>

        {/* Forme des liens */}
        <div className="space-y-2">
          <Label>Forme des boutons</Label>
          <div className="grid grid-cols-3 gap-2">
            {LINK_SHAPES.map((s) => {
              const active = page.link_shape === s.value
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onChange({ link_shape: s.value })}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 bg-background p-3 transition-all",
                    active
                      ? "border-forest"
                      : "border-border hover:border-forest/40"
                  )}
                  aria-pressed={active}
                >
                  <div
                    className={cn(
                      "h-3 w-12 bg-forest",
                      s.className
                    )}
                  />
                  <span className="text-xs font-semibold text-forest">
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Police */}
        <div className="space-y-2">
          <Label>Police</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FONT_FAMILIES.map((f) => {
              const active = page.font_family === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => onChange({ font_family: f.value })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border-2 bg-background p-3 transition-all",
                    active
                      ? "border-forest"
                      : "border-border hover:border-forest/40"
                  )}
                  style={{ fontFamily: f.cssVar }}
                  aria-pressed={active}
                >
                  <span className="text-lg font-bold text-forest">
                    {f.preview}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {f.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
