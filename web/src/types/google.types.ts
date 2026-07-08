// Tipado mínimo de Google Identity Services (GSI) para el flujo de ID token.
// Referencia: https://developers.google.com/identity/gsi/web/reference/js-reference

export interface GoogleCredentialResponse {
  credential: string
  select_by?: string
}

export interface GoogleIdConfiguration {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  ux_mode?: 'popup' | 'redirect'
}

export type GoogleButtonTheme = 'outline' | 'filled_blue' | 'filled_black'
export type GoogleButtonSize = 'large' | 'medium' | 'small'
export type GoogleButtonShape = 'rectangular' | 'pill' | 'circle' | 'square'
export type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with' | 'signin'

export interface GoogleButtonConfiguration {
  type?: 'standard' | 'icon'
  theme?: GoogleButtonTheme
  size?: GoogleButtonSize
  text?: GoogleButtonText
  shape?: GoogleButtonShape
  logo_alignment?: 'left' | 'center'
  width?: string | number
  locale?: string
}

export interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void
  renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void
  prompt: () => void
  disableAutoSelect: () => void
}

export interface GoogleAccounts {
  id: GoogleAccountsId
}

export interface GoogleGlobal {
  accounts: GoogleAccounts
}

declare global {
  interface Window {
    google?: GoogleGlobal
  }
}
