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

// Quotas plan free (à passer en colonne `plan` sur auth.users plus tard si besoin)
export const PAGE_LIMIT_FREE = 20
export const QR_LIMIT_FREE = 50

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
