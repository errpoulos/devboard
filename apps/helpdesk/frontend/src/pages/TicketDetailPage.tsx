import { useParams, Link } from 'react-router'
import { ArrowLeft, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useTicket,
  useUpdateTicket,
  useReplies,
  useCreateReply,
} from '@/features/tickets/hooks/useTickets'
import PriorityBadge from '@/features/tickets/components/PriorityBadge'
import TicketStatusBadge from '@/features/tickets/components/TicketStatusBadge'
import type { Ticket } from '@/types'

const replySchema = z.object({
  body: z.string().min(1, 'Reply cannot be empty'),
})
type ReplyForm = z.infer<typeof replySchema>

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_OPTIONS: { value: Ticket['status']; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS: { value: Ticket['priority']; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const ticketId = Number(id)

  const { data: ticketData, isLoading, isError } = useTicket(ticketId)
  const { data: repliesData } = useReplies(ticketId)
  const updateTicket = useUpdateTicket()
  const createReply = useCreateReply(ticketId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReplyForm>({ resolver: zodResolver(replySchema) })

  function handleStatusChange(status: Ticket['status']) {
    updateTicket.mutate({ id: ticketId, data: { status } })
  }

  function handlePriorityChange(priority: Ticket['priority']) {
    updateTicket.mutate({ id: ticketId, data: { priority } })
  }

  async function onReplySubmit(values: ReplyForm) {
    await createReply.mutateAsync(values)
    reset()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pitch-black text-porcelain flex items-center justify-center">
        <span className="text-storm-cloud text-[13px]">Loading…</span>
      </div>
    )
  }

  if (isError || !ticketData) {
    return (
      <div className="min-h-screen bg-pitch-black text-porcelain flex items-center justify-center">
        <span className="text-warning-red text-[13px]">Ticket not found.</span>
      </div>
    )
  }

  const ticket = ticketData.data
  const replies = repliesData?.data ?? []

  return (
    <div className="min-h-screen bg-pitch-black text-porcelain">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-[12px] text-storm-cloud hover:text-porcelain mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to tickets
        </Link>

        <div
          className="rounded-md p-6 mb-4"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          <h1 className="text-[18px] font-[590] tracking-[-0.18px] mb-4">{ticket.subject}</h1>

          <div className="flex flex-wrap items-center gap-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-storm-cloud uppercase tracking-[0.05em]">
                Status
              </span>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as Ticket['status'])}
                disabled={updateTicket.isPending}
                className="rounded px-2 py-0.5 text-[11px] font-[500] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue disabled:opacity-50 cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <TicketStatusBadge status={ticket.status} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-storm-cloud uppercase tracking-[0.05em]">
                Priority
              </span>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as Ticket['priority'])}
                disabled={updateTicket.isPending}
                className="rounded px-2 py-0.5 text-[11px] font-[500] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue disabled:opacity-50 cursor-pointer"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <PriorityBadge priority={ticket.priority} />
            </div>

            {ticket.user && (
              <span className="text-[12px] text-storm-cloud ml-auto">
                Submitted by {ticket.user.name}
              </span>
            )}
          </div>

          <p className="text-[13px] text-[#c4c7cc] leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {replies.length > 0 && (
          <div className="space-y-3 mb-6">
            <h2 className="text-[13px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
              Replies ({replies.length})
            </h2>

            {replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-md p-4"
                style={{ background: '#161718', border: '1px solid #23252a' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-[500] text-porcelain">
                    {reply.user?.name ?? 'Unknown'}
                  </span>
                  <span className="text-[11px] text-storm-cloud">
                    {formatDate(reply.created_at)}
                  </span>
                </div>
                <p className="text-[13px] text-[#c4c7cc] leading-relaxed whitespace-pre-wrap">
                  {reply.body}
                </p>
              </div>
            ))}
          </div>
        )}

        <div
          className="rounded-md p-4"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          <h3 className="text-[12px] font-[500] text-storm-cloud uppercase tracking-[0.05em] mb-3">
            Add a reply
          </h3>

          <form onSubmit={handleSubmit(onReplySubmit)} className="space-y-3">
            <div>
              <textarea
                {...register('body')}
                rows={4}
                placeholder="Write your reply…"
                className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue placeholder:text-fog-grey resize-none"
              />
              {errors.body && (
                <p className="mt-1 text-[12px] text-warning-red">{errors.body.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-[500] bg-aether-blue text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send size={13} />
                {isSubmitting ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
