import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Inscription | Loyer360",
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Inscription"
      description="Créez votre compte Loyer360 pour rejoindre la plateforme."
      actionText="Vous avez déjà un compte ?"
      actionLabel="Se connecter"
      actionHref="/login"
    >
      <RegisterForm />
    </AuthShell>
  )
}
