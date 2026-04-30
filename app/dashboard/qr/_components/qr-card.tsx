"use client"

import { useState } from "react"
import { Pencil, ScanLine, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { QrPreview } from "./qr-preview"
import { qrEncodedUrl } from "@/lib/qr-url"
import type { QrCode } from "@/types/database"

type Props = {
  qr: QrCode
  scanCount?: number
  onEdit: () => void
  onDelete: () => void
}

export function QrCard({ qr, scanCount = 0, onEdit, onDelete }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const encoded = qrEncodedUrl(qr)

  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex justify-center pt-2">
        <QrPreview
          data={encoded}
          fgColor={qr.fg_color}
          bgColor={qr.bg_color}
          logoUrl={qr.logo_url}
          label={qr.label}
          size={180}
        />
      </div>

      <div className="space-y-1">
        <h3 className="truncate font-bold text-forest">{qr.label}</h3>
        <p className="truncate text-xs text-muted-foreground" title={qr.target_url}>
          {qr.target_url}
        </p>
        {qr.tracked ? (
          <p className="inline-flex items-center gap-1 rounded-full bg-forest/5 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-forest">
            <ScanLine className="h-3 w-3" />
            {scanCount.toLocaleString("fr-FR")} scan{scanCount > 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-[10px] italic text-muted-foreground">
            QR ancien — non tracké
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="flex-1"
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => {
            if (confirmingDelete) {
              onDelete()
            } else {
              setConfirmingDelete(true)
              setTimeout(() => setConfirmingDelete(false), 3000)
            }
          }}
          title={
            confirmingDelete ? "Re-clique pour confirmer" : "Supprimer"
          }
          className={cn(
            confirmingDelete &&
              "border-destructive text-destructive hover:bg-destructive/10"
          )}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  )
}
