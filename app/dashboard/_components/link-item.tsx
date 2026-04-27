"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ExternalLink, GripVertical, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { LINK_TITLE_MAX, LINK_URL_MAX } from "@/lib/constants"
import type { Link as LinkRow } from "@/types/database"
import type { UpdateLinkInput } from "@/lib/validations/links"

type Props = {
  link: LinkRow
  onUpdate: (input: UpdateLinkInput) => Promise<void>
  onDelete: () => Promise<void>
}

export function LinkItem({ link, onUpdate, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const [title, setTitle] = useState(link.title)
  const [url, setUrl] = useState(link.url)

  async function commit() {
    const trimmedTitle = title.trim()
    const trimmedUrl = url.trim()
    if (trimmedTitle === link.title && trimmedUrl === link.url) return
    if (!trimmedTitle || !trimmedUrl) {
      // Refus d'un champ vide : on revient à la valeur précédente.
      setTitle(link.title)
      setUrl(link.url)
      return
    }
    await onUpdate({ id: link.id, title: trimmedTitle, url: trimmedUrl })
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-soft transition-shadow",
        isDragging && "relative z-10 opacity-70 shadow-lift"
      )}
    >
      <button
        type="button"
        aria-label="Réordonner"
        className="touch-none cursor-grab rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0 space-y-0.5 px-1">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          maxLength={LINK_TITLE_MAX}
          placeholder="Titre du lien"
          className="w-full truncate bg-transparent text-sm font-semibold text-forest placeholder:text-muted-foreground/60 focus:outline-none"
          aria-label="Titre"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          maxLength={LINK_URL_MAX}
          placeholder="https://…"
          className="w-full truncate bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus:text-foreground focus:outline-none"
          aria-label="URL"
        />
      </div>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        title="Tester le lien"
        className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
      >
        <ExternalLink className="h-4 w-4" />
      </a>

      <button
        type="button"
        onClick={() => void onDelete()}
        title="Supprimer"
        aria-label="Supprimer le lien"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}
