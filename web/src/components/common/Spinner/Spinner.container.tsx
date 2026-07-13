import { useTranslation } from 'react-i18next'
import Spinner from './Spinner'
import type { SpinnerProps } from './Spinner'

// El container solo resuelve el label i18n por defecto (usado por lectores de
// pantalla); el resto de las props se reenvían tal cual. Los consumidores que
// necesiten un texto más específico ("Cargando modalidades…") lo pasan por
// `label` y pisan el default.
function SpinnerContainer(props: Omit<SpinnerProps, 'label'> & { label?: string }) {
  const { t } = useTranslation()
  return <Spinner label={t('common.loading.label')} {...props} />
}

export default SpinnerContainer
export type { SpinnerProps }
