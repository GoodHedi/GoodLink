"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useDebounce } from "@/lib/hooks/use-debounce"
import {
  setPageAvatarUrlAction,
  setPageBackgroundDesktopUrlAction,
  setPageBackgroundUrlAction,
  updatePageAction
} from "../actions"
import { ProfileSection } from "./profile-section"
import { AppearanceSection } from "./appearance-section"
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

export function DashboardEditor({
  page: initialPage,
  links: initialLinks,
  stats
}: Props) {
  const [page, setPage] = useState<Page>(initialPage)
  const [links, setLinks] = useState<LinkRow[]>(initialLinks)

  const dirtyRef = useRef(false)
  const debouncedPage = useDebounce(page, 600)

  useEffect(() => {
    if (!dirtyRef.current) return
    dirtyRef.current = false

    void updatePageAction(initialPage.id, {
      display_name: debouncedPage.display_name,
      bio: debouncedPage.bio ?? "",
      background_color: debouncedPage.background_color,
      background_overlay: debouncedPage.background_overlay
    }).then((result) => {
      if (!result.ok) toast.error(result.error)
    })
  }, [debouncedPage, initialPage.id])

  const updatePageLocal = useCallback((patch: Partial<Page>) => {
    dirtyRef.current = true
    setPage((prev) => ({ ...prev, ...patch }))
  }, [])

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
          <LinksSection
            pageId={page.id}
            links={links}
            onLinksChange={setLinks}
            clicksByLinkId={stats.clicksByLinkId}
          />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <LivePreview page={page} links={links} />
          </div>
        </aside>
      </div>
    </div>
  )
}
