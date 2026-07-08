import { useTranslation } from 'react-i18next'
import Footer from './Footer'

function FooterContainer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return <Footer text={t('common.footer.text')} rights={t('common.footer.rights')} year={year} />
}

export default FooterContainer
