export interface TabItem<T extends string = string> {
  key: T
  label: string
  disabled?: boolean
  disabledHint?: string
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  activeKey: T
  onChange: (key: T) => void
}

// Barra de tabs simple, usada para alternar entre fases del torneo (ej. fase
// de grupos / eliminación). Un tab puede venir deshabilitado (con hint) hasta
// que el `state` del torneo lo habilite; eso lo decide el container de la
// página, nunca este componente.
function Tabs<T extends string = string>({ tabs, activeKey, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" className="flex w-full flex-wrap gap-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            title={tab.disabled ? tab.disabledHint : undefined}
            onClick={() => onChange(tab.key)}
            className={[
              '-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors duration-150',
              tab.disabled
                ? 'cursor-not-allowed border-transparent text-text-muted opacity-50'
                : isActive
                  ? 'cursor-pointer border-primary text-primary'
                  : 'cursor-pointer border-transparent text-text-muted hover:text-primary',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
