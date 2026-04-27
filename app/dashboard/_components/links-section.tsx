"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { LinkItem } from "./link-item"
import { AddLinkForm } from "./add-link-form"
import {
  createLinkAction,
  deleteLinkAction,
  reorderLinksAction,
  updateLinkAction
} from "../actions"
import type { Link as LinkRow } from "@/types/database"
import type {
  CreateLinkInput,
  UpdateLinkInput
} from "@/lib/validations/links"

type Props = {
  pageId: string
  links: LinkRow[]
  onLinksChange: (links: LinkRow[]) => void
}

export function LinksSection({ pageId, links, onLinksChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  const [, startTransition] = useTransition()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = links.findIndex((l) => l.id === active.id)
    const newIndex = links.findIndex((l) => l.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const previous = links
    const next = arrayMove(links, oldIndex, newIndex)
    onLinksChange(next)

    startTransition(async () => {
      const result = await reorderLinksAction(pageId, next.map((l) => l.id))
      if (!result.ok) {
        toast.error(result.error)
        onLinksChange(previous)
      }
    })
  }

  async function handleAdd(input: CreateLinkInput): Promise<boolean> {
    const result = await createLinkAction(pageId, input)
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    onLinksChange([...links, result.data])
    toast.success("Lien ajouté")
    return true
  }

  async function handleUpdate(input: UpdateLinkInput) {
    const previous = links
    onLinksChange(
      links.map((l) =>
        l.id === input.id ? { ...l, title: input.title, url: input.url } : l
      )
    )
    const result = await updateLinkAction(pageId, input)
    if (!result.ok) {
      toast.error(result.error)
      onLinksChange(previous)
    }
  }

  async function handleDelete(id: string) {
    const previous = links
    onLinksChange(links.filter((l) => l.id !== id))
    const result = await deleteLinkAction(pageId, id)
    if (!result.ok) {
      toast.error(result.error)
      onLinksChange(previous)
    } else {
      toast.success("Lien supprimé")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tes liens</CardTitle>
        <CardDescription>
          Glisse-dépose pour réordonner. Ils seront affichés dans cet ordre sur
          ta page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddLinkForm onAdd={handleAdd} />

        {links.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Pas encore de lien. Ajoute ton premier juste au-dessus.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={links.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {links.map((link) => (
                  <LinkItem
                    key={link.id}
                    link={link}
                    onUpdate={handleUpdate}
                    onDelete={() => handleDelete(link.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  )
}
