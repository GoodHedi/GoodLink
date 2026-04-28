import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Endpoint de confirmation des liens email (signup confirm, password reset,
 * magic link, change email).
 *
 * Pourquoi pas /auth/callback comme Google OAuth ?
 * → Les liens dans les emails sont prefetchés par Gmail/Outlook/AV pour
 *   les scanner. Si on appelle directement le verify endpoint Supabase, le
 *   token est consommé par le scanner avant que l'utilisateur ne clique.
 *   En passant par cette route avec verifyOtp, le token n'est consommé que
 *   sur une vraie requête utilisateur (les scanners ne suivent que des
 *   redirections, ils n'exécutent pas notre code).
 *
 * Le template email Supabase doit pointer vers :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>&next=<next>
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`)
}
