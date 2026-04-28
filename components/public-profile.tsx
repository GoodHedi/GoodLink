import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { SocialIcon } from "@/components/social-icon"
import { AudioPlayer } from "@/components/audio-player"
import { isSocialPlatform } from "@/lib/social-platforms"
import { pickTextColor } from "@/lib/contrast"
import { fontFamilyVar, shapeClass } from "@/lib/style-options"
import type { FontFamily, LinkShape, LinkType } from "@/types/database"

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
  link_color: string
  link_shape: LinkShape
  font_family: FontFamily
  audio_url?: string | null
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

  // Sépare les liens type='social' (icônes en bas) du reste (boutons + headers).
  const mainLinks = links.filter((l) => l.type !== "social")
  const socialLinks = links.filter(
    (l) => l.type === "social" && isSocialPlatform(l.platform)
  )

  // Style auto : couleur de texte des boutons en fonction de la couleur de fond
  const linkBg = profile.link_color
  const linkText = pickTextColor(linkBg)
  const linkRadius = shapeClass(profile.link_shape)
  const fontVar = fontFamilyVar(profile.font_family)

  // Style du wrapper extérieur
  const wrapperStyle: React.CSSProperties = {
    backgroundColor: profile.background_color,
    fontFamily: fontVar
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
          "relative isolate flex w-full max-w-[604px] flex-1 flex-col overflow-hidden",
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

          {/* Lecteur audio optionnel */}
          {profile.audio_url && (
            <div className="mt-5 w-full">
              <AudioPlayer
                src={profile.audio_url}
                accentColor={linkBg}
                baseColor={lightText ? "#FFFFFF" : "#0F291E"}
                surfaceClass={
                  lightText
                    ? "bg-white/10 border border-white/20"
                    : "bg-forest/5 border border-forest/10"
                }
              />
            </div>
          )}

          {/* Liens principaux (link + header) */}
          <div className="mt-6 w-full space-y-3">
            {mainLinks.length === 0 && socialLinks.length === 0 ? (
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
              mainLinks.map((link) =>
                renderMainLink(link, {
                  lightText,
                  trackClicks,
                  linkBg,
                  linkText,
                  linkRadius
                })
              )
            )}
          </div>

          {/* Rangée des sociaux : juste sous le dernier lien */}
          {socialLinks.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {socialLinks.map((link) => {
                if (!isSocialPlatform(link.platform)) return null
                const href = trackClicks ? `/r/${link.id}` : link.url
                return (
                  <a
                    key={link.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.title}
                    aria-label={link.title}
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
                      "hover:-translate-y-0.5 hover:scale-110",
                      lightText
                        ? "text-white hover:text-white"
                        : "text-forest hover:text-forest"
                    )}
                  >
                    <SocialIcon
                      platform={link.platform}
                      className="h-7 w-7"
                    />
                  </a>
                )
              })}
            </div>
          )}
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

type RenderOpts = {
  lightText: boolean
  trackClicks: boolean
  linkBg: string
  linkText: string
  linkRadius: string
}

function renderMainLink(link: LinkSlice, opts: RenderOpts) {
  if (link.type === "header") {
    return (
      <div
        key={link.id}
        className={cn(
          "pt-3 pb-1 text-center text-xs font-bold uppercase tracking-wider",
          opts.lightText ? "text-white/90" : "text-forest/70"
        )}
      >
        {link.title}
      </div>
    )
  }

  // type 'link' — type 'social' est rendu séparément en row d'icônes
  const href = opts.trackClicks ? `/r/${link.id}` : link.url

  return (
    <a
      key={link.id}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ backgroundColor: opts.linkBg, color: opts.linkText }}
      className={cn(
        "block w-full px-5 py-4 text-center font-semibold shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]",
        opts.linkRadius
      )}
    >
      <span className="line-clamp-2">{link.title}</span>
    </a>
  )
}
