"use client"

import { Eye, MousePointerClick } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

type Props = {
  totalViews: number
  totalClicks: number
}

export function AnalyticsCard({ totalViews, totalClicks }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques</CardTitle>
        <CardDescription>
          Total cumulé depuis la création de la page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Stat
            icon={<Eye className="h-5 w-5" />}
            label="Vues"
            value={totalViews}
          />
          <Stat
            icon={<MousePointerClick className="h-5 w-5" />}
            label="Clics"
            value={totalClicks}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-cream/40 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tabular-nums leading-tight text-forest">
          {value.toLocaleString("fr-FR")}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
