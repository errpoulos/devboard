import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { mutate: login, isPending, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (user) navigate('/workspaces', { replace: true })
  }, [user, navigate])

  function onSubmit(values: FormValues) {
    login(values, { onSuccess: () => navigate('/workspaces') })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pitch-black">
      <div className="w-full max-w-sm">
        <h1 className="text-[24px] font-[590] text-porcelain tracking-[-0.22px] leading-[1.33] mb-8 text-center">
          DevBoard
        </h1>

        <div
          className="rounded-md p-6 space-y-4"
          style={{
            background: '#0f1011',
            boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 4px 0px',
          }}
        >
          <h2 className="text-[15px] font-[510] text-porcelain tracking-[-0.13px] mb-5">
            Sign in
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="block text-[12px] text-storm-cloud tracking-[-0.1px] mb-1.5">
                Email
              </label>
              <Input {...register('email')} type="email" placeholder="you@example.com" />
              {errors.email && (
                <p className="mt-1 text-[12px] text-warning-red">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] text-storm-cloud tracking-[-0.1px] mb-1.5">
                Password
              </label>
              <Input {...register('password')} type="password" placeholder="••••••••" />
              {errors.password && (
                <p className="mt-1 text-[12px] text-warning-red">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-[12px] text-warning-red">Invalid email or password.</p>
            )}

            <div className="pt-1">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
