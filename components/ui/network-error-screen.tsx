"use client"

import * as React from "react"
import { RefreshCw, WifiOff, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  NETWORK_ERROR_EVENT_NAME,
  type NetworkErrorEventDetail,
} from "@/lib/api-client"

const DEFAULT_MESSAGE =
  "Impossible de joindre le service pour le moment. Vérifiez votre connexion, puis réessayez."

function NetworkErrorScreen() {
  const [message, setMessage] = React.useState(DEFAULT_MESSAGE)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    function showNetworkError(event?: Event) {
      const detail = (event as CustomEvent<NetworkErrorEventDetail> | undefined)
        ?.detail

      setMessage(detail?.message || DEFAULT_MESSAGE)
      setVisible(true)
    }

    function onOffline() {
      setMessage(
        "Votre connexion semble coupée. Revenez en ligne, puis réessayez."
      )
      setVisible(true)
    }

    function onOnline() {
      setVisible(false)
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      onOffline()
    }

    window.addEventListener(NETWORK_ERROR_EVENT_NAME, showNetworkError)
    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)

    return () => {
      window.removeEventListener(NETWORK_ERROR_EVENT_NAME, showNetworkError)
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
    }
  }, [])

  if (!visible) {
    return null
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed right-4 bottom-4 left-4 z-[120] text-foreground sm:right-6 sm:bottom-6 sm:left-auto sm:w-[420px]"
    >
      <div className="rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <WifiOff className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Connexion indisponible
                </p>
                <h2 className="mt-1 text-base font-semibold">
                  Oups, il y a un souci de réseau.
                </h2>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="-mt-1 -mr-1"
                onClick={() => setVisible(false)}
              >
                <X />
                <span className="sr-only">Fermer l&apos;alerte réseau</span>
              </Button>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {message}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4 h-9"
              onClick={() => window.location.reload()}
            >
              <RefreshCw />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { NetworkErrorScreen }
