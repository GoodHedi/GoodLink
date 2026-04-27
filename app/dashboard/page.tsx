import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PagesGrid } from "./_components/pages-grid"
import { PAGE_LIMIT_FREE } from "@/lib/constants"

export const metadata: Metadata = { title: "Mes pages" }
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })

  const list = pages ?? []

  return (
    <div className="container py-8 lg:py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
            Tes pages GoodLink
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} / {PAGE_LIMIT_FREE} pages utilisées
          </p>
        </div>
      </div>

      <PagesGrid pages={list} />
    </div>
  )
}
