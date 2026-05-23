import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { useCreateTicket } from '@/features/tickets/hooks/useTickets'

const schema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject too long'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
})

type FormValues = z.infer<typeof schema>

export default function NewTicketPage() {
  const navigate = useNavigate()
  const { mutateAsync: createTicket } = useCreateTicket()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  })

  async function onSubmit(values: FormValues) {
    const res = await createTicket(values)
    navigate(`/tickets/${res.data.id}`)
  }

  return (
    <div className="min-h-screen bg-pitch-black text-porcelain">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-[12px] text-storm-cloud hover:text-porcelain mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to tickets
        </Link>

        <h1 className="text-[20px] font-[590] tracking-[-0.2px] mb-6">New Ticket</h1>

        <div
          className="rounded-md p-6"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[12px] text-storm-cloud tracking-[-0.1px] mb-1.5">
                Subject
              </label>
              <input
                {...register('subject')}
                type="text"
                placeholder="Brief description of the issue"
                className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue placeholder:text-fog-grey"
              />
              {errors.subject && (
                <p className="mt-1 text-[12px] text-warning-red">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] text-storm-cloud tracking-[-0.1px] mb-1.5">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={6}
                placeholder="Describe the issue in detail…"
                className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue placeholder:text-fog-grey resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-[12px] text-warning-red">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] text-storm-cloud tracking-[-0.1px] mb-1.5">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              {errors.priority && (
                <p className="mt-1 text-[12px] text-warning-red">{errors.priority.message}</p>
              )}
            </div>

            <div className="pt-2 flex gap-3 justify-end">
              <Link
                to="/tickets"
                className="rounded px-4 py-2 text-[13px] font-[500] text-storm-cloud hover:text-porcelain border border-[#383b3f] hover:border-[#62666d] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded px-4 py-2 text-[13px] font-[500] bg-aether-blue text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isSubmitting ? 'Creating…' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
