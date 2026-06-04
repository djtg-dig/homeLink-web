import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Inscription | Homelink",
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Inscription"
      description="Créez votre compte Homelink pour rejoindre la plateforme."
      actionText="Vous avez déjà un compte ?"
      actionLabel="Se connecter"
      actionHref="/login"
    >
      <RegisterForm />
    </AuthShell>
  )
}
