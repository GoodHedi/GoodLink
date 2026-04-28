import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { PublicProfile } from "@/components/public-profile"
import { getPageByUsername } from "@/lib/page"
import { createClient } from "@/lib/supabase/server"

type Params = Promise<{ username: string }>

// Le client Supabase serveur lit les cookies → la page est dynamique de facto.
// On le force ici pour rendre le comportement explicite.
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params
}: {
  params: Params
}): Promise<Metadata> {
  const { username: rawUsername } = await params
  const username = rawUsername.toLowerCase()
  const data = await getPageByUsername(username)

  if (!data) {
    return {
      title: "Profil introuvable",
      robots: { index: false, follow: false }
    }
  }

  const { page } = data
  const displayName = page.display_name || `@${page.username}`
  const description =
    page.bio?.trim() ||
    `Découvre les liens de ${displayName} sur GoodLink.`
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const url = `${siteUrl}/${page.username}`

  return {
    title: displayName,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${displayName} · GoodLink`,
      description,
      url,
      type: "profile",
      locale: "fr_FR",
      images: page.avatar_url
        ? [
            {
              url: page.avatar_url,
              width: 400,
              height: 400,
              alt: displayName
            }
          ]
        : undefined
    },
    twitter: {
      card: page.avatar_url ? "summary" : "summary_large_image",
      title: `${displayName} · GoodLink`,
      description,
      images: page.avatar_url ? [page.avatar_url] : undefined
    }
  }
}

export default async function PublicProfilePage({
  params
}: {
  params: Params
}) {
  const { username: original } = await params
  const username = original.toLowerCase()

  // URL canonique en lowercase : /Pierre → /pierre (préserve le SEO).
  if (username !== original) {
    redirect(`/${username}`)
  }

  const data = await getPageByUsername(username)
  if (!data) notFound()

  // Track view (fire-and-forget — RLS autorise insert public sur page_views)
  // Awaité pour fiabilité ; ~50ms d'overhead.
  const supabase = await createClient()
  await supabase.from("page_views").insert({ page_id: data.page.id })

  return (
    <main className="flex min-h-svh flex-col">
      <PublicProfile
        profile={data.page}
        links={data.links}
        trackClicks
        className="flex-1"
      />
    </main>
  )
}
