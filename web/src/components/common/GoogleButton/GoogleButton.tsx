import { useEffect, useRef } from 'react'
import type { GoogleButtonText } from '../../../types/google.types'

export interface GoogleButtonProps {
  isReady: boolean
  clientId: string
  onCredential: (idToken: string) => void
  text: GoogleButtonText
  unavailableLabel: string
  disabled?: boolean
}

// Renderiza el botón oficial de Google Identity Services dentro de un
// contenedor propio. Se usa igual en Login ("continue_with") y en Registro
// ("signup_with"); el backend crea la cuenta si todavía no existe.
function GoogleButton({
  isReady,
  clientId,
  onCredential,
  text,
  unavailableLabel,
  disabled,
}: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isReady || !containerRef.current || !window.google) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onCredential(response.credential),
      ux_mode: 'popup',
    })

    containerRef.current.innerHTML = ''
    window.google.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text,
      width: 320,
    })
  }, [isReady, clientId, onCredential, text])

  if (!isReady) {
    return (
      <div className="flex w-full items-center justify-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm text-text-muted">
        {unavailableLabel}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={disabled ? 'pointer-events-none opacity-50' : 'flex w-full justify-center'}
    />
  )
}

export default GoogleButton
