// Validaciones de cliente para el formulario de login del backoffice.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isRequired = (value: string): boolean => value.trim().length > 0

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test(value.trim())
