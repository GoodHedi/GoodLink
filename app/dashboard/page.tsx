import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardEditor } from "./_components/dashboard-editor"

export const metadata: Metadata = { title: "Dashboard" }
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: links }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("links")
      .select("*")
      .eq("profile_id", user.id)
      .order("position", { ascending: true })
  ])

  // Le layout gère le cas profile manquant. Si on arrive ici sans profile,
  // c'est qu'il a déjà été géré, on renvoie un signe d'arrêt.
  if (!profile) return null

  return <DashboardEditor profile={profile} links={links ?? []} />
}
