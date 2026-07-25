import { useTranslation } from 'react-i18next'
import EnableOrDisableUserModal from './EnableOrDisableUserModal'
import { useToggleUserEnablement } from '../../../../hooks/users/useToggleUserEnablement'
import { getApiErrorMessage } from '../../../../utils/api.errors'
import type { UserListItem } from '../../../../types/users.types'

export interface EnableOrDisableUserModalContainerProps {
  user: UserListItem
  onClose: () => void
}

// Deriva la acción ('enable'/'disable') del `enabled` actual del usuario y
// dispara la mutación correspondiente solo al confirmar. Mientras está en
// curso se deshabilita tanto el botón de confirmar como el cierre del modal,
// para evitar doble click / cierres accidentales a mitad de la request. Al
// resolver con éxito, `useToggleUserEnablement` ya invalidó el listado (la
// grilla se refresca sola), así que acá solo cerramos el modal.
function EnableOrDisableUserModalContainer({ user, onClose }: EnableOrDisableUserModalContainerProps) {
  const { t } = useTranslation()
  const mutation = useToggleUserEnablement()
  const action = user.enabled ? 'disable' : 'enable'

  const handleClose = () => {
    if (mutation.isPending) return
    onClose()
  }

  const handleConfirm = () => {
    mutation.mutate(
      { id: user.id, action },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <EnableOrDisableUserModal
      action={action}
      userName={`${user.firstName} ${user.lastName}`}
      isSubmitting={mutation.isPending}
      errorMessage={
        mutation.isError
          ? getApiErrorMessage(mutation.error, t(`users.enableOrDisableModal.${action}.error`))
          : undefined
      }
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  )
}

export default EnableOrDisableUserModalContainer
