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
import type { Page } from "@/types/database"

type Props = {
  page: Page
  onChange: (patch: Partial<Page>) => void
  onAvatarChange: (url: string | null) => Promise<void>
}

export function ProfileSection({ page, onChange, onAvatarChange }: Props) {
  const bioLength = (page.bio ?? "").length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identité</CardTitle>
        <CardDescription>
          Ce que les visiteurs verront en haut de cette page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <AvatarUpload
          pageId={page.id}
          avatarUrl={page.avatar_url}
          displayName={page.display_name}
          username={page.username}
          onChange={onAvatarChange}
        />

        <FormField
          label="Nom affiché"
          name="display_name"
          value={page.display_name}
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
            value={page.bio ?? ""}
            onChange={(e) => onChange({ bio: e.target.value })}
            maxLength={BIO_MAX}
            placeholder="Quelques mots sur cette page…"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
