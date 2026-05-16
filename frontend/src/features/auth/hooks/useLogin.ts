import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login } from '../api'
import { useAuthStore } from '@/store/authStore'
import { queryKeys } from '@/api/queryKeys'

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (user) => {
      setUser(user)
      queryClient.setQueryData(queryKeys.me, user)
    },
  })
}
