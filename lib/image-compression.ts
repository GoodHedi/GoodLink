"use client"

import imageCompression from "browser-image-compression"
import {
  IMAGE_INPUT_MAX_MB,
  IMAGE_MAX_DIMENSION,
  IMAGE_MAX_SIZE_MB
} from "@/lib/constants"

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif"
]

export type CompressOptions = {
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

/**
 * Valide puis compresse une image côté client (Web Worker), produit du WebP.
 * Lance une erreur lisible si le fichier n'est pas une image ou est trop gros.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Format d'image non supporté. Utilise JPG, PNG, WebP ou GIF.")
  }

  if (file.size > IMAGE_INPUT_MAX_MB * 1024 * 1024) {
    throw new Error(`Image trop volumineuse (max ${IMAGE_INPUT_MAX_MB} Mo).`)
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: options.maxSizeMB ?? IMAGE_MAX_SIZE_MB,
    maxWidthOrHeight: options.maxWidthOrHeight ?? IMAGE_MAX_DIMENSION,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.85
  })

  // Réécrit en File pour préserver un nom de fichier déterministe.
  return new File([compressed], swapExtension(file.name, "webp"), {
    type: "image/webp",
    lastModified: Date.now()
  })
}

function swapExtension(name: string, ext: string): string {
  const dot = name.lastIndexOf(".")
  const base = dot === -1 ? name : name.slice(0, dot)
  return `${base}.${ext}`
}
