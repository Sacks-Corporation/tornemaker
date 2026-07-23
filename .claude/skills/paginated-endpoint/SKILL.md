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
- Recibe como mínimo los query params `page` y `pageSize` (además de los
  filtros propios del endpoint, si los hay).
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
  `@Min(1)`, default `1`) y `pageSize` (entero, `@Min(1)`, `@Max(100)`,
  default `20` vía `DEFAULT_PAGE_SIZE`). Usa `@Type(() => Number)` de
  `class-transformer` para convertir el string del query string antes de que
  `class-validator` corra (requiere `transform: true` en el `ValidationPipe`
  global de `main.ts`, ya configurado).
- **`paginated-result.interface.ts`** → `PaginatedResult<T>`.
- **`paginate.util.ts`** → `getPaginationSkip(page, pageSize)` y
  `buildPaginatedResult(data, total, page, pageSize)`, el único lugar donde se
  arma el objeto de respuesta.
- **`index.ts`** → barrel, importá desde `'../common/pagination'` (ajustando
  la ruta relativa al módulo).

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
`transform: true`, ya en `main.ts`) validan y transforman `page`/`pageSize`
automáticamente — no uses `ParseIntPipe` a mano para esto, el DTO ya lo
resuelve.

## Patrón en el Service

```ts
async findAllPaginated(
  query: ListXQueryDto,
): Promise<PaginatedResult<XSummaryDto>> {
  const { page, pageSize, ...filters } = query;
  const mongoFilter = this.buildFilter(filters); // filtro propio del dominio

  const [data, total] = await Promise.all([
    this.xModel
      .find(mongoFilter)
      .select('campo1 campo2') // nunca campos sensibles
      .sort({ createdAt: -1 })
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

## Checklist antes de dar por terminado

1. ¿El DTO de query extiende/usa `PaginationQueryDto`?
2. ¿La respuesta es exactamente `{ data, total, page, pageSize }` vía
   `buildPaginatedResult`?
3. ¿`skip`/`limit`/`countDocuments` usan el mismo filtro y corren en paralelo?
4. ¿Ningún campo sensible viaja en `data`?
5. ¿Todo tipado, sin `any`?
6. ¿El proyecto compila (`npm run build` en `api/`)?
