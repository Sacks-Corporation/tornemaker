import { useTranslation } from 'react-i18next'
import Header from '../../common/Header'
import Footer from '../../common/Footer'
import Button from '../../common/Button'
import Select from '../../common/Select'
import DatePicker from '../../common/DatePicker'
import RadioGroup from '../../common/RadioGroup'
import type { SelectOption, RadioOption } from '../../../types/common.types'

interface HomePageProps {
  title: string
  subtitle: string
  formatOptions: SelectOption[]
  formatValue: string | null
  onFormatChange: (value: string) => void
  date: Date | null
  onDateChange: (date: Date) => void
  visibilityOptions: RadioOption[]
  visibilityValue: string | null
  onVisibilityChange: (value: string) => void
}

function HomePage({
  title,
  subtitle,
  formatOptions,
  formatValue,
  onFormatChange,
  date,
  onDateChange,
  visibilityOptions,
  visibilityValue,
  onVisibilityChange,
}: HomePageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-text sm:text-4xl lg:text-5xl">{t(title)}</h1>
          <p className="mt-4 max-w-2xl text-base text-text-muted sm:text-lg lg:text-xl">
            {t(subtitle)}
          </p>
        </section>

        <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl font-semibold text-text sm:text-2xl">
            {t('common.demo.title')}
          </h2>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t('common.demo.buttonsTitle')}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">
                Primary sm
              </Button>
              <Button variant="primary" size="md">
                Primary md
              </Button>
              <Button variant="primary" size="lg">
                Primary lg
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="text">Text</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                {t('common.demo.selectTitle')}
              </h3>
              <Select
                label={t('common.demo.selectTitle')}
                options={formatOptions}
                value={formatValue}
                onChange={onFormatChange}
                placeholder={t('common.select.placeholder')}
              />
              {formatValue && (
                <p className="mt-2 text-xs text-text-muted">
                  {t('common.demo.selectedLabel')}: {formatValue}
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                {t('common.demo.datePickerTitle')}
              </h3>
              <DatePicker
                label={t('common.demo.datePickerTitle')}
                value={date}
                onChange={onDateChange}
              />
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                {t('common.demo.radioTitle')}
              </h3>
              <RadioGroup
                name="visibility"
                options={visibilityOptions}
                value={visibilityValue}
                onChange={onVisibilityChange}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default HomePage
