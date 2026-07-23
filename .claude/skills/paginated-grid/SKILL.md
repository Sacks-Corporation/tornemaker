---
name: paginated-grid
description: Usar cuando el usuario pida una grilla / tabla / listado de una entidad servida por un endpoint paginado del backend (aunque no mencione la skill por su nombre) en el proyecto backoffice/. Aplica solo a backoffice/, no a api/ ni web/.
---

# Skill: grilla paginada server-side (backoffice/)

Esta skill aplica **únicamente al proyecto `backoffice/`**. Codifica, paso a
paso, el patrón real ya implementado en `UsersPage` para listar una entidad
paginada por el backend en un `DataTable` en modo server-side (manual), con el
`pageSize` adaptado automáticamente al alto de pantalla vía `useAutoPageSize`.
No reinventes este patrón por página nueva: seguilo tal cual está acá.

Referencia viva de todo el patrón (mirala si hay dudas de estilo/naming):
`backoffice/src/components/pages/UsersPage/`,
`backoffice/src/hooks/users/useGetUsers.ts`,
`backoffice/src/api/users.api.ts`,
`backoffice/src/types/users.types.ts`,
`backoffice/src/hooks/common/useAutoPageSize.ts`.

## Primitivas de las que depende

Esta skill se apoya en dos primitivas comunes. **Ya existen — no las
recrees.** Si en algún momento no existieran (proyecto nuevo o se borraron),
creálas exactamente así antes de seguir con los pasos por grilla:

### 1. `DataTable` en modo manual/server-side

`components/common/DataTable` (`DataTable.tsx` + `DataTable.container.tsx`)
ya soporta dos modos:

- **Client-side (default)**: solo `useData` + `columns` (+ `pageSize` fijo
  opcional). Pagina en memoria sobre `rows` con `getPaginationRowModel` de
  `@tanstack/react-table`. NO tocar/romper este modo al usar el server-side.
- **Server-side ("manual")**: además de `useData`/`columns`/`pageSize`, se
  pasan `page` (1-indexed, estado dueño del padre) + `onPageChange`. El
  `useData` de este modo debe además devolver `total` (contrato
  `DataTableDataResult<T>` en `types/common.types.ts`). Cuando las tres
  (`page`, `total`, `onPageChange`) están presentes, `DataTable` activa
  `manualPagination: true` y calcula `pageCount = Math.max(1,
  Math.ceil(total / pageSize))`; deja de paginar `rows` en memoria (`rows`
  YA es la página actual, tal como la trajo el backend) y delega la
  navegación (`onPageChange(page - 1)` / `onPageChange(page + 1)`) al padre.
  El sorting en este modo solo reordena las filas de la página actual (no hay
  sorting server-side todavía).

Si falta alguna de las tres props, cae automáticamente al modo client-side de
siempre — es la misma prop `pageSize`/`useData`/`columns` para ambos modos,
así que no hay que crear un componente aparte.

En este modo el footer del `DataTable` muestra **siempre** el indicador de
página junto con el total, con el formato `Página X de Y · N resultados`
(ej. "Página 1 de 2 · 16 resultados"), aunque entre todo en una sola página
(muestra "Página 1 de 1 · N resultados"; se ve siempre, no solo con varias
páginas). No hace falta que el `useData` haga nada especial para esto, alcanza
con que devuelva `total`. Los botones prev/next solo aparecen si hay más de una
página, pero el texto del footer se muestra siempre.

### 2. Hook `useAutoPageSize` (`hooks/common/useAutoPageSize.ts`)

Calcula cuántas filas de `DataTable` entran en el viewport sin generar
scroll, para pedirle al backend exactamente esa cantidad como `pageSize`:

```
availableHeight = window.innerHeight
  − (posición real del contenedor de la tabla, vía containerRef.getBoundingClientRect().top)
  − padding inferior del <main> de SidebarLayout (según breakpoint: 16/24/32px)
  − alto del header de la tabla (thead)
  − alto de la barra de paginación
  − alto del footer

pageSize = max(minPageSize, floor(availableHeight / alto de fila))
```

IMPORTANTE — la garantía "sin scroll" depende de que TODAS las filas midan lo
mismo (el `alto de fila` es una constante fija). Por eso las celdas del
`DataTable` son de **una sola línea** (`whitespace-nowrap` en `<td>`/`<th>`): si
el contenido wrappeara a 2 líneas (nombres largos, fecha+hora en columnas
angostas, headers largos), las filas quedarían más altas que la constante, el
cálculo overshootearía y volvería el scroll vertical. Contenido que no entra
desborda por el `overflow-x-auto` de la tabla (scroll horizontal), nunca hacia
abajo. Para fechas en grillas con muchas columnas, preferí `formatDate` (solo
fecha) sobre `formatDateTime` para no ensanchar/wrappear la celda.

Devuelve `number | undefined`: `undefined` hasta la primera medición. Medí
**sincrónicamente dentro de `useLayoutEffect`** (ahí el layout ya está
calculado, así que el rect es válido) y commiteá ese primer valor de una.
IMPORTANTE: NO gatees la primera medición detrás de `requestAnimationFrame` —
el navegador suspende rAF en pestañas ocultas/en segundo plano, así que si la
grilla monta en un tab oculto la medición nunca commitea, el fetch nunca
dispara y la grilla queda trabada en skeleton para siempre. Para la
estabilidad (que el valor no "salte" por mediciones transitorias — scrollbar,
fuentes — y resetee la página) usá un `ResizeObserver` sobre el `containerRef`
+ listener de `resize`, con un debounce por `setTimeout` (que sí corre en tabs
ocultos, a diferencia de rAF). Solo commiteá (y re-renderizá) cuando el valor
cambió de verdad frente al último commiteado (un `ref` con el último valor
evita resets de página innecesarios). Recibe `containerRef` (ref del `div` que
envuelve el `<DataTable />`) y opcionalmente `minPageSize` (default 5).

**El consumidor debe frenar el fetch hasta tener la medición real** (`enabled:
pageSize != null` en el `useQuery` del paso 3) y forzar `isLoading: true` en
el `useData` puente mientras `pageSize` sea `undefined` — así se hace UNA
sola request con el `pageSize` correcto (nunca una primera con un default que
se descarta) y `DataTable` sigue mostrando el skeleton mientras tanto. Ver
`useGetUsers`/`UsersPage.container.tsx` como referencia exacta.

## Pasos por cada grilla nueva

Seguí este orden. `<grupo>` es el nombre del grupo de páginas (ej. `users`,
`tournaments`); `X`/`XListItem` son el nombre de la entidad (ej. `User` /
`UserListItem`).

### 1. `types/<grupo>.types.ts`

Definí `XListItem` con **solo los campos visibles en la grilla** — nunca
campos sensibles (passwords, hashes, tokens). Comentá de qué endpoint del
backend viene (ej. `GET /x`) y qué campos viajan serializados (fechas como
ISO string vía JSON). Reutilizá `PaginatedResponse<XListItem>` de
`types/common.types.ts` — no la redefinas.

### 2. `api/<grupo>.api.ts`

`getX(page, pageSize, sortField, sortDirection):
Promise<PaginatedResponse<XListItem>>` vía `axiosInstance`, con
`page`/`pageSize`/`sortField`/`sortDirection` como query params. `sortField`/
`sortDirection` (tipo `SortDirection` de `types/common.types.ts`) son
**OBLIGATORIOS**: la API los exige (400 si faltan), así que siempre se manda un
orden (el container arranca con un default — ver paso 4). Tipado completo, sin
`any`. Los componentes nunca llaman a esta función directo: pasa siempre por el
hook del paso 3.

```ts
export const getX = (
  page: number,
  pageSize: number,
  sortField: string,
  sortDirection: SortDirection,
): Promise<PaginatedResponse<XListItem>> =>
  axiosInstance
    .get<PaginatedResponse<XListItem>>('/x', {
      params: { page, pageSize, sortField, sortDirection },
    })
    .then((response) => response.data)
```

### 3. `hooks/<grupo>/useGetX.ts`

`useQuery` de TanStack Query: `queryKey: ['x', page, pageSize, sortField,
sortDirection]` (todos en el key para que cada combinación tenga su propia
entrada de cache), `enabled: pageSize !== undefined` (frena el fetch hasta
que `useAutoPageSize` midió de verdad — ver punto 2) y `placeholderData:
keepPreviousData` (para que cambiar de página no "parpadee" a
vacío/skeleton mientras resuelve la próxima).

```ts
export function useGetX(
  page: number,
  pageSize: number | undefined,
  sortField: string,
  sortDirection: SortDirection,
) {
  return useQuery({
    queryKey: ['x', page, pageSize, sortField, sortDirection],
    queryFn: () => getX(page, pageSize as number, sortField, sortDirection),
    enabled: pageSize !== undefined,
    placeholderData: keepPreviousData,
  })
}
```

### 4. `components/pages/XPage/` (3 archivos)

En el **container**:

- `page` como estado propio (`useState(1)`), controlado por el container.
- `sortField`/`sortDirection` como estado propio también, pero **OBLIGATORIOS**:
  arrancan con un orden por defecto que siempre se manda (la API los exige), ej.
  `useState<string>('createdAt')` / `useState<SortDirection>('desc')` (más
  recientes primero). El `sortField` por defecto debe estar en el whitelist de
  campos ordenables del endpoint. Un `handleSortChange(field, direction)` que
  setea ambos y además **resetea `page` a 1**.
- `tableContainerRef` (`useRef<HTMLDivElement>`) + `pageSize =
  useAutoPageSize({ containerRef: tableContainerRef })`.
- Un `useXTableData` "puente" que invoca `useGetX(page, pageSize, sortField,
  sortDirection)` y adapta el resultado al contrato
  `DataTableDataResult<XListItem>` (`data`, `isLoading`, `isError`, `total`) —
  se redefine en cada render para cerrar sobre `page`/`pageSize`/`sortField`/
  `sortDirection` actuales; `DataTable` lo invoca incondicionalmente. Forzá
  `isLoading: pageSize === undefined || isLoading` (del `useQuery`) para que
  se siga viendo el skeleton mientras `useAutoPageSize` todavía no midió.
- `columns: DataTableColumn<XListItem>[]` con `header` resuelto vía
  `t('<grupo>.columns.…')` (la página resuelve i18n, nunca el `DataTable`).
  `sortable: true` SOLO en las columnas cuyo `id` esté en el whitelist de
  campos ordenables del endpoint (ver sección de "Columnas ordenables" más
  arriba); si un campo no es ordenable en el backend (ej. un estado
  efectivo/computado), `sortable: false` explícito.
- Fechas: usá los helpers existentes de `utils/date.utils.ts` (ej.
  `formatDateTime`) en el `render` de la columna, nunca formateo manual.
- Enums del backend (ej. estado): mapealos a labels vía i18n
  (`t('<grupo>.estados.<VALOR>')`), igual que `UserStateBadge` en
  `UsersPage.tsx` para `state`/`provider`.
- Renderizá `<DataTable useData={useXTableData} columns={columns}
  pageSize={pageSize} page={page} onPageChange={setPage} sortField={sortField}
  sortDirection={sortDirection} onSortChange={handleSortChange}
  getRowId={(row) => row.id} />` dentro del `div` referenciado por
  `tableContainerRef`.

En el **presentacional**: solo recibe `title`, `subtitle`,
`tableContainerRef` y `table` (el `DataTable` ya armado, como componente
"smart" pasado por prop) — igual forma que `UsersPage.tsx`.

`index.tsx`: re-exporta el container.

### 5. i18n

`i18n/locales/es/<grupo>.ts` con `title`, `subtitle`, `columns.*` y, si
aplica, los mapeos de enums (ej. `estados.*`, `tipos.*`). Registralo en
`i18n/locales/es/index.ts` (import + agregarlo al objeto `es`).

### 6. Sidebar y router

- **Sidebar** (`components/common/Sidebar/Sidebar.container.tsx`): agregá una
  entrada a `items` (id, `label` vía i18n, `path`, `icon`) siguiendo el
  patrón de `users`.
- **Router** (`router/router.tsx`): agregá la ruta como child de
  `SidebarLayout` (que ya cuelga de `ProtectedRoute`), nunca fuera de ese
  árbol — toda página del sidebar queda protegida automáticamente.

## Verificación obligatoria antes de dar por terminado

1. Build/lint del proyecto en verde (`npm run build` / `npm run lint` en
   `backoffice/`).
2. En el navegador, confirmar los puntos del patrón server-side:
   - La grilla trae **solo** la página pedida (no todo el listado completo).
   - El `pageSize` se adapta al alto disponible del viewport (probar
     achicando/agrandando la ventana).
   - Cambiar de página dispara un fetch nuevo al backend (Network tab: un
     request por cambio de página, con `page`/`pageSize` actualizados).
   - Clickear un header `sortable` dispara un fetch con `sortField`/
     `sortDirection` en la request (Network tab), el orden cambia en TODAS
     las páginas (no solo en la actual), clickear de nuevo la misma columna
     alterna `asc`/`desc`, clickear otra columna resetea a página 1, y el
     indicador (flecha) de la columna activa se ve correctamente.
