import { useTranslation } from 'react-i18next'
import StepsLayout from './StepsLayout'
import type { StepsLayoutProps } from './StepsLayout'

type StepsLayoutContainerProps = Omit<
  StepsLayoutProps,
  'stepIndicatorLabel' | 'backLabel' | 'nextLabel'
> & {
  backLabel?: string
  nextLabel?: string
}

// Resuelve los labels por defecto (indicador de paso, Atrás/Siguiente) vía
// i18n; el resto de las props se reenvía tal cual.
function StepsLayoutContainer({ backLabel, nextLabel, ...rest }: StepsLayoutContainerProps) {
  const { t } = useTranslation()

  return (
    <StepsLayout
      stepIndicatorLabel={t('tournament.wizard.stepIndicator', {
        current: rest.currentStep,
        total: rest.totalSteps,
      })}
      backLabel={backLabel ?? t('tournament.wizard.back')}
      nextLabel={nextLabel ?? t('tournament.wizard.next')}
      {...rest}
    />
  )
}

export default StepsLayoutContainer
export type { StepsLayoutProps }
