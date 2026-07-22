import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import LoginPage from './LoginPage'
import type { LoginFormErrors } from './LoginPage'
import { useAuth } from '../../../hooks/auth/useAuth'
import { useLogin } from '../../../hooks/auth/useLogin'
import { isRequired, isValidEmail } from '../../../utils/auth.validation'

function LoginPageContainer() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const loginMutation = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginFormErrors>({})

  // Usuario ya autenticado que entra a /login: lo mandamos directo al dashboard.
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const validate = (): LoginFormErrors => {
    const nextErrors: LoginFormErrors = {}

    if (!isRequired(email)) {
      nextErrors.email = t('auth.login.validation.required')
    } else if (!isValidEmail(email)) {
      nextErrors.email = t('auth.login.validation.invalidEmail')
    }

    if (!isRequired(password)) {
      nextErrors.password = t('auth.login.validation.required')
    }

    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    loginMutation.reset()

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    loginMutation.mutate({ email, password })
  }

  return (
    <LoginPage
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      emailLabel={t('auth.login.fields.email')}
      emailPlaceholder={t('auth.login.placeholders.email')}
      passwordLabel={t('auth.login.fields.password')}
      passwordPlaceholder={t('auth.login.placeholders.password')}
      showPasswordLabel={t('auth.login.togglePassword.show')}
      hidePasswordLabel={t('auth.login.togglePassword.hide')}
      submitLabel={t('auth.login.submit')}
      submittingLabel={t('auth.login.submitting')}
      errorMessage={loginMutation.isError ? t('auth.login.errors.invalidCredentials') : ''}
      email={email}
      password={password}
      errors={errors}
      isSubmitting={loginMutation.isPending}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  )
}

export default LoginPageContainer
export type { LoginFormErrors }
