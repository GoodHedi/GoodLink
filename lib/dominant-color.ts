"use client"

/**
 * Extrait la couleur "moyenne" d'une image client-side via le truc du
 * canvas 1×1 : le navigateur fait l'interpolation linéaire de tous les
 * pixels en un seul, ce qui donne la moyenne RGB de l'image.
 *
 * Suffisant pour habiller le fond autour d'une page Linktree-style.
 * Les vraies extractions "dominantes" (k-means) sont plus précises mais
 * coûtent ~3-5KB de JS — pas justifié pour ce besoin.
 */
export async function getDominantColor(file: File | Blob): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return averageColorHex(img)
  } catch {
    // Fallback : couleur de marque par défaut
    return "#0F291E"
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = src
  })
}

function averageColorHex(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d")
  if (!ctx) return "#0F291E"

  ctx.drawImage(img, 0, 0, 1, 1)

  try {
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return rgbToHex(r, g, b)
  } catch {
    // Sécurité : si le canvas est tainted (ne devrait pas arriver avec un
    // Blob local), fallback sur la couleur de marque.
    return "#0F291E"
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0"))
      .join("")
  )
}
