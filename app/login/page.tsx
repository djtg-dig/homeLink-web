import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Connexion | Loyer360",
}

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string
    registered?: string
  }>
}

function safeRedirectPath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/"
  }

  return path
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {}

  return (
    <AuthShell
      title="Connexion"
      description="Accédez à votre espace Loyer360 avec votre email et votre mot de passe."
      actionText="Pas encore de compte ?"
      actionLabel="Créer un compte"
      actionHref="/register"
    >
      <LoginForm
        redirectTo={safeRedirectPath(params.next)}
        registered={params.registered === "1"}
      />
    </AuthShell>
  )
}
