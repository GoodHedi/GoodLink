import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QR_LIMIT_FREE } from "@/lib/constants"
import { QrList } from "./_components/qr-list"

export const metadata: Metadata = { title: "QR codes" }
export const dynamic = "force-dynamic"

export default async function QrPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: qrs } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  const list = qrs ?? []

  return (
    <div className="container py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
          QR codes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} / {QR_LIMIT_FREE} QR codes utilisés. Indépendants de
          tes pages GoodLink — pointent vers n&apos;importe quelle URL.
        </p>
      </div>

      <QrList ownerId={user.id} initialQrs={list} />
    </div>
  )
}
