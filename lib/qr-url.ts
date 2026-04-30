import type { QrCode } from "@/types/database"

/**
 * URL effectivement encodée dans un QR code.
 *
 * - QR tracké → "<SITE>/q/<id>" (passe par notre redirect, log dans qr_scans)
 * - QR non tracké (anciens, avant migration) → target_url en direct
 *
 * Côté client, on lit window.location.origin ; côté serveur, on a
 * NEXT_PUBLIC_SITE_URL.
 */
export function qrEncodedUrl(qr: Pick<QrCode, "id" | "tracked" | "target_url">): string {
  if (!qr.tracked) return qr.target_url

  const base =
    (typeof window !== "undefined" && window.location.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://agoodlink.net"

  return `${base.replace(/\/$/, "")}/q/${qr.id}`
}
