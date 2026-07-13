export interface FooterProps {
  text: string
  rights: string
  year: number
}

function Footer({ text, rights, year }: FooterProps) {
  return (
    <footer className="w-full bg-footer">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-6 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-on-header sm:text-base">{text}</p>
        <p className="text-xs text-on-header/80">
          © {year} · {rights}
        </p>
      </div>
    </footer>
  )
}

export default Footer
