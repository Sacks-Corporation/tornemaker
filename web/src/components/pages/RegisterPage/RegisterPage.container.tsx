import { useState } from 'react'
import type { FocusEvent, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import RegisterPage from './RegisterPage'
import type { RegisterFormErrors } from './RegisterPage'
import { useAuth } from '../../../hooks/auth/AuthContext'
import {
  useGoogleLoginMutation,
  useRegisterMutation,
} from '../../../hooks/auth/useAuthMutations'
import { getAuthErrorKey } from '../../../utils/auth.errors'
import { isRequired, isValidEmail, isValidPassword } from '../../../utils/auth.validation'

function RegisterPageContainer() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login: setSession } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const registerMutation = useRegisterMutation()
  const googleLoginMutation = useGoogleLoginMutation()

  const validate = (): RegisterFormErrors => {
    const nextErrors: RegisterFormErrors = {}

    if (!isRequired(firstName)) {
      nextErrors.firstName = t('auth.validation.required')
    }

    if (!isRequired(lastName)) {
      nextErrors.lastName = t('auth.validation.required')
    }

    if (!isRequired(email)) {
      nextErrors.email = t('auth.validation.required')
    } else if (!isValidEmail(email)) {
      nextErrors.email = t('auth.validation.invalidEmail')
    }

    if (!isRequired(password)) {
      nextErrors.password = t('auth.validation.required')
    } else if (!isValidPassword(password)) {
      nextErrors.password = t('auth.validation.invalidPassword')
    }

    if (!isRequired(confirmPassword)) {
      nextErrors.confirmPassword = t('auth.validation.required')
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = t('auth.validation.passwordMismatch')
    }

    return nextErrors
  }

  const handleConfirmPasswordBlur = (_event: FocusEvent<HTMLInputElement>) => {
    if (!confirmPassword) return
    setErrors((prev) => ({
      ...prev,
      confirmPassword:
        confirmPassword !== password ? t('auth.validation.passwordMismatch') : undefined,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setServerError(null)

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    // "Repetir contraseña" nunca se envía al backend.
    registerMutation.mutate(
      { firstName, lastName, email, password },
      {
        onSuccess: (data) => {
          setSession(data)
          navigate('/', { replace: true })
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
          navigate('/', { replace: true })
        },
        onError: (error) => {
          setServerError(t(getAuthErrorKey(error)))
        },
      },
    )
  }

  const isSubmitting = registerMutation.isPending || googleLoginMutation.isPending

  return (
    <RegisterPage
      firstName={firstName}
      lastName={lastName}
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      errors={errors}
      serverError={serverError}
      isSubmitting={isSubmitting}
      onFirstNameChange={setFirstName}
      onLastNameChange={setLastName}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onConfirmPasswordBlur={handleConfirmPasswordBlur}
      onSubmit={handleSubmit}
      onGoogleCredential={handleGoogleCredential}
    />
  )
}

export default RegisterPageContainer
