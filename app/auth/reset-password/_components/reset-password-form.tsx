"use client"

import { useActionState, useEffect, useState } from "react"
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
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (!state.errors) return
    // Champ vidé seulement si erreur sur le mot de passe (pas en cas
    // d'erreur form-level type "session expirée").
    if (state.errors.password) setPassword("")
  }, [state])

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
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
