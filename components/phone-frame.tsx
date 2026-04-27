import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Cadre mockup d'iPhone, utilisé pour la preview du dashboard et la landing.
 * Le contenu remplit l'écran ; pense à passer un container `min-h-full overflow-y-auto`.
 */
export function PhoneFrame({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[320px]", className)}>
      <div className="relative aspect-[9/19] rounded-[44px] bg-zinc-900 p-[10px] shadow-2xl ring-1 ring-zinc-800/50">
        {/* Encoche */}
        <div
          aria-hidden
          className="absolute left-1/2 top-2.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black"
        />
        <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}
