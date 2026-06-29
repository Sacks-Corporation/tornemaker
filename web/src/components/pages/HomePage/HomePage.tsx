import { useTranslation } from 'react-i18next'

interface HomePageProps {
  title: string
  subtitle: string
}

function HomePage({ title, subtitle }: HomePageProps) {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
        {t(title)}
      </h1>
      <p className="mt-4 text-base text-gray-600 sm:text-lg lg:text-xl">
        {t(subtitle)}
      </p>
    </main>
  )
}

export default HomePage
