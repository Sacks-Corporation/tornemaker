import { useTranslation } from 'react-i18next'
import TournamentCard from './TournamentCard'
import type { TournamentCardProps } from './TournamentCard'

// El container solo resuelve el label i18n del botón de borrar por defecto;
// el resto de las props se reenvían tal cual.
function TournamentCardContainer(props: Omit<TournamentCardProps, 'deleteLabel'> & { deleteLabel?: string }) {
  const { t } = useTranslation()
  return <TournamentCard deleteLabel={t('tournament.list.card.deleteLabel')} {...props} />
}

export default TournamentCardContainer
export type { TournamentCardProps }
