const auth = {
  login: {
    title: 'Iniciar sesión',
    subtitle: 'Ingresá tus datos para acceder a tu cuenta.',
    submit: 'Iniciar sesión',
    submitting: 'Ingresando…',
    noAccount: '¿No tenés una cuenta?',
    registerLink: 'Registrate',
  },
  register: {
    title: 'Crear cuenta',
    subtitle: 'Completá tus datos para empezar a organizar torneos.',
    submit: 'Crear cuenta',
    submitting: 'Creando cuenta…',
    hasAccount: '¿Ya tenés una cuenta?',
    loginLink: 'Iniciá sesión',
  },
  fields: {
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Repetir contraseña',
  },
  placeholders: {
    firstName: 'Tu nombre',
    lastName: 'Tu apellido',
    email: 'nombre@correo.com',
    password: 'Tu contraseña',
    confirmPassword: 'Repetí tu contraseña',
  },
  togglePassword: {
    show: 'Mostrar contraseña',
    hide: 'Ocultar contraseña',
  },
  divider: 'o',
  google: {
    loginCta: 'Continuar con Google',
    registerCta: 'Registrarse con Google',
    unavailable: 'El inicio de sesión con Google no está disponible en este momento.',
  },
  validation: {
    required: 'Este campo es obligatorio',
    invalidEmail: 'Ingresá un correo electrónico válido',
    invalidPassword: 'La contraseña debe tener al menos 8 caracteres, con al menos una letra y un número',
    passwordMismatch: 'Las contraseñas no coinciden',
  },
  errors: {
    invalidCredentials: 'Correo o contraseña incorrectos',
    useGoogleLogin: 'Esta cuenta usa Google para iniciar sesión',
    emailAlreadyRegistered: 'Ese correo ya está registrado',
    generic: 'Ocurrió un error inesperado. Intentá de nuevo.',
  },
  session: {
    loginCta: 'Iniciar sesión',
    logoutCta: 'Cerrar sesión',
  },
} as const

export default auth
