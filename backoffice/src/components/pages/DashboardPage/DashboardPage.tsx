export interface DashboardPageProps {
  title: string
  subtitle: string
  placeholder: string
}

function DashboardPage({ title, subtitle, placeholder }: DashboardPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-text-muted">{placeholder}</p>
      </section>
    </div>
  )
}

export default DashboardPage
