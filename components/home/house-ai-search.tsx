"use client"

import { useRouter } from "next/navigation"
import { Loader2, Sparkles, X } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { ApiError, apiFetch, jsonHeaders } from "@/lib/api-client"
import { formatApiMessage } from "@/lib/api-errors"
import {
  buildHouseAiResultsPath,
  type HouseAiSearchResponse,
} from "@/lib/house-ai-search"

function safeErrorMessage(message: string, fallback: string) {
  const normalizedMessage = message.trim()

  return normalizedMessage.startsWith("<") ? fallback : normalizedMessage
}

function HouseAiSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState(initialQuery)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    router.prefetch("/recherche-ia")
  }, [router])

  React.useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50)

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        setOpen(false)
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [loading, open])

  function closeDialog() {
    if (!loading) {
      setOpen(false)
      setError("")
    }
  }

  async function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const queryText = query.trim()

    if (!queryText || loading) {
      return
    }

    setError("")
    setLoading(true)

    try {
      const extraction = await apiFetch<HouseAiSearchResponse>(
        "/api/immovables/public/maisons/ai-search/",
        {
          body: JSON.stringify({ query: queryText }),
          headers: jsonHeaders(),
          method: "POST",
        }
      )

      if (!extraction.success) {
        const errorMessage = extraction.error || "La recherche n’a pas pu être comprise."
        throw new Error(errorMessage)
      }
      
      if (!extraction.filters) {
        throw new Error("La recherche n’a pas pu être comprise.")
      }

      setOpen(false)
      router.push(buildHouseAiResultsPath(queryText, extraction.filters))
    } catch (caughtError) {
      const fallback =
        "La recherche n’a pas pu aboutir. Réessayez dans un instant."

      if (caughtError instanceof ApiError) {
        setError(
          safeErrorMessage(
            formatApiMessage(caughtError.body, fallback),
            fallback
          )
        )
      } else {
        setError(
          safeErrorMessage(
            caughtError instanceof Error ? caughtError.message : fallback,
            fallback
          )
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open ? (
        <Button
          type="button"
          className="fixed right-4 bottom-4 z-40 size-12 gap-2 rounded-full p-0 shadow-xl sm:right-6 sm:bottom-6 sm:h-12 sm:w-auto sm:px-4"
          aria-label="Ouvrir la recherche IA"
          aria-expanded={open}
          aria-controls="house-ai-search-dialog"
          onClick={() => setOpen(true)}
        >
          <Sparkles className="size-5" />
          <span className="hidden sm:inline">Recherche IA</span>
        </Button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-navy/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="house-ai-search-title"
          id="house-ai-search-dialog"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog()
            }
          }}
        >
          <div className="w-full rounded-t-lg border border-border bg-card text-card-foreground shadow-2xl sm:max-w-lg sm:rounded-lg">
            <div className="flex items-center justify-between gap-4 border-b border-border p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Sparkles
                    className={loading ? "size-5 animate-pulse" : "size-5"}
                  />
                </span>
                <div className="min-w-0">
                  <h2
                    id="house-ai-search-title"
                    className="text-lg font-semibold"
                  >
                    Recherche de maison
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {loading ? "Analyse en cours" : "Maisons"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={closeDialog}
                disabled={loading}
              >
                <X />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>

            <form onSubmit={submitSearch} className="space-y-4 p-4 sm:p-5">
              <label className="grid gap-2 text-sm font-medium">
                Votre recherche
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Je cherche une maison à Gombe de plus de 3 chambres"
                  rows={4}
                  disabled={loading}
                  className="min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-base leading-6 outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:resize-none disabled:opacity-70"
                />
              </label>

              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="space-y-4 rounded-lg border border-primary/20 bg-secondary/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Loader2 className="size-5 animate-spin" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">Analyse de votre demande</p>
                      <p className="text-sm text-muted-foreground">
                        Les critères de recherche sont en cours de préparation.
                      </p>
                    </div>
                  </div>
                  <div className="grid h-1.5 grid-cols-3 gap-1 overflow-hidden rounded-sm">
                    <span className="animate-pulse bg-primary/35" />
                    <span className="animate-pulse bg-primary/60 [animation-delay:150ms]" />
                    <span className="animate-pulse bg-primary [animation-delay:300ms]" />
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  <p className="font-medium">Oups, l’analyse a échoué.</p>
                  <p className="mt-1 text-destructive/80">{error}</p>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={!query.trim() || loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles />
                  )}
                  {loading ? "Analyse en cours" : "Rechercher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

export { HouseAiSearch }
