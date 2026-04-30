import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { safeExternalUrl } from "@/lib/safe-redirect"

/**
 * Tracker de scan QR + redirect.
 * - GET /q/<qr_id>
 * - Insère une ligne dans qr_scans (RLS : insert public)
 * - 302 vers la target_url du QR
 *
 * Note : seuls les QR créés en mode tracked encodent cette URL.
 * Les anciens QR encodent target_url en direct → ne passent jamais par ici.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 })
  }

  const supabase = await createClient()

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("target_url")
    .eq("id", id)
    .maybeSingle()

  if (!qr || !qr.target_url) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 })
  }

  // Re-valide l'URL côté serveur (anti open-redirect).
  const safe = safeExternalUrl(qr.target_url)
  if (!safe) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 })
  }

  // Log du scan. On attend la promesse pour fiabilité (~50ms).
  await supabase.from("qr_scans").insert({ qr_id: id })

  return NextResponse.redirect(safe, { status: 302 })
}
