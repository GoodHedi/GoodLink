"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { QrPreview } from "./qr-preview"
import type { QrCode } from "@/types/database"

type Props = {
  qr: QrCode
  onEdit: () => void
  onDelete: () => void
}

export function QrCard({ qr, onEdit, onDelete }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex justify-center pt-2">
        <QrPreview
          data={qr.target_url}
          fgColor={qr.fg_color}
          bgColor={qr.bg_color}
          label={qr.label}
          size={180}
        />
      </div>

      <div className="space-y-1">
        <h3 className="truncate font-bold text-forest">{qr.label}</h3>
        <p className="truncate text-xs text-muted-foreground" title={qr.target_url}>
          {qr.target_url}
        </p>
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
