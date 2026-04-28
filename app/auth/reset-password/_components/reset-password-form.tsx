"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import {
  resetPasswordAction,
  type ResetPasswordActionState
} from "../actions"

const initialState: ResetPasswordActionState = {}

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, initialState)

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormField
        label="Nouveau mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Au moins 8 caractères"
        required
        autoFocus
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
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Mise à jour…" : "Définir mon mot de passe"}
    </Button>
  )
}
