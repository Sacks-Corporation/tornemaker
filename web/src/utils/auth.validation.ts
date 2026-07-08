// Validaciones de cliente para los formularios de login y registro.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_HAS_LETTER = /[a-zA-Z]/
const PASSWORD_HAS_NUMBER = /\d/

export const isRequired = (value: string): boolean => value.trim().length > 0

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test(value.trim())

export const isValidPassword = (value: string): boolean =>
  value.length >= PASSWORD_MIN_LENGTH &&
  PASSWORD_HAS_LETTER.test(value) &&
  PASSWORD_HAS_NUMBER.test(value)
