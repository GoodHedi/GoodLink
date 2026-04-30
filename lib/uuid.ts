/**
 * Helpers UUID — utilisés pour valider les ids fournis côté client avant
 * de les concaténer dans des paths storage ou des requêtes SQL.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(s: string | null | undefined): boolean {
  if (!s) return false
  return UUID_RE.test(s)
}
