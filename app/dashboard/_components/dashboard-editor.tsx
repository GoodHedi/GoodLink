"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  Check,
  Loader2,
  Save
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { cn } from "@/lib/utils"
import {
  setPageAvatarUrlAction,
  setPageBackgroundDesktopUrlAction,
  setPageBackgroundUrlAction,
  updatePageAction
} from "../actions"
import { ProfileSection } from "./profile-section"
import { AppearanceSection } from "./appearance-section"
import { StyleSection } from "./style-section"
import { LinksSection } from "./links-section"
import { LivePreview } from "./live-preview"
import { AnalyticsCard } from "./analytics-card"
import type { Link as LinkRow, Page } from "@/types/database"

export type PageStats = {
  totalViews: number
  totalClicks: number
  clicksByLinkId: Record<string, number>
}

type Props = {
  page: Page
  links: LinkRow[]
  stats: PageStats
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

export function DashboardEditor({
  page: initialPage,
  links: initialLinks,
  stats
}: Props) {
  const [page, setPage] = useState<Page>(initialPage)
  const [links, setLinks] = useState<LinkRow[]>(initialLinks)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")

  const debouncedPage = useDebounce(page, 800)

  /**
   * Sauvegarde côté serveur. Utilisée par l'auto-save (avec debouncedPage)
   * et par le bouton manuel (avec page courant immédiat).
   */
  const persist = useCallback(
    async (data: Page) => {
      setSaveStatus("saving")
      const result = await updatePageAction(initialPage.id, {
        display_name: data.display_name,
        bio: data.bio ?? "",
        background_color: data.background_color,
        background_overlay: data.background_overlay,
        link_color: data.link_color,
        link_shape: data.link_shape,
        font_family: data.font_family
      })
      if (result.ok) {
        setHasUnsaved(false)
        setSaveStatus("saved")
        // Repasse à idle après 2.5s pour ne pas garder le check vert ad vitam
        setTimeout(() => {
          setSaveStatus((prev) => (prev === "saved" ? "idle" : prev))
        }, 2500)
      } else {
        setSaveStatus("error")
        toast.error(result.error)
      }
    },
    [initialPage.id]
  )

  // Auto-save : déclenche quand debouncedPage se stabilise ET qu'il y a des
  // changements non sauvegardés.
  useEffect(() => {
    if (!hasUnsaved) return
    void persist(debouncedPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPage])

  const updatePageLocal = useCallback((patch: Partial<Page>) => {
    setHasUnsaved(true)
    setSaveStatus("idle")
    setPage((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleManualSave = useCallback(() => {
    void persist(page)
  }, [persist, page])

  const handleAvatarChange = useCallback(
    async (url: string | null) => {
      setPage((prev) => ({ ...prev, avatar_url: url }))
      const result = await setPageAvatarUrlAction(initialPage.id, url)
      if (!result.ok) {
        toast.error(result.error)
      } else {
        toast.success(url ? "Avatar mis à jour" : "Avatar retiré")
      }
    },
    [initialPage.id]
  )

  const handleBackgroundChange = useCallback(
    async (url: string | null) => {
      setPage((prev) => ({ ...prev, background_url: url }))
      const result = await setPageBackgroundUrlAction(initialPage.id, url)
      if (!result.ok) {
        toast.error(result.error)
      } else {
        toast.success(
          url ? "Fond mobile mis à jour" : "Fond mobile retiré"
        )
      }
    },
    [initialPage.id]
  )

  const handleBackgroundDesktopChange = useCallback(
    async (url: string | null) => {
      setPage((prev) => ({ ...prev, background_desktop_url: url }))
      const result = await setPageBackgroundDesktopUrlAction(
        initialPage.id,
        url
      )
      if (!result.ok) {
        toast.error(result.error)
      } else {
        toast.success(
          url ? "Fond desktop mis à jour" : "Fond desktop retiré"
        )
      }
    },
    [initialPage.id]
  )

  return (
    <div className="container py-6 lg:py-10">
      {/* Barre de sauvegarde sticky */}
      <div className="sticky top-[57px] z-20 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-border bg-cream/80 px-4 py-3 backdrop-blur sm:-mx-0 sm:rounded-2xl sm:border sm:bg-white sm:px-5 sm:shadow-soft">
        <SaveStatusIndicator
          status={saveStatus}
          hasUnsaved={hasUnsaved}
        />
        <Button
          type="button"
          onClick={handleManualSave}
          disabled={saveStatus === "saving" || (!hasUnsaved && saveStatus !== "error")}
          variant={hasUnsaved || saveStatus === "error" ? "accent" : "outline"}
          size="sm"
        >
          {saveStatus === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Sauvegarder
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="space-y-6 lg:max-w-2xl">
          <AnalyticsCard
            totalViews={stats.totalViews}
            totalClicks={stats.totalClicks}
          />
          <ProfileSection
            page={page}
            onChange={updatePageLocal}
            onAvatarChange={handleAvatarChange}
          />
          <AppearanceSection
            page={page}
            onChange={updatePageLocal}
            onBackgroundChange={handleBackgroundChange}
            onBackgroundDesktopChange={handleBackgroundDesktopChange}
          />
          <StyleSection page={page} onChange={updatePageLocal} />
          <LinksSection
            pageId={page.id}
            links={links}
            onLinksChange={setLinks}
            clicksByLinkId={stats.clicksByLinkId}
          />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <LivePreview page={page} links={links} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function SaveStatusIndicator({
  status,
  hasUnsaved
}: {
  status: SaveStatus
  hasUnsaved: boolean
}) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Sauvegarde…
      </span>
    )
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        <Check className="h-3.5 w-3.5" />
        Sauvegardé
      </span>
    )
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive">
        <AlertCircle className="h-3.5 w-3.5" />
        Erreur — réessaie
      </span>
    )
  }
  if (hasUnsaved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-forest">
        <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
        Modifications non sauvegardées
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
      )}
    >
      <Check className="h-3.5 w-3.5" />À jour
    </span>
  )
}
