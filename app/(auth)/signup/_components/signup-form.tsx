"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { AGE_MAX, AGE_MIN } from "@/lib/constants"
import { signupAction, type SignupActionState } from "../actions"

const initialState: SignupActionState = {}

type SignupFormProps = {
  defaultUsername?: string
}

export function SignupForm({ defaultUsername = "" }: SignupFormProps) {
  const [state, action] = useActionState(signupAction, initialState)

  // Inputs contrôlés : sinon React 19 reset tous les champs non-contrôlés
  // à la fin de chaque action, même quand elle renvoie des erreurs.
  const [username, setUsername] = useState(defaultUsername)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [age, setAge] = useState("")

  // Quand le serveur retourne des erreurs, on vide uniquement les champs
  // en erreur. Les valeurs valides sont conservées.
  useEffect(() => {
    if (!state.errors) return
    if (state.errors.username) setUsername("")
    if (state.errors.email) setEmail("")
    if (state.errors.password) setPassword("")
    if (state.errors.age) setAge("")
  }, [state])

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormField
        label="Pseudo"
        name="username"
        autoComplete="username"
        prefix="@"
        placeholder="ton-pseudo"
        required
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={state.errors?.username}
        hint="3 à 20 caractères : minuscules, chiffres ou tirets."
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="toi@email.com"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={state.errors?.email}
      />
      <FormField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Au moins 8 caractères"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={state.errors?.password}
      />
      <FormField
        label="Âge"
        name="age"
        type="number"
        inputMode="numeric"
        min={AGE_MIN}
        max={AGE_MAX}
        placeholder={`${AGE_MIN} ans ou +`}
        required
        value={age}
        onChange={(e) => setAge(e.target.value)}
        error={state.errors?.age}
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
      variant="accent"
      className="w-full"
      disabled={pending}
    >
      {pending ? "Création…" : "Créer mon compte"}
    </Button>
  )
}
