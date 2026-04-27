import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { DashboardEditor } from "../../_components/dashboard-editor"

export const metadata: Metadata = { title: "Éditeur" }
export const dynamic = "force-dynamic"

type Params = Promise<{ id: string }>

export default async function PageEditorRoute({
  params
}: {
  params: Params
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!page) notFound()

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("page_id", page.id)
    .order("position", { ascending: true })

  return (
    <>
      <div className="container pt-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Mes pages
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/${page.username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Voir cette page
            </Link>
          </Button>
        </div>
      </div>
      <DashboardEditor page={page} links={links ?? []} />
    </>
  )
}
