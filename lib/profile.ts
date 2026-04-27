import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

/**
 * Fetch d'un profil + liens, mémoïsé au sein d'une requête HTTP via React.cache.
 * Permet à `generateMetadata` et au composant page de partager une seule
 * lecture base.
 */
export const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, background_url, background_color, background_overlay"
    )
    .eq("username", username)
    .maybeSingle()

  if (!profile) return null

  const { data: links } = await supabase
    .from("links")
    .select("id, title, url, position")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })

  return { profile, links: links ?? [] }
})

export type PublicProfileData = NonNullable<
  Awaited<ReturnType<typeof getProfileByUsername>>
>
