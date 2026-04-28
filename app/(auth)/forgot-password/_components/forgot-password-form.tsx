"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import {
  forgotPasswordAction,
  type ForgotPasswordActionState
} from "../actions"

const initialState: ForgotPasswordActionState = {}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialState)

  if (state.sent) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 text-center space-y-2 animate-fade-in">
        <CheckCircle2 className="mx-auto h-8 w-8 text-accent" />
        <h3 className="font-semibold text-forest">Email envoyé</h3>
        <p className="text-sm text-muted-foreground">
          Si cette adresse correspond à un compte, tu vas recevoir un email
          avec un lien pour réinitialiser ton mot de passe. Vérifie aussi tes
          spams.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="toi@email.com"
        required
        autoFocus
        error={state.errors?.email}
      />
      {state.errors?.form && (
        <p className="text-sm font-medium text-destructive animate-fade-in">
          {state.errors.form}
        </p>
      )}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Envoi…" : "M'envoyer un lien"}
    </Button>
  )
}
