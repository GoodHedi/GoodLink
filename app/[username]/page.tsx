import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { PublicProfile } from "@/components/public-profile"
import { getProfileByUsername } from "@/lib/profile"

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
  const data = await getProfileByUsername(username)

  if (!data) {
    return {
      title: "Profil introuvable",
      robots: { index: false, follow: false }
    }
  }

  const { profile } = data
  const displayName = profile.display_name || `@${profile.username}`
  const description =
    profile.bio?.trim() ||
    `Découvre les liens de ${displayName} sur GoodLink.`
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const url = `${siteUrl}/${profile.username}`

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
      images: profile.avatar_url
        ? [
            {
              url: profile.avatar_url,
              width: 400,
              height: 400,
              alt: displayName
            }
          ]
        : undefined
    },
    twitter: {
      card: profile.avatar_url ? "summary" : "summary_large_image",
      title: `${displayName} · GoodLink`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined
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

  const data = await getProfileByUsername(username)
  if (!data) notFound()

  return (
    <main className="flex min-h-svh flex-col">
      <PublicProfile
        profile={data.profile}
        links={data.links}
        className="flex-1"
      />
    </main>
  )
}
