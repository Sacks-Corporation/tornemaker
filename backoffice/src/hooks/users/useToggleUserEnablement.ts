import { useMutation, useQueryClient } from '@tanstack/react-query'
import { disableUser, enableUser } from '../../api/users.api'
import { USERS_QUERY_KEY } from './useGetUsers'
import type { UserEnablementAction, UserListItem } from '../../types/users.types'

export interface ToggleUserEnablementVariables {
  id: string
  action: UserEnablementAction
}

// Mutación (TanStack Query) que togglea `enabled` de un usuario, llamando al
// endpoint que corresponda según `action` ('enable' -> PATCH .../enable,
// 'disable' -> PATCH .../disable). Al resolver con éxito invalida el listado
// completo (todas las combinaciones de page/pageSize/sort en cache) para que
// la grilla se refresque con el estado actualizado.
export function useToggleUserEnablement() {
  const queryClient = useQueryClient()

  return useMutation<UserListItem, unknown, ToggleUserEnablementVariables>({
    mutationFn: ({ id, action }) => (action === 'enable' ? enableUser(id) : disableUser(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
    },
  })
}
