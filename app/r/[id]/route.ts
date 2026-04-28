import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Tracker de clic + redirect.
 * - GET /r/<link_id>
 * - Insère une ligne dans link_clicks (RLS : insert public)
 * - 302 vers l'URL réelle du lien
 *
 * Si le lien n'existe pas, est de type 'header' (pas d'URL), ou est invalide,
 * redirige vers la home pour ne jamais rester bloqué.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Validation rapide d'UUID (évite les requêtes inutiles)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 })
  }

  const supabase = await createClient()

  const { data: link } = await supabase
    .from("links")
    .select("url, type")
    .eq("id", id)
    .maybeSingle()

  if (!link || link.type === "header" || !link.url) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 })
  }

  // Log du clic. On attend la promesse pour fiabilité.
  // ~50ms ajouté à la latence du redirect, acceptable.
  await supabase.from("link_clicks").insert({ link_id: id })

  return NextResponse.redirect(link.url, { status: 302 })
}
