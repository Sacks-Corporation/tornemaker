import type { FocusEvent, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Header from '../../common/Header'
import Footer from '../../common/Footer'
import Button from '../../common/Button'
import TextInput from '../../common/TextInput'
import GoogleButton from '../../common/GoogleButton'

export interface RegisterFormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export interface RegisterPageProps {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  errors: RegisterFormErrors
  serverError: string | null
  isSubmitting: boolean
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onConfirmPasswordBlur: (event: FocusEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onGoogleCredential: (idToken: string) => void
}

function RegisterPage({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  errors,
  serverError,
  isSubmitting,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onConfirmPasswordBlur,
  onSubmit,
  onGoogleCredential,
}: RegisterPageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-text sm:text-3xl">
              {t('auth.register.title')}
            </h1>
            <p className="mt-2 text-sm text-text-muted sm:text-base">
              {t('auth.register.subtitle')}
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label={t('auth.fields.firstName')}
                placeholder={t('auth.placeholders.firstName')}
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => onFirstNameChange(event.target.value)}
                error={errors.firstName}
              />

              <TextInput
                label={t('auth.fields.lastName')}
                placeholder={t('auth.placeholders.lastName')}
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => onLastNameChange(event.target.value)}
                error={errors.lastName}
              />
            </div>

            <TextInput
              label={t('auth.fields.email')}
              placeholder={t('auth.placeholders.email')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              error={errors.email}
            />

            <TextInput
              label={t('auth.fields.password')}
              placeholder={t('auth.placeholders.password')}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              error={errors.password}
              showPasswordToggle
              showPasswordLabel={t('auth.togglePassword.show')}
              hidePasswordLabel={t('auth.togglePassword.hide')}
            />

            <TextInput
              label={t('auth.fields.confirmPassword')}
              placeholder={t('auth.placeholders.confirmPassword')}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => onConfirmPasswordChange(event.target.value)}
              onBlur={onConfirmPasswordBlur}
              error={errors.confirmPassword}
              showPasswordToggle
              showPasswordLabel={t('auth.togglePassword.show')}
              hidePasswordLabel={t('auth.togglePassword.hide')}
            />

            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase text-text-muted">{t('auth.divider')}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleButton
            onCredential={onGoogleCredential}
            text="signup_with"
            disabled={isSubmitting}
          />

          <p className="mt-6 text-center text-sm text-text-muted">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.register.loginLink')}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default RegisterPage
