import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import axios from 'axios'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (user) navigate('/tickets', { replace: true })
  }, [user, navigate])

  async function onSubmit(values: FormValues) {
    try {
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true })
      const res = await api.post('/auth/login', values)
      setUser(res.data.data)
      navigate('/tickets')
    } catch {
      setError('root', { message: 'Invalid email or password.' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pitch-black">
      <div className="w-full max-w-sm">
        <h1 className="text-[24px] font-[590] text-porcelain tracking-[-0.22px] leading-[1.33] mb-8 text-center">
          Helpdesk
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
                className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue placeholder:text-fog-grey"
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
                className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue placeholder:text-fog-grey"
              />
              {errors.password && (
                <p className="mt-1 text-[12px] text-warning-red">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <p className="text-[12px] text-warning-red">{errors.root.message}</p>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded px-4 py-2 text-[13px] font-[500] bg-aether-blue text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
