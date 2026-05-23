import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { login } from '@/features/crm/api'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [isPending, setIsPending] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (user) navigate('/pipeline', { replace: true })
  }, [user, navigate])

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    setLoginError(null)
    try {
      const loggedInUser = await login(values.email, values.password)
      setUser(loggedInUser)
      navigate('/pipeline')
    } catch {
      setLoginError('Invalid email or password.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pitch-black">
      <div className="w-full max-w-sm">
        <h1 className="text-[24px] font-[590] text-porcelain tracking-[-0.22px] leading-[1.33] mb-8 text-center">
          CRM
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
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded bg-deep-slate border border-gunmetal text-porcelain text-[13px] placeholder:text-fog-grey focus:outline-none focus:border-aether-blue"
              />
              {errors.email && (
                <p className="mt-1 text-[12px] text-warning-red">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] text-storm-cloud tracking-[-0.1px] mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded bg-deep-slate border border-gunmetal text-porcelain text-[13px] placeholder:text-fog-grey focus:outline-none focus:border-aether-blue"
              />
              {errors.password && (
                <p className="mt-1 text-[12px] text-warning-red">{errors.password.message}</p>
              )}
            </div>

            {loginError && (
              <p className="text-[12px] text-warning-red">{loginError}</p>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="w-full px-4 py-2 rounded bg-aether-blue text-porcelain text-[13px] font-[500] hover:bg-[#4f5bc2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
