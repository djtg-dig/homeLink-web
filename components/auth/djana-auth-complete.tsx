"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { fetchCurrentAccountProfile } from "@/lib/account-client"
import { storeAuthTokens } from "@/lib/auth-storage"

function safeRedirectPath(path?: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard"
  }

  return path
}

function readDjanaAuthResult() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const searchParams = new URLSearchParams(window.location.search)

  return {
    access:
      hashParams.get("access") ||
      hashParams.get("access_token") ||
      hashParams.get("token") ||
      searchParams.get("access") ||
      searchParams.get("access_token") ||
      searchParams.get("token"),
    next: hashParams.get("next") || searchParams.get("next"),
    refresh:
      hashParams.get("refresh") ||
      hashParams.get("refresh_token") ||
      searchParams.get("refresh") ||
      searchParams.get("refresh_token"),
  }
}

function DjanaAuthComplete() {
  const router = useRouter()
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function completeDjanaLogin() {
      const tokens = readDjanaAuthResult()

      if (!tokens.access) {
        setError("Les informations de connexion Djana sont manquantes.")
        return
      }

      storeAuthTokens({
        accessToken: tokens.access,
        refreshToken: tokens.refresh ?? undefined,
        scheme: "Bearer",
      })

      const sessionResponse = await fetch("/api/auth/session", {
        body: JSON.stringify({
          access: tokens.access,
          refresh: tokens.refresh,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      })

      if (!sessionResponse.ok) {
        throw new Error("Session Loyer360 indisponible.")
      }

      const profile = await fetchCurrentAccountProfile()

      if (!profile) {
        throw new Error("Profil Loyer360 introuvable.")
      }

      if (!cancelled) {
        window.history.replaceState(null, "", "/auth/djana/complete")
        router.replace(safeRedirectPath(tokens.next))
        router.refresh()
      }
    }

    void completeDjanaLogin().catch(() => {
      if (!cancelled) {
        setError("Connexion Djana impossible pour le moment.")
      }
    })

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <main className="grid min-h-svh place-items-center bg-muted px-4 py-8 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center text-card-foreground shadow-sm">
        {error ? (
          <>
            <XCircle className="mx-auto size-10 text-destructive" />
            <h1 className="mt-5 text-2xl font-semibold">
              Connexion incomplète
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {error}
            </p>
            <Button asChild className="mt-6">
              <Link href="/login">Retour à la connexion</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-10 animate-spin text-primary" />
            <h1 className="mt-5 text-2xl font-semibold">
              Connexion en cours
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Nous finalisons votre session avec votre compte Djana.
            </p>
          </>
        )}
      </section>
    </main>
  )
}

export { DjanaAuthComplete }
