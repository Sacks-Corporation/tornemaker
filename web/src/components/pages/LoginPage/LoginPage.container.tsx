import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import LoginPage from './LoginPage'
import type { LoginFormErrors } from './LoginPage'
import { useAuth } from '../../../hooks/auth/AuthContext'
import { useGoogleLoginMutation, useLoginMutation } from '../../../hooks/auth/useAuthMutations'
import { getAuthErrorKey } from '../../../utils/auth.errors'
import { isRequired, isValidEmail } from '../../../utils/auth.validation'

function LoginPageContainer() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login: setSession } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const loginMutation = useLoginMutation()
  const googleLoginMutation = useGoogleLoginMutation()

  const redirectAfterAuth = () => {
    const from = (location.state as { from?: Location } | null)?.from
    navigate(from ? `${from.pathname}${from.search}` : '/', { replace: true })
  }

  const validate = (): LoginFormErrors => {
    const nextErrors: LoginFormErrors = {}

    if (!isRequired(email)) {
      nextErrors.email = t('auth.validation.required')
    } else if (!isValidEmail(email)) {
      nextErrors.email = t('auth.validation.invalidEmail')
    }

    if (!isRequired(password)) {
      nextErrors.password = t('auth.validation.required')
    }

    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setServerError(null)

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setSession(data)
          redirectAfterAuth()
        },
        onError: (error) => {
          setServerError(t(getAuthErrorKey(error)))
        },
      },
    )
  }

  const handleGoogleCredential = (idToken: string) => {
    setServerError(null)
    googleLoginMutation.mutate(
      { idToken },
      {
        onSuccess: (data) => {
          setSession(data)
          redirectAfterAuth()
        },
        onError: (error) => {
          setServerError(t(getAuthErrorKey(error)))
        },
      },
    )
  }

  const isSubmitting = loginMutation.isPending || googleLoginMutation.isPending

  return (
    <LoginPage
      email={email}
      password={password}
      errors={errors}
      serverError={serverError}
      isSubmitting={isSubmitting}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      onGoogleCredential={handleGoogleCredential}
    />
  )
}

export default LoginPageContainer
