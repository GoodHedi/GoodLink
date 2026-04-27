import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = { title: "QR codes" }

// Placeholder vague 4 — implémentation complète à venir.
export default function QrPlaceholderPage() {
  return (
    <div className="container py-8 lg:py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
        QR codes
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Génère des QR codes téléchargeables, indépendants de tes pages GoodLink.
      </p>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="text-4xl">🚧</div>
          <p className="font-semibold text-forest">Bientôt disponible</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Cette section arrivera dans la prochaine vague de mise à jour.
            Pour l&apos;instant, concentre-toi sur tes pages GoodLink.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
