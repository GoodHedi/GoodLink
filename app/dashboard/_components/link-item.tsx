"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ExternalLink,
  GripVertical,
  Heading,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LINK_TITLE_MAX, LINK_URL_MAX } from "@/lib/constants"
import { SocialIcon } from "@/components/social-icon"
import { isSocialPlatform, SOCIAL_PLATFORM_META } from "@/lib/social-platforms"
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

  const style = { transform: CSS.Transform.toString(transform), transition }

  const [title, setTitle] = useState(link.title)
  const [url, setUrl] = useState(link.url)

  async function commit() {
    const trimmedTitle = title.trim()
    const trimmedUrl = url.trim()

    if (link.type === "header") {
      if (trimmedTitle === link.title) return
      if (!trimmedTitle) {
        setTitle(link.title)
        return
      }
      await onUpdate({
        type: "header",
        id: link.id,
        title: trimmedTitle
      })
      return
    }

    if (link.type === "social") {
      if (trimmedTitle === link.title && trimmedUrl === link.url) return
      if (!trimmedTitle || !trimmedUrl || !isSocialPlatform(link.platform)) {
        setTitle(link.title)
        setUrl(link.url)
        return
      }
      await onUpdate({
        type: "social",
        id: link.id,
        title: trimmedTitle,
        url: trimmedUrl,
        platform: link.platform
      })
      return
    }

    // type 'link'
    if (trimmedTitle === link.title && trimmedUrl === link.url) return
    if (!trimmedTitle || !trimmedUrl) {
      setTitle(link.title)
      setUrl(link.url)
      return
    }
    await onUpdate({
      type: "link",
      id: link.id,
      title: trimmedTitle,
      url: trimmedUrl
    })
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  // Indicateur visuel par type (icône à gauche)
  const typeIcon =
    link.type === "header" ? (
      <Heading className="h-4 w-4" />
    ) : link.type === "social" && isSocialPlatform(link.platform) ? (
      <SocialIcon platform={link.platform} className="h-4 w-4" />
    ) : null

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded-xl border bg-card p-2.5 shadow-soft transition-shadow",
        link.type === "header" && "bg-cream/40 border-dashed",
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

      {typeIcon && (
        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            link.type === "social"
              ? "text-forest"
              : "text-muted-foreground"
          )}
          style={
            link.type === "social" && isSocialPlatform(link.platform)
              ? { backgroundColor: SOCIAL_PLATFORM_META[link.platform].color + "20" }
              : undefined
          }
          aria-hidden
        >
          {typeIcon}
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-0.5 px-1">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          maxLength={LINK_TITLE_MAX}
          placeholder={
            link.type === "header" ? "Titre de section" : "Titre du lien"
          }
          className={cn(
            "w-full truncate bg-transparent text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none",
            link.type === "header" ? "text-forest/80" : "text-forest"
          )}
          aria-label="Titre"
        />
        {link.type !== "header" && (
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
        )}
      </div>

      {link.type !== "header" && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Tester le lien"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}

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
