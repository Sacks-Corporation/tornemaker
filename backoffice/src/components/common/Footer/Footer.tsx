export interface FooterProps {
  copyright: string
}

// Footer minimalista del backoffice: una sola línea de copyright.
function Footer({ copyright }: FooterProps) {
  return (
    <footer className="border-t border-border bg-surface px-4 py-2 text-center">
      <p className="text-xs text-text-muted">{copyright}</p>
    </footer>
  )
}

export default Footer
