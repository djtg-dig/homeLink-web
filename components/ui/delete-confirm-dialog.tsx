"use client"

import { Loader2, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"

function DeleteConfirmDialog({
  description,
  error,
  onClose,
  onConfirm,
  pending,
  title,
}: {
  description: string
  error?: string
  onClose: () => void
  onConfirm: () => void
  pending?: boolean
  title: string
}) {
  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-brand-navy/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="w-full rounded-t-lg border border-border bg-card text-card-foreground shadow-xl sm:max-w-md sm:rounded-lg">
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 id="delete-dialog-title" className="text-lg font-semibold">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={pending}
          >
            <X />
          </Button>
        </div>

        <div className="space-y-4 p-4">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { DeleteConfirmDialog }
