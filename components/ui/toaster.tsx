"use client"

import * as React from "react"
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

const TOAST_EVENT_NAME = "homelink:toast"
const DEFAULT_DURATION = 4200

type ToastVariant = "default" | "destructive" | "success"

type ToastInput = {
  description?: string
  duration?: number
  title: string
  variant?: ToastVariant
}

type ToastItem = ToastInput & {
  id: string
}

let toastCounter = 0

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  toastCounter += 1

  return `${Date.now()}-${toastCounter}`
}

function toast(input: ToastInput) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<ToastItem>(TOAST_EVENT_NAME, {
      detail: {
        ...input,
        id: createToastId(),
      },
    })
  )
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return <CheckCircle2 className="size-4 text-primary" />
  }

  if (variant === "destructive") {
    return <CircleAlert className="size-4 text-destructive" />
  }

  return <Info className="size-4 text-muted-foreground" />
}

function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismissToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  React.useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastItem>).detail

      if (!detail?.title) {
        return
      }

      setToasts((current) => [detail, ...current].slice(0, 4))

      window.setTimeout(() => {
        dismissToast(detail.id)
      }, detail.duration ?? DEFAULT_DURATION)
    }

    window.addEventListener(TOAST_EVENT_NAME, onToast)

    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, onToast)
    }
  }, [dismissToast])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:top-5 sm:right-5"
    >
      {toasts.map((item) => {
        const variant = item.variant ?? "default"

        return (
          <div
            key={item.id}
            role={variant === "destructive" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex gap-3 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg",
              variant === "success" && "border-primary/25",
              variant === "destructive" && "border-destructive/30"
            )}
          >
            <span className="mt-0.5 shrink-0">
              <ToastIcon variant={variant} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Fermer la notification"
              onClick={() => dismissToast(item.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export { toast, Toaster }
