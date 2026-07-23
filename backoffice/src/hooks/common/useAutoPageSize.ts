import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

const RESIZE_DEBOUNCE_MS = 150

// Alturas fijas (px) de piezas de "chrome" de la tabla que no dependen del
// contenido, alineadas a las utilidades de Tailwind usadas en
// `DataTable`/`Footer` (thead: px-4 py-3 + text-xs; barra de paginación:
// border-t + py-2 + botones h-8; footer: border-t + py-2 + text-xs). Son
// aproximaciones deliberadas (no hace falta pixel-perfect): el objetivo es
// nunca pedir de más y generar scroll, así que se redondea hacia abajo.
const TABLE_HEADER_HEIGHT_PX = 41
// Barra de paginación: px-4 py-2 con botones h-8 (32) + py-2 (16) + border-t
// (1) ≈ 49px medidos. Subestimarla metía una fila de más y volvía el scroll.
const PAGINATION_BAR_HEIGHT_PX = 49
const FOOTER_HEIGHT_PX = 37
// Fila de datos: px-4 py-3 (24px) + line-height text-sm (~20px) + border-b (1px).
const ROW_HEIGHT_PX = 45
// Colchón de seguridad para bordes/gaps/sub-píxeles que el modelo de constantes
// no captura exactamente: garantiza redondear hacia ABAJO cuando estamos al
// borde de una fila, para no overshootear nunca (el usuario prioriza "sin
// scroll" sobre encajar una fila extra).
const SAFETY_MARGIN_PX = 12
const MIN_PAGE_SIZE = 5

// Breakpoints de Tailwind usados por el `<main>` de `SidebarLayout` (p-4
// sm:p-6 lg:p-8). Solo hace falta el padding INFERIOR: el superior ya está
// implícito en `containerTop` (la posición real medida en el DOM ya "pasó"
// ese padding).
const getMainBottomPaddingPx = (viewportWidth: number): number => {
  if (viewportWidth >= 1024) return 32
  if (viewportWidth >= 640) return 24
  return 16
}

export interface UseAutoPageSizeOptions {
  /**
   * Ref del contenedor que envuelve la tabla (ej. el `div` justo antes de
   * `<DataTable />`). Se usa su posición real (`getBoundingClientRect().top`)
   * para saber cuánto espacio ya ocupó todo lo que está por encima (padding
   * superior del `main`, título de la página, filtros, etc.), sin tener que
   * hardcodear la altura de cada uno.
   */
  containerRef: RefObject<HTMLElement | null>
  /** Piso de filas por página, por si la pantalla es muy chica. Default 5. */
  minPageSize?: number
}

// Calcula cuántas filas de `DataTable` entran en la pantalla sin scroll, para
// pedirle al backend (modo paginado server-side) exactamente esa cantidad.
// Recalcula en cada resize de la ventana.
//
// Devuelve `undefined` hasta tener la primera medición ya asentada: así el
// consumidor (`useGetX`) puede diferir el fetch inicial (`enabled: pageSize
// != null`) y evitar una primera request con un `pageSize` por defecto que
// se descarta enseguida al conocerse el valor real.
export function useAutoPageSize({
  containerRef,
  minPageSize = MIN_PAGE_SIZE,
}: UseAutoPageSizeOptions): number | undefined {
  const [pageSize, setPageSize] = useState<number | undefined>(undefined)
  // Último valor commiteado: permite ignorar mediciones que llegan al mismo
  // resultado de siempre (no generar un re-render/reset de página porque sí).
  const committedRef = useRef<number | undefined>(undefined)

  const measure = useCallback((): number => {
    const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0
    const reservedHeight =
      containerTop +
      getMainBottomPaddingPx(window.innerWidth) +
      TABLE_HEADER_HEIGHT_PX +
      PAGINATION_BAR_HEIGHT_PX +
      FOOTER_HEIGHT_PX +
      SAFETY_MARGIN_PX

    const availableHeight = window.innerHeight - reservedHeight
    const rowsThatFit = Math.floor(availableHeight / ROW_HEIGHT_PX)
    return Math.max(minPageSize, rowsThatFit)
  }, [containerRef, minPageSize])

  const commit = useCallback((value: number) => {
    if (committedRef.current === value) return
    committedRef.current = value
    setPageSize(value)
  }, [])

  useLayoutEffect(() => {
    // Medición inicial SINCRÓNICA (sin `requestAnimationFrame`): dentro de
    // `useLayoutEffect` el layout ya está calculado, así que el rect es válido
    // incluso si la pestaña está en segundo plano. Depender de rAF acá colgaba
    // la grilla para siempre cuando montaba en un tab oculto (el navegador
    // suspende rAF en tabs ocultos), dejando el fetch sin disparar nunca.
    commit(measure())

    // Recalcular ante cambios de tamaño (resize de ventana o del contenedor),
    // con un debounce por `setTimeout` —que sí corre en tabs ocultos, a
    // diferencia de rAF— para coalescer mediciones transitorias (aparición de
    // scrollbar, reflow por fuentes) en un único valor estable y no resetear
    // la página sin motivo. El `commit` dedup ignora mediciones que dan el
    // mismo valor, así que el crecimiento del contenedor al cargar filas (que
    // no cambia `containerTop`) no dispara refetch.
    let debounceId: ReturnType<typeof setTimeout> | undefined
    const scheduleMeasure = () => {
      if (debounceId !== undefined) clearTimeout(debounceId)
      debounceId = setTimeout(() => commit(measure()), RESIZE_DEBOUNCE_MS)
    }

    window.addEventListener('resize', scheduleMeasure)
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleMeasure)
        : null
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      if (debounceId !== undefined) clearTimeout(debounceId)
      window.removeEventListener('resize', scheduleMeasure)
      resizeObserver?.disconnect()
    }
  }, [measure, commit, containerRef])

  return pageSize
}
