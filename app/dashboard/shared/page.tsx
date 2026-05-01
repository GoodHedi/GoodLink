import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ExternalLink, Share2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { QrPreview } from "@/app/dashboard/qr/_components/qr-preview"
import { qrEncodedUrl } from "@/lib/qr-url"

export const metadata: Metadata = { title: "Partages" }
export const dynamic = "force-dynamic"

export default async function SharedPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Pages partagées AVEC moi
  const { data: pageShares } = await supabase
    .from("page_shares")
    .select(
      "page_id, role, created_at, shared_by_user_id, pages!inner (id, username, display_name, avatar_url, background_color, background_url)"
    )
    .eq("shared_with_user_id", user.id)
    .order("created_at", { ascending: false })

  // QR partagés AVEC moi
  const { data: qrShares } = await supabase
    .from("qr_shares")
    .select(
      "qr_id, role, created_at, shared_by_user_id, qr_codes!inner (id, label, target_url, fg_color, bg_color, logo_url, tracked)"
    )
    .eq("shared_with_user_id", user.id)
    .order("created_at", { ascending: false })

  type PageShareJoined = {
    page_id: string
    role: "viewer" | "editor"
    created_at: string
    shared_by_user_id: string
    pages: {
      id: string
      username: string
      display_name: string
      avatar_url: string | null
      background_color: string
      background_url: string | null
    }
  }
  type QrShareJoined = {
    qr_id: string
    role: "viewer" | "editor"
    created_at: string
    shared_by_user_id: string
    qr_codes: {
      id: string
      label: string
      target_url: string
      fg_color: string
      bg_color: string
      logo_url: string | null
      tracked: boolean
    }
  }

  const sharedPages = (pageShares ?? []) as unknown as PageShareJoined[]
  const sharedQrs = (qrShares ?? []) as unknown as QrShareJoined[]

  const isEmpty = sharedPages.length === 0 && sharedQrs.length === 0

  return (
    <div className="container space-y-8 py-8 lg:py-12">
      <div>
        <h1 className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
          <Share2 className="h-6 w-6" />
          Partages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pages et QR codes que d&apos;autres utilisateurs t&apos;ont partagés.
        </p>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-white py-16 px-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-forest">
            Rien de partagé pour l&apos;instant
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Les pages et QR codes qu&apos;on te partage apparaîtront ici. Tu
            verras le contenu (et pourras éditer si on t&apos;a donné les
            droits), mais ils restent dans le workspace de leur propriétaire.
          </p>
        </div>
      ) : (
        <>
          {sharedPages.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Pages ({sharedPages.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sharedPages.map((s) => (
                  <article
                    key={s.page_id}
                    className="rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift"
                  >
                    <div
                      className="h-20 rounded-t-2xl"
                      style={{
                        backgroundColor: s.pages.background_color,
                        backgroundImage: s.pages.background_url
                          ? `url(${s.pages.background_url})`
                          : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                      }}
                    />
                    <div className="space-y-3 p-4">
                      <div className="flex items-start gap-3">
                        {s.pages.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.pages.avatar_url}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-card"
                          />
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-forest">
                            {(s.pages.display_name || s.pages.username)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-bold text-forest">
                            {s.pages.display_name || `@${s.pages.username}`}
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">
                            agoodlink.net/{s.pages.username}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                          {s.role === "editor" ? "Éditeur" : "Lecteur"}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {s.role === "editor" ? (
                          <Button
                            asChild
                            size="sm"
                            variant="default"
                            className="flex-1"
                          >
                            <Link href={`/dashboard/pages/${s.page_id}`}>
                              Modifier
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Link
                              href={`/${s.pages.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Voir
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {sharedQrs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                QR codes ({sharedQrs.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sharedQrs.map((s) => (
                  <article
                    key={s.qr_id}
                    className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift"
                  >
                    <div className="flex justify-center pt-2">
                      <QrPreview
                        data={qrEncodedUrl(s.qr_codes)}
                        fgColor={s.qr_codes.fg_color}
                        bgColor={s.qr_codes.bg_color}
                        logoUrl={s.qr_codes.logo_url}
                        label={s.qr_codes.label}
                        size={180}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-bold text-forest">
                          {s.qr_codes.label}
                        </h3>
                        <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                          {s.role === "editor" ? "Éditeur" : "Lecteur"}
                        </span>
                      </div>
                      <p
                        className="truncate text-xs text-muted-foreground"
                        title={s.qr_codes.target_url}
                      >
                        {s.qr_codes.target_url}
                      </p>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <a
                        href={qrEncodedUrl(s.qr_codes)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ouvrir l&apos;URL
                      </a>
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
