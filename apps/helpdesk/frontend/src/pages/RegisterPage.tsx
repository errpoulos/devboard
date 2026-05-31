import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router'
import axios from 'axios'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orgSlug = searchParams.get('org')
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
      const res = await api.post('/auth/register', {
        ...values,
        ...(orgSlug ? { org_slug: orgSlug } : {}),
      })
      setUser(res.data.data)
      navigate('/tickets')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
      const emailErr = error?.response?.data?.errors?.email?.[0]
      if (emailErr) {
        setError('email', { message: emailErr })
      } else {
        setError('root', { message: error?.response?.data?.message ?? 'Registration failed.' })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pitch-black">
      <div className="w-full max-w-sm">
        <h1 className="text-[24px] font-[590] text-porcelain tracking-[-0.22px] leading-[1.33] mb-2 text-center">
          Helpdesk
        </h1>
        <p className="text-[13px] text-storm-cloud text-center mb-8">Create your account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[12px] text-storm-cloud mb-1.5">Full name</label>
            <input
              {...register('name')}
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              className="w-full rounded px-3 py-2 text-[13px] bg-[#0f1011] text-porcelain border border-[#23252a] focus:outline-none focus:border-[#5e6ad2] placeholder:text-fog-grey"
            />
            {errors.name && (
              <p className="mt-1 text-[12px] text-warning-red">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[12px] text-storm-cloud mb-1.5">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="jane@example.com"
              autoComplete="email"
              className="w-full rounded px-3 py-2 text-[13px] bg-[#0f1011] text-porcelain border border-[#23252a] focus:outline-none focus:border-[#5e6ad2] placeholder:text-fog-grey"
            />
            {errors.email && (
              <p className="mt-1 text-[12px] text-warning-red">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[12px] text-storm-cloud mb-1.5">Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="w-full rounded px-3 py-2 text-[13px] bg-[#0f1011] text-porcelain border border-[#23252a] focus:outline-none focus:border-[#5e6ad2] placeholder:text-fog-grey"
            />
            {errors.password && (
              <p className="mt-1 text-[12px] text-warning-red">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[12px] text-storm-cloud mb-1.5">Confirm password</label>
            <input
              {...register('password_confirmation')}
              type="password"
              placeholder="Repeat password"
              autoComplete="new-password"
              className="w-full rounded px-3 py-2 text-[13px] bg-[#0f1011] text-porcelain border border-[#23252a] focus:outline-none focus:border-[#5e6ad2] placeholder:text-fog-grey"
            />
            {errors.password_confirmation && (
              <p className="mt-1 text-[12px] text-warning-red">{errors.password_confirmation.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-[12px] text-warning-red">{errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded py-2 text-[13px] font-[500] bg-aether-blue text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-storm-cloud">
          Already have an account?{' '}
          <Link to="/login" className="text-aether-blue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
