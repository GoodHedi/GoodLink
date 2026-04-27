"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { FormField } from "@/components/ui/form-field"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AvatarUpload } from "./avatar-upload"
import { BIO_MAX, DISPLAY_NAME_MAX } from "@/lib/constants"
import type { Profile } from "@/types/database"

type Props = {
  profile: Profile
  onChange: (patch: Partial<Profile>) => void
  onAvatarChange: (url: string | null) => Promise<void>
}

export function ProfileSection({ profile, onChange, onAvatarChange }: Props) {
  const bioLength = (profile.bio ?? "").length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>
          Ce que les visiteurs verront en haut de ta page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <AvatarUpload
          profileId={profile.id}
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name}
          username={profile.username}
          onChange={onAvatarChange}
        />

        <FormField
          label="Nom affiché"
          name="display_name"
          value={profile.display_name}
          onChange={(e) => onChange({ display_name: e.target.value })}
          maxLength={DISPLAY_NAME_MAX}
          placeholder="Pierre Dupont"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio">Bio</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {bioLength}/{BIO_MAX}
            </span>
          </div>
          <Textarea
            id="bio"
            name="bio"
            value={profile.bio ?? ""}
            onChange={(e) => onChange({ bio: e.target.value })}
            maxLength={BIO_MAX}
            placeholder="Quelques mots sur toi…"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
