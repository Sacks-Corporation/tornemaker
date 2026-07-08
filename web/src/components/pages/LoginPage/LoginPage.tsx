import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Header from '../../common/Header'
import Footer from '../../common/Footer'
import Button from '../../common/Button'
import TextInput from '../../common/TextInput'
import GoogleButton from '../../common/GoogleButton'

export interface LoginFormErrors {
  email?: string
  password?: string
}

export interface LoginPageProps {
  email: string
  password: string
  errors: LoginFormErrors
  serverError: string | null
  isSubmitting: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onGoogleCredential: (idToken: string) => void
}

function LoginPage({
  email,
  password,
  errors,
  serverError,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleCredential,
}: LoginPageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-text sm:text-3xl">{t('auth.login.title')}</h1>
            <p className="mt-2 text-sm text-text-muted sm:text-base">
              {t('auth.login.subtitle')}
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
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              error={errors.password}
              showPasswordToggle
              showPasswordLabel={t('auth.togglePassword.show')}
              hidePasswordLabel={t('auth.togglePassword.hide')}
            />

            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase text-text-muted">{t('auth.divider')}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleButton
            onCredential={onGoogleCredential}
            text="continue_with"
            disabled={isSubmitting}
          />

          <p className="mt-6 text-center text-sm text-text-muted">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t('auth.login.registerLink')}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default LoginPage
