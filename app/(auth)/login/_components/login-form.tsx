"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { loginAction, type LoginActionState } from "../actions"

const initialState: LoginActionState = {}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState)

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
      <FormField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        error={state.errors?.password}
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
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      {pending ? "Connexion…" : "Se connecter"}
    </Button>
  )
}
