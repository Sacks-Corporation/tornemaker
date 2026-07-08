import { useTranslation } from 'react-i18next'
import FormatStep from './FormatStep'
import type { FormatOption } from './FormatStep'
import type { NewTournamentWizard } from '../../../../../hooks/tournaments/useNewTournamentWizard'
import type { TournamentFormat } from '../../../../../types/tournament.types'

const FORMATS: TournamentFormat[] = [
  'LEAGUE',
  'SINGLE_ELIMINATION',
  'GROUP_STAGE_PLUS_ELIMINATION',
  'SWISS_PLUS_ELIMINATION',
]

export interface FormatStepContainerProps {
  wizard: NewTournamentWizard
  currentStep: number
  totalSteps: number
}

function FormatStepContainer({ wizard, currentStep, totalSteps }: FormatStepContainerProps) {
  const { t } = useTranslation()

  const formats: FormatOption[] = FORMATS.map((value) => ({
    value,
    title: t(`tournament.formats.${value}.title`),
    description: t(`tournament.formats.${value}.description`),
  }))

  return (
    <FormatStep
      formats={formats}
      selectedFormat={wizard.data.format}
      onSelectFormat={wizard.setFormat}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={wizard.goNext}
      nextDisabled={wizard.data.format === null}
    />
  )
}

export default FormatStepContainer
