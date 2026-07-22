import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import type { LogoProps } from './Logo'

type LogoContainerProps = Omit<LogoProps, 'alt'>

function LogoContainer(props: LogoContainerProps) {
  const { t } = useTranslation()

  return <Logo alt={t('common.siteName')} {...props} />
}

export default LogoContainer
export type { LogoProps, LogoVariant } from './Logo'
