import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

/**
 * Fetch d'une page publique par username + ses liens.
 * Mémoïsé via React.cache pour partager une seule lecture
 * entre generateMetadata et le composant page.
 */
export const getPageByUsername = cache(async (username: string) => {
  const supabase = await createClient()

  const { data: page } = await supabase
    .from("pages")
    .select(
      "id, username, display_name, bio, avatar_url, background_url, background_color, background_overlay, is_published"
    )
    .eq("username", username)
    .eq("is_published", true)
    .maybeSingle()

  if (!page) return null

  const { data: links } = await supabase
    .from("links")
    .select("id, type, title, url, platform, position")
    .eq("page_id", page.id)
    .order("position", { ascending: true })

  return { page, links: links ?? [] }
})

export type PublicPageData = NonNullable<
  Awaited<ReturnType<typeof getPageByUsername>>
>
