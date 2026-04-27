import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

/**
 * Client Supabase pour Server Components, Route Handlers et Server Actions.
 *
 * En Next 15, `cookies()` est async → la factory l'est aussi. Tous les
 * appelants doivent faire `const supabase = await createClient()`.
 *
 * Le `try/catch` autour de `setAll` est volontaire : un Server Component pur
 * ne peut pas écrire de cookies (il les lit seulement). Le rafraîchissement
 * effectif de la session est délégué au middleware racine.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Appelé depuis un Server Component : ignorer.
          }
        }
      }
    }
  )
}
