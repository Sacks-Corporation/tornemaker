# Tornemaker — Backoffice

Panel de administración y analíticos de Tornemaker (React + Vite + TypeScript).

## Stack

- React 19 + TypeScript, build con Vite (dev server en `:5174`).
- Tailwind CSS v4 (tokens semánticos en `src/index.css`, dark mode por clase `.dark`).
- `react-router-dom` v7 (layout con sidebar vertical).
- TanStack Query para data fetching.
- `@tanstack/react-table` (headless) vía el componente común `DataTable`.
- `recharts` para gráficos (colores del tema en `src/utils/chart.utils.ts`).
- i18n con `react-i18next` (español).

## Comandos

```bash
npm install     # instalar dependencias
npm run dev     # dev server en http://localhost:5174
npm run build   # typecheck + build de producción
npm run lint    # oxlint
```

## Arquitectura

Misma filosofía que `web/`: capas `api/ → hooks/ → components/` con patrón
container/presentacional. Las convenciones completas viven en
`../.claude/agents/backoffice-developer.md`.
