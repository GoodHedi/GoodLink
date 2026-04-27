"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FormFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  label: string
  error?: string
  hint?: string
  prefix?: string
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField(
    { label, error, hint, prefix, name, id, className, ...props },
    ref
  ) {
    const inputId = id ?? `field-${name}`
    const hasError = Boolean(error)
    const describedBy = hasError
      ? `${inputId}-error`
      : hint
        ? `${inputId}-hint`
        : undefined

    return (
      <div className="space-y-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        <div
          className={cn(
            "flex items-center rounded-xl border bg-background overflow-hidden transition-colors",
            "focus-within:ring-2 focus-within:ring-offset-1",
            hasError
              ? "border-destructive focus-within:ring-destructive focus-within:border-destructive"
              : "border-input focus-within:ring-ring focus-within:border-ring"
          )}
        >
          {prefix && (
            <span className="pl-4 pr-1 text-sm text-muted-foreground select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            name={name}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cn(
              "flex-1 h-11 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              prefix ? "pl-0 pr-4" : "px-4",
              className
            )}
            {...props}
          />
        </div>
        {hasError ? (
          <p
            id={`${inputId}-error`}
            className="text-xs font-medium text-destructive animate-fade-in"
          >
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    )
  }
)
