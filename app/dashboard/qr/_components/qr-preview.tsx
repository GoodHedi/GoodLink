"use client"

import { useEffect, useRef } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QrPreviewProps = {
  data: string
  fgColor: string
  bgColor: string
  /** URL d'une image à intégrer au centre du QR code (logo). */
  logoUrl?: string | null
  label?: string
  size?: number
  className?: string
  showDownload?: boolean
}

/**
 * Rendu d'un QR code via qr-code-styling. Client-only — évite le SSR
 * grâce à la directive "use client". L'instance est créée au mount et
 * mise à jour quand les props changent.
 *
 * Si `logoUrl` est fourni, qr-code-styling l'embed au centre et augmente
 * automatiquement le niveau de correction d'erreur pour rester scannable.
 */
export function QrPreview({
  data,
  fgColor,
  bgColor,
  logoUrl,
  label = "qr-code",
  size = 220,
  className,
  showDownload = true
}: QrPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrRef = useRef<any>(null)

  // Création de l'instance au mount
  useEffect(() => {
    let cancelled = false

    void (async () => {
      const { default: QRCodeStyling } = await import("qr-code-styling")
      if (cancelled || !containerRef.current) return

      qrRef.current = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data: data || "https://example.com",
        margin: 4,
        image: logoUrl || undefined,
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 4,
          imageSize: 0.4,
          hideBackgroundDots: true
        },
        dotsOptions: { color: fgColor, type: "rounded" },
        backgroundOptions: { color: bgColor },
        cornersSquareOptions: { type: "extra-rounded", color: fgColor },
        cornersDotOptions: { type: "dot", color: fgColor }
      })

      containerRef.current.innerHTML = ""
      qrRef.current.append(containerRef.current)
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  // Mise à jour quand les props changent
  useEffect(() => {
    if (!qrRef.current) return
    qrRef.current.update({
      data: data || "https://example.com",
      image: logoUrl || undefined,
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 4,
        imageSize: 0.4,
        hideBackgroundDots: true
      },
      dotsOptions: { color: fgColor, type: "rounded" },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { type: "extra-rounded", color: fgColor },
      cornersDotOptions: { type: "dot", color: fgColor }
    })
  }, [data, fgColor, bgColor, logoUrl])

  function handleDownload(extension: "png" | "svg") {
    if (!qrRef.current) return
    const safeName = (label || "qr-code")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/gi, "-")
      .replace(/-+/g, "-")
      .slice(0, 50)
    qrRef.current.download({ name: safeName, extension })
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        ref={containerRef}
        className="grid place-items-center rounded-xl border border-border bg-white p-2"
        style={{ width: size + 16, height: size + 16 }}
        aria-label={`QR code ${label}`}
      />
      {showDownload && (
        <div className="flex w-full gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleDownload("png")}
            className="flex-1"
          >
            <Download className="h-4 w-4" />
            PNG
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleDownload("svg")}
            className="flex-1"
          >
            <Download className="h-4 w-4" />
            SVG
          </Button>
        </div>
      )}
    </div>
  )
}
