"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useDebounce } from "@/lib/hooks/use-debounce"
import {
  setAvatarUrlAction,
  setBackgroundUrlAction,
  updateProfileAction
} from "../actions"
import { ProfileSection } from "./profile-section"
import { AppearanceSection } from "./appearance-section"
import { LinksSection } from "./links-section"
import { LivePreview } from "./live-preview"
import type { Link as LinkRow, Profile } from "@/types/database"

type Props = {
  profile: Profile
  links: LinkRow[]
}

export function DashboardEditor({
  profile: initialProfile,
  links: initialLinks
}: Props) {
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [links, setLinks] = useState<LinkRow[]>(initialLinks)

  // Auto-save debouncé pour les champs profil. Marqué dirty uniquement quand
  // l'utilisateur modifie ces champs (pas quand l'avatar / le bg changent,
  // qui ont leurs propres actions).
  const dirtyRef = useRef(false)
  const debouncedProfile = useDebounce(profile, 600)

  useEffect(() => {
    if (!dirtyRef.current) return
    dirtyRef.current = false

    void updateProfileAction({
      display_name: debouncedProfile.display_name,
      bio: debouncedProfile.bio ?? "",
      background_color: debouncedProfile.background_color,
      background_overlay: debouncedProfile.background_overlay
    }).then((result) => {
      if (!result.ok) toast.error(result.error)
    })
  }, [debouncedProfile])

  const updateProfileLocal = useCallback((patch: Partial<Profile>) => {
    dirtyRef.current = true
    setProfile((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleAvatarChange = useCallback(async (url: string | null) => {
    setProfile((prev) => ({ ...prev, avatar_url: url }))
    const result = await setAvatarUrlAction(url)
    if (!result.ok) {
      toast.error(result.error)
    } else {
      toast.success(url ? "Avatar mis à jour" : "Avatar retiré")
    }
  }, [])

  const handleBackgroundChange = useCallback(async (url: string | null) => {
    setProfile((prev) => ({ ...prev, background_url: url }))
    const result = await setBackgroundUrlAction(url)
    if (!result.ok) {
      toast.error(result.error)
    } else {
      toast.success(url ? "Image de fond mise à jour" : "Image de fond retirée")
    }
  }, [])

  return (
    <div className="container py-6 lg:py-10">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
          Bonjour {profile.display_name || `@${profile.username}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          Personnalise ta page. Les changements sont enregistrés
          automatiquement.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="space-y-6 lg:max-w-2xl">
          <ProfileSection
            profile={profile}
            onChange={updateProfileLocal}
            onAvatarChange={handleAvatarChange}
          />
          <AppearanceSection
            profile={profile}
            onChange={updateProfileLocal}
            onBackgroundChange={handleBackgroundChange}
          />
          <LinksSection links={links} onLinksChange={setLinks} />
        </div>

        {/* Aperçu sticky en desktop. Sur mobile, on s'appuie sur le bouton
            "Voir ma page" du header. */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <LivePreview profile={profile} links={links} />
          </div>
        </aside>
      </div>
    </div>
  )
}
