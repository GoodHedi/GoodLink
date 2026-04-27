import type { ZodError } from "zod"

/**
 * Aplatit les issues d'un ZodError en un dictionnaire { champ: message }.
 * Conserve uniquement la première erreur par champ pour ne pas saturer l'UI.
 */
export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form"
    if (!out[key]) out[key] = issue.message
  }
  return out
}

/**
 * Convertit les messages d'erreur Supabase Auth en français lisible.
 * On ne fait pas confiance aux libellés EN bruts dans l'UI.
 */
export function humanizeAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials"))
    return "Email ou mot de passe incorrect."
  if (m.includes("already registered") || m.includes("already exists"))
    return "Un compte existe déjà avec cet email."
  if (m.includes("email not confirmed"))
    return "Confirme ton email avant de te connecter (vérifie tes spams)."
  if (m.includes("rate limit") || m.includes("too many requests"))
    return "Trop de tentatives. Réessaie dans quelques minutes."
  if (m.includes("network") || m.includes("fetch"))
    return "Problème de connexion. Réessaie."
  if (m.includes("password"))
    return "Mot de passe non valide."
  return "Une erreur est survenue. Réessaie."
}
