"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { signupAction, type SignupActionState } from "../actions"

const initialState: SignupActionState = {}

type SignupFormProps = {
  defaultUsername?: string
}

export function SignupForm({ defaultUsername = "" }: SignupFormProps) {
  const [state, action] = useActionState(signupAction, initialState)

  if (state.needsConfirmation) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 text-center space-y-2 animate-fade-in">
        <CheckCircle2 className="mx-auto h-8 w-8 text-accent" />
        <h3 className="font-semibold text-forest">Compte créé !</h3>
        <p className="text-sm text-muted-foreground">
          On vient de t&apos;envoyer un email à{" "}
          <strong className="text-forest">{state.email}</strong> pour confirmer
          ton inscription. Clique sur le lien et ton GoodLink sera prêt.
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
        prefix="goodlink/"
        placeholder="pierre"
        required
        autoFocus
        defaultValue={defaultUsername}
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
        error={state.errors?.email}
      />
      <FormField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Au moins 8 caractères"
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
      variant="accent"
      className="w-full"
      disabled={pending}
    >
      {pending ? "Création…" : "Créer mon GoodLink"}
    </Button>
  )
}
