"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, QrCode as QrCodeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QR_LIMIT_FREE } from "@/lib/constants"
import { QrCard } from "./qr-card"
import { QrForm } from "./qr-form"
import {
  createQrAction,
  deleteQrAction,
  updateQrAction
} from "../actions"
import type { CreateQrInput } from "@/lib/validations/qr"
import type { QrCode } from "@/types/database"

type Props = {
  initialQrs: QrCode[]
}

export function QrList({ initialQrs }: Props) {
  const [qrs, setQrs] = useState<QrCode[]>(initialQrs)
  const [mode, setMode] = useState<
    | { kind: "list" }
    | { kind: "create" }
    | { kind: "edit"; qr: QrCode }
  >({ kind: "list" })

  const atLimit = qrs.length >= QR_LIMIT_FREE

  async function handleCreate(input: CreateQrInput) {
    const result = await createQrAction(input)
    if (!result.ok) {
      toast.error(result.error)
      return result
    }
    setQrs((prev) => [result.data, ...prev])
    toast.success("QR code créé")
    setMode({ kind: "list" })
    return { ok: true } as const
  }

  async function handleUpdate(qrId: string, input: CreateQrInput) {
    const result = await updateQrAction({ id: qrId, ...input })
    if (!result.ok) {
      toast.error(result.error)
      return result
    }
    setQrs((prev) =>
      prev.map((q) => (q.id === qrId ? { ...q, ...input } : q))
    )
    toast.success("QR code mis à jour")
    setMode({ kind: "list" })
    return { ok: true } as const
  }

  async function handleDelete(qrId: string) {
    const previous = qrs
    setQrs((prev) => prev.filter((q) => q.id !== qrId))
    const result = await deleteQrAction(qrId)
    if (!result.ok) {
      toast.error(result.error)
      setQrs(previous)
    } else {
      toast.success("QR code supprimé")
    }
  }

  if (qrs.length === 0 && mode.kind === "list") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-white py-16 px-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
          <QrCodeIcon className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-forest">
          Tu n&apos;as encore aucun QR code
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Crée un QR code à partir de n&apos;importe quelle URL : carte de
          visite, menu, vidéo, profil… télécharge-le en PNG ou SVG.
        </p>
        <Button
          variant="accent"
          size="lg"
          onClick={() => setMode({ kind: "create" })}
        >
          <Plus className="h-4 w-4" />
          Créer mon premier QR code
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {mode.kind === "create" && (
        <QrForm
          onSubmit={handleCreate}
          onCancel={() => setMode({ kind: "list" })}
        />
      )}
      {mode.kind === "edit" && (
        <QrForm
          initial={mode.qr}
          onSubmit={(input) => handleUpdate(mode.qr.id, input)}
          onCancel={() => setMode({ kind: "list" })}
        />
      )}

      {mode.kind === "list" && !atLimit && (
        <Button
          variant="accent"
          onClick={() => setMode({ kind: "create" })}
        >
          <Plus className="h-4 w-4" />
          Nouveau QR code
        </Button>
      )}

      {mode.kind === "list" && atLimit && (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
          Limite de {QR_LIMIT_FREE} QR codes atteinte sur ton plan.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {qrs.map((qr) => (
          <QrCard
            key={qr.id}
            qr={qr}
            onEdit={() => setMode({ kind: "edit", qr })}
            onDelete={() => handleDelete(qr.id)}
          />
        ))}
      </div>
    </div>
  )
}
