import type { FontFamily, LinkShape } from "@/types/database"

// =====================================================================
// Forme des boutons lien
// =====================================================================
export const LINK_SHAPES: { value: LinkShape; label: string; className: string }[] =
  [
    { value: "pill", label: "Pilule", className: "rounded-full" },
    { value: "rounded", label: "Arrondi", className: "rounded-2xl" },
    { value: "square", label: "Carré", className: "rounded-none" }
  ]

export function shapeClass(shape: LinkShape): string {
  return LINK_SHAPES.find((s) => s.value === shape)?.className ?? "rounded-2xl"
}

// =====================================================================
// Polices : map vers les variables CSS chargées dans app/layout.tsx
// =====================================================================
export const FONT_FAMILIES: {
  value: FontFamily
  label: string
  cssVar: string
  preview: string
}[] = [
  {
    value: "sans",
    label: "Sans",
    cssVar: "var(--font-sans)",
    preview: "Aa Sans"
  },
  {
    value: "serif",
    label: "Serif",
    cssVar: "var(--font-serif)",
    preview: "Aa Serif"
  },
  {
    value: "mono",
    label: "Mono",
    cssVar: "var(--font-mono)",
    preview: "Aa Mono"
  },
  {
    value: "display",
    label: "Display",
    cssVar: "var(--font-display)",
    preview: "Aa Display"
  }
]

export function fontFamilyVar(family: FontFamily): string {
  return (
    FONT_FAMILIES.find((f) => f.value === family)?.cssVar ?? "var(--font-sans)"
  )
}

// =====================================================================
// Templates pré-faits : appliquent plusieurs champs en un clic
// =====================================================================
export type TemplateStyle = {
  background_color: string
  link_color: string
  link_shape: LinkShape
  font_family: FontFamily
}

export type Template = {
  id: string
  name: string
  style: TemplateStyle
}

export const TEMPLATES: Template[] = [
  {
    id: "cream",
    name: "Cream",
    style: {
      background_color: "#F3EFE9",
      link_color: "#FFFFFF",
      link_shape: "pill",
      font_family: "sans"
    }
  },
  {
    id: "forest",
    name: "Forest",
    style: {
      background_color: "#0F291E",
      link_color: "#FFFFFF",
      link_shape: "pill",
      font_family: "sans"
    }
  },
  {
    id: "brutalist",
    name: "Brutalist",
    style: {
      background_color: "#000000",
      link_color: "#FFFFFF",
      link_shape: "square",
      font_family: "mono"
    }
  },
  {
    id: "editorial",
    name: "Éditorial",
    style: {
      background_color: "#FAFAFA",
      link_color: "#0F291E",
      link_shape: "square",
      font_family: "serif"
    }
  },
  {
    id: "vibrant",
    name: "Vibrant",
    style: {
      background_color: "#23C45A",
      link_color: "#0F291E",
      link_shape: "rounded",
      font_family: "display"
    }
  },
  {
    id: "midnight",
    name: "Midnight",
    style: {
      background_color: "#0A0A0F",
      link_color: "#23C45A",
      link_shape: "rounded",
      font_family: "mono"
    }
  }
]
