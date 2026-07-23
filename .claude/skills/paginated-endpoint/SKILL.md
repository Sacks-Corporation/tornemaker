---
name: paginated-endpoint
description: Usar cuando el usuario pida construir/agregar un endpoint con paginado, paginación, "paginated", o basado en query params "page" y "pageSize" en el proyecto api/ (NestJS + Mongoose). Aplica solo a api/, no a backoffice/ ni web/.
---

# Skill: endpoint paginado (api/)

Esta skill aplica **únicamente al proyecto `api/`** (NestJS + Mongoose). Codifica el
patrón estándar que TODO endpoint paginado de esta API debe seguir, para que la
respuesta sea siempre consistente con lo que el backoffice espera
(`PaginatedResponse<T>` en `backoffice/src/types/common.types.ts`).

No reinventes este patrón por endpoint: reutilizá el código compartido en
`api/src/common/pagination/` (ya existe, no lo recrees) y seguí los pasos de
abajo.

## Antes de implementar

Si tenés cualquier duda sobre la API exacta de `class-validator` /
`class-transformer` / NestJS `ValidationPipe` para query params, confirmá en la
documentación oficial antes de escribir código:

- NestJS validation (query params, `ValidationPipe`, `transform: true`):
  https://docs.nestjs.com/techniques/validation
- class-validator: https://github.com/typestack/class-validator
- class-transformer (`@Type`): https://github.com/typestack/class-transformer

## Contrato del endpoint

- Es un **GET**.
- Recibe los query params `page`/`pageSize` (opcionales, con default) y
  `sortField`/`sortDirection` (**obligatorios** — ver sección dedicada más
  abajo), además de los filtros propios del endpoint, si los hay.
- La respuesta HTTP SIEMPRE tiene esta forma exacta (interfaz
  `PaginatedResult<T>` en `api/src/common/pagination/paginated-result.interface.ts`,
  espejo de `PaginatedResponse<T>` en el frontend):

  ```ts
  {
    data: T[],
    total: number,
    page: number,
    pageSize: number,
  }
  ```

- **Nunca** devolver campos sensibles dentro de `data` (passwords, hashes,
  tokens, etc.) — proyectá/seleccioná solo lo necesario, igual que en el
  resto de los endpoints de este proyecto (ver `.select('+password')` como
  ejemplo de lo contrario: acá es al revés, hay que EXCLUIR sensibles).

## Código compartido reutilizable (`api/src/common/pagination/`)

Ya existe y hay que reutilizarlo, no reimplementarlo:

- **`pagination-query.dto.ts`** → `PaginationQueryDto` con `page` (entero,
  `@Min(1)`, default `1`, opcional), `pageSize` (entero, `@Min(1)`,
  `@Max(100)`, default `20` vía `DEFAULT_PAGE_SIZE`, opcional), y los query
  params de ordenamiento **`sortField`**/**`sortDirection`**, que son
  **OBLIGATORIOS** (ver sección dedicada más abajo). Usa `@Type(() => Number)`
  de `class-transformer` para convertir el string del query string antes de
  que `class-validator` corra (requiere `transform: true` en el
  `ValidationPipe` global de `main.ts`, ya configurado).
- **`paginated-result.interface.ts`** → `PaginatedResult<T>`.
- **`paginate.util.ts`** → `getPaginationSkip(page, pageSize)` y
  `buildPaginatedResult(data, total, page, pageSize)`, el único lugar donde se
  arma el objeto de respuesta.
- **`sort-direction.enum.ts`** → `SortDirection` (`'asc' | 'desc'`).
- **`sort.util.ts`** → `resolveSortStage(...)`, el helper que resuelve
  `sortField`/`sortDirection` contra el whitelist de cada endpoint (ver
  sección dedicada más abajo).
- **`index.ts`** → barrel, importá desde `'../common/pagination'` (ajustando
  la ruta relativa al módulo).

## Ordenamiento server-side (`sortField` / `sortDirection`)

TODO endpoint paginado soporta, además de `page`/`pageSize`, dos query params
**OBLIGATORIOS** para ordenar del lado del servidor — ya vienen en
`PaginationQueryDto`, no hay que declararlos de nuevo:

- **`sortField`** (string, **obligatorio**, `@IsNotEmpty()`): nombre de campo
  API por el cual ordenar (p. ej. `name`, `email`, `teamCount`).
- **`sortDirection`** (`'asc' | 'desc'`, **obligatorio**, enum
  `SortDirection`, `@IsIn(...)` + `@IsNotEmpty()`): dirección de orden.

Una request que omita `sortField` y/o `sortDirection` falla la validación del
`ValidationPipe` global con `400 Bad Request` **antes** de llegar al
controller/service — a diferencia del VALOR de `sortField` (ver más abajo),
cuya ausencia como clave del whitelist nunca es un error, solo su ausencia
como query param lo es.

### Regla de oro: nunca ordenar por el campo crudo del usuario

`sortField` **NUNCA** se pasa directo a Mongo (ni a `.sort()` ni a un
`$sort` de aggregation). Cada endpoint define su PROPIO **whitelist**
(`SortWhitelist`, un `Record<fieldApi, fieldDb | fieldDb[]>`) que mapea el
nombre público a el/los campo(s) real(es) de la DB — el array de campos
sirve para un desempate secundario que se ordena en la MISMA dirección
(p. ej. `name -> ['firstName', 'lastName']`). El `sortField` del caller solo
se usa como CLAVE de lookup en ese whitelist; si no es una clave conocida,
nunca llega a tocar Mongo.

El `sortField` recibido (ya garantizado presente/no vacío por el DTO, ver
arriba) puede seguir sin ser una clave del whitelist (p. ej. un campo
computado como `state` en `GET /users`, o cualquier valor que el endpoint no
soporte); en ese caso el endpoint cae a su **orden por defecto**
(`SortDefault { field, direction }`, típicamente `{ field: 'createdAt',
direction: SortDirection.DESC }`) — un `sortField` no whitelisteado **nunca**
debe devolver 400, es un fallback silencioso y robusto a nivel de
`resolveSortStage`, no un error de validación. Distinto es que el query param
`sortField` esté directamente ausente de la request: eso sí es 400 (ver
arriba), porque el propio DTO lo exige.

### El helper compartido: `resolveSortStage`

```ts
import {
  resolveSortStage,
  SortDefault,
  SortDirection,
  SortWhitelist,
} from '../common/pagination';

const X_SORT_WHITELIST: SortWhitelist = {
  name: 'name', // fieldApi -> fieldDb directo
  ownerName: ['firstName', 'lastName'], // fieldApi -> [fieldDb, tieBreakerDb]
};

const X_SORT_DEFAULT: SortDefault = {
  field: 'createdAt',
  direction: SortDirection.DESC,
};

const { page, pageSize, sortField, sortDirection } = query;
const sortStage = resolveSortStage(
  sortField,
  sortDirection,
  X_SORT_WHITELIST,
  X_SORT_DEFAULT,
);
```

`sortStage` es un objeto `{ [fieldDb]: 1 | -1 }` listo para usar tanto con
`.sort(sortStage)` en un `find()` como con un stage `{ $sort: sortStage }`
en una aggregation — ver los dos patrones abajo.

### Con `find()` (colecciones simples, sin campos computados)

```ts
this.xModel
  .find(mongoFilter)
  .select('campo1 campo2')
  .sort(sortStage) // en vez de un sort hardcodeado
  .skip(getPaginationSkip(page, pageSize))
  .limit(pageSize)
  .exec();
```

### Con aggregation, incluyendo campos COMPUTADOS (`$size`, etc.)

Si el endpoint necesita ordenar por un campo que NO existe en el documento
crudo sino que se computa en un `$project` (p. ej. `teamCount: { $size:
'$teams' }`), el stage `$sort` DEBE ir **DESPUÉS** de ese `$project` (o de un
`$addFields` si preferís no tocar la forma del `$project`) — de lo
contrario el campo todavía no existe cuando `$sort` intenta leerlo. `$skip`/
`$limit` siguen yendo DESPUÉS de `$sort`, igual que antes:

```ts
this.xModel.aggregate([
  { $match: mongoFilter },
  {
    $project: {
      name: 1,
      teamCount: { $size: '$teams' }, // computado ACÁ
    },
  },
  { $sort: sortStage }, // recién ACÁ puede ordenar por teamCount
  { $skip: getPaginationSkip(page, pageSize) },
  { $limit: pageSize },
]);
```

Ver `TournamentsService.findAllPaginatedForBackoffice` para el caso real
(whitelist con `teamCount`/`consoleCount` computados vía `$size`) y
`UsersService.findAllPaginated` para el caso `find()` simple (incluyendo un
whitelist con desempate secundario, `name -> ['firstName', 'lastName']`).

### Cuando el endpoint necesita filtros propios además de paginar

Extendé `PaginationQueryDto`, no la reimplementes:

```ts
export class ListXQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AlgunEnum)
  estado?: AlgunEnum;
}
```

## Patrón en el Controller

```ts
@UseGuards(JwtAuthGuard) // si el recurso requiere auth, como el resto de la API
@Get()
findAll(@Query() query: ListXQueryDto): Promise<PaginatedResult<XSummaryDto>> {
  return this.xService.findAllPaginated(query);
}
```

`@Query()` + el DTO tipado + el `ValidationPipe` global (`whitelist: true`,
`transform: true`, ya en `main.ts`) validan y transforman
`page`/`pageSize`/`sortField`/`sortDirection` automáticamente — no uses
`ParseIntPipe` a mano para esto, el DTO ya lo resuelve.

## Patrón en el Service

```ts
const X_SORT_WHITELIST: SortWhitelist = {
  name: 'name',
  createdAt: 'createdAt',
};
const X_SORT_DEFAULT: SortDefault = {
  field: 'createdAt',
  direction: SortDirection.DESC,
};

async findAllPaginated(
  query: ListXQueryDto,
): Promise<PaginatedResult<XSummaryDto>> {
  const { page, pageSize, sortField, sortDirection, ...filters } = query;
  const mongoFilter = this.buildFilter(filters); // filtro propio del dominio
  const sortStage = resolveSortStage(
    sortField,
    sortDirection,
    X_SORT_WHITELIST,
    X_SORT_DEFAULT,
  );

  const [data, total] = await Promise.all([
    this.xModel
      .find(mongoFilter)
      .select('campo1 campo2') // nunca campos sensibles
      .sort(sortStage)
      .skip(getPaginationSkip(page, pageSize))
      .limit(pageSize)
      .exec(),
    this.xModel.countDocuments(mongoFilter).exec(),
  ]);

  return buildPaginatedResult(data, total, page, pageSize);
}
```

Puntos clave:

- `.skip()` + `.limit()` sobre el MISMO filtro usado para `countDocuments`.
- Las dos consultas (datos + conteo) van en **paralelo** con `Promise.all`,
  nunca una después de la otra.
- El resultado final se arma SIEMPRE con `buildPaginatedResult`, nunca a mano.
- Tipar todo (DTO de entrada, tipo de salida, filtro Mongo); nada de `any`.
- Si el recurso pertenece a un usuario (ownership), el filtro por `ownerId`
  sigue viniendo del JWT (`req.user`), nunca del query param — mismo criterio
  que el resto de los endpoints de `tournaments`.
- El `sortStage` sale SIEMPRE de `resolveSortStage` contra un whitelist
  propio del endpoint — nunca `{ [query.sortField]: ... }` a mano.

## Checklist antes de dar por terminado

1. ¿El DTO de query extiende/usa `PaginationQueryDto`?
2. ¿La respuesta es exactamente `{ data, total, page, pageSize }` vía
   `buildPaginatedResult`?
3. ¿`skip`/`limit`/`countDocuments` usan el mismo filtro y corren en paralelo?
4. ¿Ningún campo sensible viaja en `data`?
5. ¿Todo tipado, sin `any`?
6. ¿El proyecto compila (`npm run build` en `api/`)?
7. ¿El ordenamiento usa `resolveSortStage` con un whitelist propio
   (`fieldApi -> fieldDb`), en vez de pasar `sortField` crudo a Mongo?
8. ¿Una request SIN `sortField`/`sortDirection` devuelve 400 (son
   obligatorios en `PaginationQueryDto`), y un `sortField` presente pero NO
   whitelisteado cae al default del endpoint en vez de devolver 400?
9. Si hay campos computados (`$size`, etc.) en una aggregation, ¿el `$sort`
   está DESPUÉS del `$project`/`$addFields` que los calcula, y `$skip`/
   `$limit` siguen después del `$sort`?
