import { useTranslation } from 'react-i18next'
import StepsLayout from '../../../../common/StepsLayout'
import Card from '../../../../common/Card'
import type { TournamentFormat } from '../../../../../types/tournament.types'

export interface FormatOption {
  value: TournamentFormat
  title: string
  description: string
}

export interface FormatStepProps {
  formats: FormatOption[]
  selectedFormat: TournamentFormat | null
  onSelectFormat: (format: TournamentFormat) => void
  currentStep: number
  totalSteps: number
  onNext: () => void
  nextDisabled: boolean
}

function FormatStep({
  formats,
  selectedFormat,
  onSelectFormat,
  currentStep,
  totalSteps,
  onNext,
  nextDisabled,
}: FormatStepProps) {
  const { t } = useTranslation()

  return (
    <StepsLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('tournament.steps.format.title')}
      onNext={onNext}
      nextDisabled={nextDisabled}
    >
      <p className="text-sm text-text-muted">{t('tournament.steps.format.subtitle')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {formats.map((format) => (
          <Card
            key={format.value}
            title={format.title}
            description={format.description}
            selected={format.value === selectedFormat}
            onClick={() => onSelectFormat(format.value)}
          />
        ))}
      </div>
    </StepsLayout>
  )
}

export default FormatStep
