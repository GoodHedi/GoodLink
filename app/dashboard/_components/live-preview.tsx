"use client"

import { PhoneFrame } from "@/components/phone-frame"
import { PublicProfile } from "@/components/public-profile"
import type { Link as LinkRow, Profile } from "@/types/database"

type Props = {
  profile: Profile
  links: LinkRow[]
}

export function LivePreview({ profile, links }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Aperçu
      </p>
      <PhoneFrame>
        <PublicProfile profile={profile} links={links} showFooter />
      </PhoneFrame>
    </div>
  )
}
