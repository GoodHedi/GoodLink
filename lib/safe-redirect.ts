/**
 * Helpers anti-open-redirect.
 *
 * Tous les redirects qui prennent une URL contrôlée par l'utilisateur
 * (target_url d'un QR, url d'un lien, paramètre `next` après auth, ...)
 * doivent passer par ces helpers avant un NextResponse.redirect().
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])

/**
 * Valide une URL externe (target_url, link.url) :
 *   - doit être absolue
 *   - http(s) uniquement
 *   - rejette `//evil.com` (relative-protocole, accepté par le navigateur
 *     comme une URL absolue)
 *
 * Retourne l'URL nettoyée (string), ou null si invalide.
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed === "") return null

  // Bloque les URLs commençant par `//` (protocol-relative)
  if (trimmed.startsWith("//")) return null

  try {
    const url = new URL(trimmed)
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

/**
 * Valide un paramètre `next` post-auth :
 *   - doit être un chemin local commençant par `/`
 *   - rejette `//evil.com` (interprété comme absolu par le navigateur)
 *   - rejette `\\evil.com` (équivalent sur Windows / certains parsers)
 *
 * Retourne le path validé, ou la valeur par défaut si invalide.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!next || typeof next !== "string") return fallback
  if (!next.startsWith("/")) return fallback
  // protocol-relative (// ou /\) → traité comme absolu par le navigateur
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}
