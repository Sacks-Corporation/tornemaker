import type { FormEvent } from 'react'
import Logo from '../../common/Logo'
import Footer from '../../common/Footer'
import TextInput from '../../common/TextInput'
import Button from '../../common/Button'
import Alert from '../../common/Alert'

export interface LoginFormErrors {
  email?: string
  password?: string
}

export interface LoginPageProps {
  title: string
  subtitle: string
  emailLabel: string
  emailPlaceholder: string
  passwordLabel: string
  passwordPlaceholder: string
  showPasswordLabel: string
  hidePasswordLabel: string
  submitLabel: string
  submittingLabel: string
  errorMessage: string
  email: string
  password: string
  errors: LoginFormErrors
  isSubmitting: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

// Pantalla de login del backoffice: card centrada sobre el fondo, sin sidebar.
function LoginPage({
  title,
  subtitle,
  emailLabel,
  emailPlaceholder,
  passwordLabel,
  passwordPlaceholder,
  showPasswordLabel,
  hidePasswordLabel,
  submitLabel,
  submittingLabel,
  errorMessage,
  email,
  password,
  errors,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo variant="lockup" className="mb-4 h-10 w-auto" />
            <h1 className="text-2xl font-semibold text-text">{title}</h1>
            <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
          </div>

          {errorMessage && (
            <Alert variant="warning" className="mb-4">
              {errorMessage}
            </Alert>
          )}

          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <TextInput
              label={emailLabel}
              placeholder={emailPlaceholder}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              error={errors.email}
              disabled={isSubmitting}
            />

            <TextInput
              label={passwordLabel}
              placeholder={passwordPlaceholder}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              error={errors.password}
              showPasswordToggle
              showPasswordLabel={showPasswordLabel}
              hidePasswordLabel={hidePasswordLabel}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isSubmitting}
              loadingLabel={submittingLabel}
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default LoginPage
