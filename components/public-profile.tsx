import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { SocialIcon } from "@/components/social-icon"
import { isSocialPlatform } from "@/lib/social-platforms"
import type { LinkType } from "@/types/database"

type ProfileSlice = {
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  /** Image de fond de la carte centrale (mobile + dans la carte sur desktop). */
  background_url: string | null
  /** Image de fond visible autour de la carte sur desktop uniquement. */
  background_desktop_url?: string | null
  background_color: string
  background_overlay: number
}

type LinkSlice = {
  id: string
  type: LinkType
  title: string
  url: string
  platform: string | null
}

type Props = {
  profile: ProfileSlice
  links: LinkSlice[]
  showFooter?: boolean
  /**
   * Si vrai, les clics sur les liens passent par `/r/<id>` qui logue
   * dans link_clicks puis redirige. Activé sur la page publique uniquement.
   */
  trackClicks?: boolean
  className?: string
}

/**
 * Rendu de la "page" GoodLink. Utilisé :
 *  - dans le mockup téléphone du dashboard (preview live)
 *  - sur la page publique /[username]
 *  - sur la landing pour l'exemple animé
 *
 * Gère 3 types de liens : link (bouton classique), header (séparateur de
 * section), social (bouton avec icône de plateforme).
 */
export function PublicProfile({
  profile,
  links,
  showFooter = true,
  trackClicks = false,
  className
}: Props) {
  const hasBg = Boolean(profile.background_url)
  const hasDesktopBg = Boolean(profile.background_desktop_url)
  const lightText = hasBg

  // Layout Linktree-current style :
  //  - Wrapper extérieur fill le viewport. Bg = image desktop si fournie,
  //    sinon couleur de fond.
  //  - Carte centrée max-w-md, coins arrondis en haut sur desktop.
  //    Contient l'image de fond mobile + l'overlay + le contenu.
  //  - Sur mobile : carte = full width, pas de différence visuelle entre
  //    "wrapper" et "carte". Pas de coins arrondis (full bleed).
  //  - Sur desktop : la carte se détache au centre, le bg desktop ou la
  //    couleur remplit autour, créant un effet de "phone-mockup" intégré.
  const wrapperStyle: React.CSSProperties = {
    backgroundColor: profile.background_color
  }
  if (hasDesktopBg && profile.background_desktop_url) {
    wrapperStyle.backgroundImage = `url(${profile.background_desktop_url})`
    wrapperStyle.backgroundSize = "cover"
    wrapperStyle.backgroundPosition = "center"
  }

  return (
    <div
      className={cn(
        "relative flex min-h-full flex-col items-center overflow-y-auto",
        className
      )}
      style={wrapperStyle}
    >
      <div
        className={cn(
          "relative isolate flex w-full max-w-md flex-1 flex-col overflow-hidden",
          // Coins arrondis en haut + petite respiration sur desktop
          "sm:mt-6 sm:rounded-t-[2.25rem]"
        )}
      >
        {hasBg && profile.background_url && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.background_url})` }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-black"
              style={{ opacity: profile.background_overlay }}
            />
          </>
        )}

        <div className="flex flex-1 flex-col items-center px-5 pt-12 pb-8 text-center">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-white/90 shadow-lift"
            />
          ) : (
            <div
              aria-hidden
              className="grid h-24 w-24 place-items-center rounded-full bg-white text-3xl font-bold text-forest ring-4 ring-white/90 shadow-lift"
            >
              {(profile.display_name || profile.username).charAt(0).toUpperCase()}
            </div>
          )}

          <h1
            className={cn(
              "mt-4 text-xl font-bold tracking-tight",
              lightText ? "text-white" : "text-forest"
            )}
          >
            {profile.display_name || `@${profile.username}`}
          </h1>
          <p
            className={cn(
              "mt-0.5 text-xs font-medium",
              lightText ? "text-white/80" : "text-forest/60"
            )}
          >
            @{profile.username}
          </p>

          {profile.bio && (
            <p
              className={cn(
                "mt-3 max-w-sm text-sm leading-relaxed whitespace-pre-line",
                lightText ? "text-white" : "text-forest/85"
              )}
            >
              {profile.bio}
            </p>
          )}

          <div className="mt-6 w-full space-y-3">
            {links.length === 0 ? (
              <div
                className={cn(
                  "rounded-2xl border border-dashed py-8 text-center text-xs",
                  lightText
                    ? "border-white/30 text-white/70"
                    : "border-forest/15 text-forest/40"
                )}
              >
                Aucun lien pour le moment
              </div>
            ) : (
              links.map((link) => renderLink(link, lightText, trackClicks))
            )}
          </div>
        </div>

        {showFooter && (
          <div
            className={cn(
              "py-5 text-center",
              lightText ? "text-white/85" : "text-forest/55"
            )}
          >
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Créé avec GoodLink
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function renderLink(link: LinkSlice, lightText: boolean, trackClicks: boolean) {
  if (link.type === "header") {
    return (
      <div
        key={link.id}
        className={cn(
          "pt-3 pb-1 text-center text-xs font-bold uppercase tracking-wider",
          lightText ? "text-white/90" : "text-forest/70"
        )}
      >
        {link.title}
      </div>
    )
  }

  // Sur la page publique, on passe par /r/<id> pour tracker. Sinon (preview /
  // landing), href direct → pas de track + le démo reste fonctionnel.
  const href = trackClicks ? `/r/${link.id}` : link.url

  if (link.type === "social" && isSocialPlatform(link.platform)) {
    return (
      <a
        key={link.id}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center gap-3 rounded-2xl bg-white px-5 py-3.5 font-semibold text-forest shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
      >
        <SocialIcon platform={link.platform} className="h-5 w-5 shrink-0" />
        <span className="flex-1 truncate text-left">{link.title}</span>
      </a>
    )
  }

  // type 'link'
  return (
    <a
      key={link.id}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-2xl bg-white px-5 py-4 text-center font-semibold text-forest shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
    >
      <span className="line-clamp-2">{link.title}</span>
    </a>
  )
}
