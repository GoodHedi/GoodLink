"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { CheckCircle2, Mail } from "lucide-react"
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

  // Compte créé, en attente de confirmation email
  if (state.needsConfirmation) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center space-y-3 animate-fade-in">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lift">
          <Mail className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-forest">
          Vérifie tes emails
        </h3>
        <p className="text-sm text-muted-foreground">
          On vient d&apos;envoyer un lien de confirmation à{" "}
          <strong className="text-forest">{state.email}</strong>.
          <br />
          Clique dessus et tu seras connecté automatiquement à GoodLink.
        </p>
        <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
          Pense à vérifier tes spams si rien dans 2 minutes.
        </p>
      </div>
    )
  }

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
