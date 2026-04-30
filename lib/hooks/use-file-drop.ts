"use client"

import { useCallback, useState } from "react"

type Options = {
  /** Si fourni, n'accepte que les fichiers dont le MIME match au moins un préfixe (ex. "image/", "audio/"). */
  accept?: string[]
  /** Si fourni, n'accepte qu'un seul fichier (le 1er) — par défaut true. */
  single?: boolean
  /** Appelé quand un fichier valide est déposé. */
  onFile: (file: File) => void
}

/**
 * Hook utilitaire pour faire qu'un élément accepte des fichiers en drag & drop.
 *
 * Renvoie :
 *   - `dropProps` : props à étaler sur l'élément cible (gestion onDragOver, onDragLeave, onDrop, onDragEnter)
 *   - `isDragOver` : true tant qu'un drag est au-dessus de l'élément (pour le styler)
 *
 * Usage :
 *   const { dropProps, isDragOver } = useFileDrop({ accept: ["image/"], onFile: handleFile })
 *   <div {...dropProps} className={isDragOver ? "ring-2 ring-accent" : ""} />
 */
export function useFileDrop({ accept, single = true, onFile }: Options) {
  const [isDragOver, setIsDragOver] = useState(false)

  const matches = useCallback(
    (file: File) => {
      if (!accept || accept.length === 0) return true
      return accept.some((prefix) => file.type.startsWith(prefix))
    },
    [accept]
  )

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragOver(true)
    }
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Ne désactive que si on quitte vraiment l'élément (pas un enfant)
    if (
      e.currentTarget instanceof Node &&
      e.relatedTarget instanceof Node &&
      e.currentTarget.contains(e.relatedTarget)
    ) {
      return
    }
    setIsDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      const valid = files.filter(matches)
      if (valid.length === 0) return
      if (single) {
        onFile(valid[0]!)
      } else {
        for (const f of valid) onFile(f)
      }
    },
    [matches, onFile, single]
  )

  return {
    isDragOver,
    dropProps: {
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop
    }
  }
}
