"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatApiMessage, readResponseBody } from "@/lib/api-errors"
import { extractAuthTokens } from "@/lib/auth-tokens"
import { storeAuthTokens } from "@/lib/auth-storage"

const inputClassName =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const labelClassName = "text-sm font-medium text-foreground"

function LoginForm({
  redirectTo = "/",
  registered = false,
}: {
  redirectTo?: string
  registered?: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    setError("")
    setPending(true)

    try {
      const response = await fetch("/api/auth/login", {
        body: JSON.stringify({ email, password }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const body = await readResponseBody(response)

      if (!response.ok) {
        setError(formatApiMessage(body, "Connexion impossible."))
        return
      }

      const tokens = extractAuthTokens(body)

      if (!tokens) {
        setError("Connexion reussie, mais aucun token n'a ete renvoye.")
        return
      }

      storeAuthTokens(tokens)
      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError("Connexion impossible pour le moment.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      {registered ? (
        <p className="rounded-md border border-brand-cyan/35 bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          Inscription reussie. Vous pouvez maintenant vous connecter.
        </p>
      ) : null}

      {error ? (
        <p
          aria-live="polite"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label className={labelClassName} htmlFor="email">
          Email
        </label>
        <input
          className={inputClassName}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="user@example.com"
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <label className={labelClassName} htmlFor="password">
          Mot de passe
        </label>
        <input
          className={inputClassName}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </div>

      <Button
        className="h-11 w-full bg-brand-orange text-brand-navy hover:bg-brand-orange/90"
        type="submit"
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
        Se connecter
      </Button>
    </form>
  )
}

export { LoginForm }
