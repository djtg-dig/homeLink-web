"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatApiMessage, readResponseBody } from "@/lib/api-errors"

const inputClassName =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
const labelClassName = "text-sm font-medium text-foreground"

function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirm_password") ?? "")

    setError("")

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setPending(true)

    try {
      const response = await fetch("/api/auth/register", {
        body: JSON.stringify({
          confirm_password: confirmPassword,
          email: String(formData.get("email") ?? "").trim(),
          first_name: String(formData.get("first_name") ?? "").trim(),
          last_name: String(formData.get("last_name") ?? "").trim(),
          password,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const body = await readResponseBody(response)

      if (!response.ok) {
        setError(formatApiMessage(body, "Inscription impossible."))
        return
      }

      router.push("/login?registered=1")
    } catch {
      setError("Inscription impossible pour le moment.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      {error ? (
        <p
          aria-live="polite"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={labelClassName} htmlFor="first_name">
            Prénom
          </label>
          <input
            className={inputClassName}
            id="first_name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClassName} htmlFor="last_name">
            Nom
          </label>
          <input
            className={inputClassName}
            id="last_name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            required
            disabled={pending}
          />
        </div>
      </div>

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
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <label className={labelClassName} htmlFor="confirm_password">
          Confirmer le mot de passe
        </label>
        <input
          className={inputClassName}
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>

      <Button
        className="h-11 w-full bg-brand-orange text-brand-navy hover:bg-brand-orange/90"
        type="submit"
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
        Créer un compte
      </Button>
    </form>
  )
}

export { RegisterForm }
