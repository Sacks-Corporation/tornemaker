import { useTranslation } from 'react-i18next'
import Footer from './Footer'
import type { FooterProps } from './Footer'

function FooterContainer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return <Footer copyright={t('common.footer.copyright', { year })} />
}

export default FooterContainer
export type { FooterProps }
