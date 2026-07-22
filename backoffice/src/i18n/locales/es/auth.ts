const auth = {
  login: {
    title: 'Iniciar sesión',
    subtitle: 'Ingresá tus credenciales para acceder al backoffice.',
    fields: {
      email: 'Correo electrónico',
      password: 'Contraseña',
    },
    placeholders: {
      email: 'nombre@correo.com',
      password: 'Tu contraseña',
    },
    togglePassword: {
      show: 'Mostrar contraseña',
      hide: 'Ocultar contraseña',
    },
    submit: 'Iniciar sesión',
    submitting: 'Ingresando…',
    errors: {
      invalidCredentials: 'Correo o contraseña incorrectos.',
    },
    validation: {
      required: 'Este campo es obligatorio',
      invalidEmail: 'Ingresá un correo electrónico válido',
    },
  },
} as const

export default auth
