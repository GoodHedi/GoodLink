import type { SocialPlatform } from "@/lib/constants"

export type SocialPlatformMeta = {
  label: string
  urlExample: string
  /** Brand color (hex). */
  color: string
}

export const SOCIAL_PLATFORM_META: Record<SocialPlatform, SocialPlatformMeta> = {
  instagram: {
    label: "Instagram",
    urlExample: "https://instagram.com/ton-pseudo",
    color: "#E4405F"
  },
  tiktok: {
    label: "TikTok",
    urlExample: "https://tiktok.com/@ton-pseudo",
    color: "#000000"
  },
  twitter: {
    label: "X (Twitter)",
    urlExample: "https://x.com/ton-pseudo",
    color: "#000000"
  },
  youtube: {
    label: "YouTube",
    urlExample: "https://youtube.com/@ta-chaine",
    color: "#FF0000"
  },
  github: {
    label: "GitHub",
    urlExample: "https://github.com/ton-pseudo",
    color: "#181717"
  },
  linkedin: {
    label: "LinkedIn",
    urlExample: "https://linkedin.com/in/ton-profil",
    color: "#0A66C2"
  },
  facebook: {
    label: "Facebook",
    urlExample: "https://facebook.com/ton-profil",
    color: "#1877F2"
  },
  spotify: {
    label: "Spotify",
    urlExample: "https://open.spotify.com/artist/...",
    color: "#1DB954"
  }
}

/**
 * Vérifie qu'une chaîne est une `SocialPlatform` valide.
 * Utilisé après désérialisation DB (où le champ est `string | null`).
 */
export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === "string" && value in SOCIAL_PLATFORM_META
}
