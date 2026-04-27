"use client"

import Link from "next/link"
import { useState } from "react"
import { ExternalLink, Pencil, Trash2, EyeOff, Eye } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { togglePagePublishedAction } from "../actions"
import type { Page } from "@/types/database"

type Props = {
  page: Page
  onDelete: () => void
}

export function PageCard({ page, onDelete }: Props) {
  const [isPublished, setIsPublished] = useState(page.is_published)
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function togglePublished() {
    setBusy(true)
    const next = !isPublished
    setIsPublished(next)
    const result = await togglePagePublishedAction(page.id, next)
    if (!result.ok) {
      toast.error(result.error)
      setIsPublished(!next)
    } else {
      toast.success(next ? "Page publiée" : "Page mise en brouillon")
    }
    setBusy(false)
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift">
      {/* Preview header (couleur ou image) */}
      <div
        className="relative h-24"
        style={{
          backgroundColor: page.background_color,
          backgroundImage: page.background_url
            ? `url(${page.background_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {!isPublished && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            <EyeOff className="h-3 w-3" />
            Brouillon
          </span>
        )}

        {/* Avatar overlap */}
        <div className="absolute -bottom-7 left-4">
          {page.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.avatar_url}
              alt={page.display_name}
              className="h-14 w-14 rounded-full object-cover ring-4 ring-card"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-lg font-bold text-forest ring-4 ring-card">
              {(page.display_name || page.username).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4 pt-9">
        <div>
          <h3 className="truncate font-bold text-forest">
            {page.display_name || `@${page.username}`}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            agoodlink/{page.username}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" variant="default" className="flex-1">
            <Link href={`/dashboard/pages/${page.id}`}>
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Link>
          </Button>
          <Button
            asChild
            size="icon"
            variant="outline"
            title="Voir la page publique"
          >
            <Link
              href={`/${page.username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={togglePublished}
            disabled={busy}
            title={isPublished ? "Mettre en brouillon" : "Publier"}
          >
            {isPublished ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => {
              if (confirmingDelete) {
                onDelete()
              } else {
                setConfirmingDelete(true)
                setTimeout(() => setConfirmingDelete(false), 3000)
              }
            }}
            title={
              confirmingDelete ? "Re-clique pour confirmer" : "Supprimer"
            }
            className={cn(
              confirmingDelete &&
                "border-destructive text-destructive hover:bg-destructive/10"
            )}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}
