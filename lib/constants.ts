/**
 * Constantes partagées entre validations, UI et serveur.
 */

// Liste exacte demandée par le brief + "auth" qui est notre route /auth/*
export const RESERVED_USERNAMES = new Set<string>([
  "signup",
  "login",
  "dashboard",
  "api",
  "admin",
  "about",
  "settings",
  "help",
  "terms",
  "privacy",
  "public",
  "static",
  "auth"
])

// Doit rester aligné avec le check constraint SQL `username_format`
export const USERNAME_REGEX = /^[a-z0-9-]{3,20}$/
export const USERNAME_MIN = 3
export const USERNAME_MAX = 20

export const DISPLAY_NAME_MAX = 60
export const BIO_MAX = 160

export const LINK_TITLE_MAX = 80
export const LINK_URL_MAX = 2048

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72 // limite historique bcrypt utilisée par Supabase

export const AGE_MIN = 13
export const AGE_MAX = 120

// Compression d'image côté client
export const IMAGE_MAX_SIZE_MB = 1
export const IMAGE_MAX_DIMENSION = 1280
export const IMAGE_INPUT_MAX_MB = 10 // taille acceptée avant compression

export const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6})$/

export const DEFAULT_BACKGROUND_COLOR = "#F3EFE9"
export const DEFAULT_BACKGROUND_OVERLAY = 0.3

// Quotas par tier. Visiteur = freemium, Pro = payant grand-public, Agence
// = payant pro avec codes pour ses clients (tier 'agence_client' = sub-pro
// hérité d'une agence, avec mêmes droits que Pro tant que le code est actif).
import type { AccountTier } from "@/types/database"

export const PAGE_LIMIT_BY_TIER: Record<AccountTier, number> = {
  visiteur: 1,
  pro: 20,
  agence: 100,
  agence_client: 20
}

export const QR_LIMIT_BY_TIER: Record<AccountTier, number> = {
  visiteur: 1,
  pro: 50,
  agence: 200,
  agence_client: 50
}

// Compat : valeurs par défaut historiques utilisées avant l'introduction
// des tiers (encore référencées dans certains composants UI).
export const PAGE_LIMIT_FREE = PAGE_LIMIT_BY_TIER.pro
export const QR_LIMIT_FREE = QR_LIMIT_BY_TIER.pro

/**
 * Capacités par tier. Sert à gater l'UI ET les server actions de manière
 * cohérente. `true` = autorisé, `false` = caché/refusé.
 *
 * Visiteur : version ultra-basique, 1 page avec liens et fond uni seulement.
 * Pas d'avatar custom, pas de fond image, pas d'audio, pas de templates,
 * pas de polices custom, pas de QR personnalisable au-delà du basique.
 */
export type TierCapabilities = {
  customAvatar: boolean
  backgroundImage: boolean
  audioAttachment: boolean
  customLinkColor: boolean
  customLinkShape: boolean
  customFont: boolean
  templates: boolean
  workspaces: boolean
  sharing: boolean
  agencyCodes: boolean
}

export const TIER_CAPS: Record<AccountTier, TierCapabilities> = {
  visiteur: {
    customAvatar: false,
    backgroundImage: false,
    audioAttachment: false,
    customLinkColor: false,
    customLinkShape: false,
    customFont: false,
    templates: false,
    workspaces: false,
    sharing: false,
    agencyCodes: false
  },
  pro: {
    customAvatar: true,
    backgroundImage: true,
    audioAttachment: true,
    customLinkColor: true,
    customLinkShape: true,
    customFont: true,
    templates: true,
    workspaces: true,
    sharing: true,
    agencyCodes: false
  },
  agence: {
    customAvatar: true,
    backgroundImage: true,
    audioAttachment: true,
    customLinkColor: true,
    customLinkShape: true,
    customFont: true,
    templates: true,
    workspaces: true,
    sharing: true,
    agencyCodes: true
  },
  agence_client: {
    customAvatar: true,
    backgroundImage: true,
    audioAttachment: true,
    customLinkColor: true,
    customLinkShape: true,
    customFont: true,
    templates: true,
    workspaces: true,
    sharing: true,
    agencyCodes: false
  }
}

export function tierLabel(tier: AccountTier): string {
  return tier === "visiteur"
    ? "Visiteur"
    : tier === "pro"
      ? "Pro"
      : tier === "agence"
        ? "Agence"
        : "Client agence"
}

// Plateformes sociales supportées (pour LinkType = 'social', vague 2)
export const SOCIAL_PLATFORMS = [
  "instagram",
  "tiktok",
  "twitter",
  "youtube",
  "github",
  "linkedin",
  "facebook",
  "spotify"
] as const
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]
