"use client"

import Link from "next/link"
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu } from "radix-ui"

import { Button } from "@/components/ui/button"

type DashboardActionsMenuProps = {
  detailHref?: string
  editHref?: string
  onDelete?: () => void
  onEdit?: () => void
}

function DashboardActionsMenu({
  detailHref,
  editHref,
  onDelete,
  onEdit,
}: DashboardActionsMenuProps) {
  const canDelete = Boolean(onDelete) // On désactive Supprimer quand aucune action n'est fournie.
  const canEdit = Boolean(editHref || onEdit) // Modifier peut être un lien ou une action locale.
  const canViewDetails = Boolean(detailHref) // Voir les détails est disponible seulement avec une URL.

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant="outline" size="sm" className="ml-auto">
          <MoreHorizontal />
          Actions
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none"
        >
          <DropdownMenu.Item
            asChild
            disabled={!canViewDetails}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition focus:bg-muted data-disabled:pointer-events-none data-disabled:opacity-50"
          >
            <Link href={detailHref ?? "#"}>
              <Eye className="size-4" />
              Voir les détails
            </Link>
          </DropdownMenu.Item>

          {editHref ? (
            <DropdownMenu.Item
              asChild
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition focus:bg-muted"
            >
              <Link href={editHref}>
                <Pencil className="size-4" />
                Modifier
              </Link>
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              disabled={!canEdit}
              onSelect={onEdit}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition focus:bg-muted data-disabled:pointer-events-none data-disabled:opacity-50"
            >
              <Pencil className="size-4" />
              Modifier
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            disabled={!canDelete}
            onSelect={onDelete}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none transition focus:bg-destructive/10 data-disabled:pointer-events-none data-disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Supprimer
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export { DashboardActionsMenu }
