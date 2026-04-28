/**
 * Choisit une couleur de texte (forest sombre ou cream clair) qui contraste
 * avec une couleur de fond hex donnée. Utilise la luminance perçue (BT.601).
 */
export function pickTextColor(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16)
  const g = parseInt(bgHex.slice(3, 5), 16)
  const b = parseInt(bgHex.slice(5, 7), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return "#0F291E"
  }
  // Luminance perçue 0..1
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#0F291E" : "#FFFFFF"
}
