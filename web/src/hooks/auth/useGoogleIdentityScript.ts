import { useEffect, useState } from 'react'

const GOOGLE_GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptLoadingPromise: Promise<void> | null = null

const loadGoogleIdentityScript = (): Promise<void> => {
  if (window.google?.accounts?.id) return Promise.resolve()

  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${GOOGLE_GSI_SCRIPT_SRC}"]`,
      )
      if (existing) {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error('GOOGLE_SCRIPT_LOAD_ERROR')))
        return
      }

      const script = document.createElement('script')
      script.src = GOOGLE_GSI_SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('GOOGLE_SCRIPT_LOAD_ERROR'))
      document.head.appendChild(script)
    })
  }

  return scriptLoadingPromise
}

// Carga (una sola vez) el script de Google Identity Services sin depender de
// ningún paquete npm. Expone si ya está listo para usar `window.google`.
export function useGoogleIdentityScript() {
  const [isReady, setIsReady] = useState(() => Boolean(window.google?.accounts?.id))

  useEffect(() => {
    if (isReady) return

    let cancelled = false
    loadGoogleIdentityScript()
      .then(() => {
        if (!cancelled) setIsReady(true)
      })
      .catch(() => {
        if (!cancelled) setIsReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [isReady])

  return { isReady }
}
