import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Connexion | Homelink",
}

type LoginPageProps = {
  searchParams?: Promise<{
    registered?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {}

  return (
    <AuthShell
      title="Connexion"
      description="Accedez a votre espace Homelink avec votre email et votre mot de passe."
      actionText="Pas encore de compte ?"
      actionLabel="Creer un compte"
      actionHref="/register"
    >
      <LoginForm registered={params.registered === "1"} />
    </AuthShell>
  )
}
