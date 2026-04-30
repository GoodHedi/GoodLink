import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { safeNextPath } from "@/lib/safe-redirect"

/**
 * Callback OAuth / confirmation email.
 * Échange le `code` contre une session, puis redirige vers `next` (par défaut /dashboard).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // safeNextPath bloque `//evil.com`, scheme externes, etc.
  const next = safeNextPath(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=callback`
  )
}
