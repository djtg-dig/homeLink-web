"use client"

import * as React from "react"
import { RefreshCw, WifiOff } from "lucide-react"

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
      className="fixed inset-0 z-[120] flex min-h-svh items-center justify-center bg-background px-4 py-8 text-foreground"
    >
      <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-lg bg-secondary text-primary shadow-sm">
          <WifiOff className="size-8" />
        </span>
        <p className="mt-6 text-sm font-medium text-muted-foreground">
          Connexion indisponible
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
          Oups, il y a un souci de réseau.
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {message}
        </p>
        <Button
          type="button"
          className="mt-6 h-10"
          onClick={() => window.location.reload()}
        >
          <RefreshCw />
          Réessayer
        </Button>
      </div>
    </div>
  )
}

export { NetworkErrorScreen }
