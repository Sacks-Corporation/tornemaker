import { useTranslation } from 'react-i18next'
import Snackbar from './Snackbar'
import type { SnackbarProps } from './Snackbar'

// El container solo resuelve el label i18n del botón de cerrar por defecto;
// el resto de las props se reenvían tal cual.
function SnackbarContainer(props: Omit<SnackbarProps, 'closeLabel'> & { closeLabel?: string }) {
  const { t } = useTranslation()
  return <Snackbar closeLabel={t('common.snackbar.close')} {...props} />
}

export default SnackbarContainer
export type { SnackbarProps }
