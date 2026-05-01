"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PAGE_LIMIT_FREE } from "@/lib/constants"
import {
  createPageAction,
  deletePageAction,
  duplicatePageAction,
  movePageToWorkspaceAction
} from "../actions"
import { PageCard } from "./page-card"
import { NewPageForm } from "./new-page-form"
import type { Page } from "@/types/database"
import type { CreatePageInput } from "@/lib/validations/page"

export type MoveTarget = {
  id: string
  name: string
  is_personal: boolean
}

type Props = {
  workspaceId: string
  pages: Page[]
  viewCounts?: Record<string, number>
  moveTargets?: MoveTarget[]
  canShare?: boolean
}

export function PagesGrid({
  workspaceId,
  pages: initialPages,
  viewCounts = {},
  moveTargets = [],
  canShare = false
}: Props) {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [showCreate, setShowCreate] = useState(false)
  const [, startTransition] = useTransition()

  const atLimit = pages.length >= PAGE_LIMIT_FREE

  async function handleCreate(input: CreatePageInput): Promise<boolean> {
    const result = await createPageAction(workspaceId, input)
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    setPages((prev) => [...prev, result.data])
    toast.success("Page créée")
    // Redirect direct vers l'éditeur
    router.push(`/dashboard/pages/${result.data.id}`)
    return true
  }

  async function handleDelete(pageId: string) {
    const previous = pages
    setPages(previous.filter((p) => p.id !== pageId))
    startTransition(async () => {
      const result = await deletePageAction(pageId)
      if (!result.ok) {
        toast.error(result.error)
        setPages(previous)
      } else {
        toast.success("Page supprimée")
      }
    })
  }

  async function handleDuplicate(pageId: string) {
    const result = await duplicatePageAction(pageId)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setPages((prev) => [...prev, result.data])
    toast.success(`Copie créée : @${result.data.username}`)
  }

  async function handleMove(pageId: string, targetWorkspaceId: string) {
    const previous = pages
    // Optimistic : retire la page du workspace courant
    setPages(previous.filter((p) => p.id !== pageId))
    const result = await movePageToWorkspaceAction(pageId, targetWorkspaceId)
    if (!result.ok) {
      toast.error(result.error)
      setPages(previous)
      return
    }
    const target = moveTargets.find((m) => m.id === targetWorkspaceId)
    toast.success(
      target ? `Page déplacée vers « ${target.name} »` : "Page déplacée"
    )
  }

  if (pages.length === 0 && !showCreate) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-white py-16 px-6 text-center">
        <h2 className="text-xl font-bold text-forest">
          Tu n&apos;as encore aucune page
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Crée ta première page GoodLink pour commencer à partager tes liens.
        </p>
        <Button
          variant="accent"
          size="lg"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" />
          Créer ma première page
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showCreate && (
        <NewPageForm
          onCreate={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <PageCard
            key={page.id}
            page={page}
            viewCount={viewCounts[page.id] ?? 0}
            onDelete={() => handleDelete(page.id)}
            onDuplicate={() => handleDuplicate(page.id)}
            onMove={(targetId) => handleMove(page.id, targetId)}
            moveTargets={moveTargets}
            atLimit={atLimit}
            canShare={canShare}
          />
        ))}

        {!showCreate && !atLimit && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-white text-sm font-medium text-muted-foreground transition-all hover:border-forest hover:bg-cream/50 hover:text-forest"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground">
              <Plus className="h-5 w-5" />
            </div>
            Nouvelle page
          </button>
        )}

        {!showCreate && atLimit && (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 text-center text-xs text-muted-foreground">
            Limite de {PAGE_LIMIT_FREE} pages atteinte
          </div>
        )}
      </div>
    </div>
  )
}
