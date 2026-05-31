import { useRef, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { ArrowLeft, Send, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useAgents,
  useCreateReply,
  useReplies,
  useTicket,
  useUpdateTicket,
} from '@/features/tickets/hooks/useTickets'
import PriorityBadge from '@/features/tickets/components/PriorityBadge'
import TicketStatusBadge from '@/features/tickets/components/TicketStatusBadge'
import AgentSidebar from '@/features/tickets/components/AgentSidebar'
import FileUploadArea from '@/features/tickets/components/FileUploadArea'
import { useAuthStore } from '@/store/authStore'
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
  const user = useAuthStore((s) => s.user)
  const isAgent = user?.role === 'agent'

  const [isPrivateNote, setIsPrivateNote] = useState(false)

  const { data: ticketData, isLoading, isError } = useTicket(ticketId)
  const { data: repliesData } = useReplies(ticketId)
  const { data: agentsData } = useAgents()
  const updateTicket = useUpdateTicket()
  const createReply = useCreateReply(ticketId)
  const repliesBottomRef = useRef<HTMLDivElement>(null)

  const replies = repliesData?.data ?? []
  const agents = agentsData?.data ?? []

  useEffect(() => {
    repliesBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

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

  function handleTypeChange(type: Ticket['type']) {
    updateTicket.mutate({ id: ticketId, data: { type } })
  }

  function handleAssigneeChange(agentId: number | null) {
    updateTicket.mutate({ id: ticketId, data: { assigned_to: agentId } })
  }

  async function onReplySubmit(values: ReplyForm) {
    await createReply.mutateAsync({ body: values.body, is_private: isPrivateNote })
    reset()
    setIsPrivateNote(false)
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

  return (
    <div className="min-h-screen bg-pitch-black text-porcelain">
      <div className={`max-w-6xl mx-auto px-6 py-8 ${isAgent ? 'grid grid-cols-[1fr_320px] gap-8' : ''}`}>
        <div>
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
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-[18px] font-[590] tracking-[-0.18px]">{ticket.subject}</h1>
              {ticket.type && ticket.type !== 'support_request' && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded font-[500] shrink-0"
                  style={{
                    background: ticket.type === 'bug_report' ? '#3d1515' : '#1a2535',
                    color: ticket.type === 'bug_report' ? '#fc8181' : '#63b3ed',
                    border: `1px solid ${ticket.type === 'bug_report' ? '#fc818144' : '#63b3ed44'}`,
                  }}
                >
                  {ticket.type === 'bug_report' ? 'Bug Report' : 'Feature Request'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-storm-cloud uppercase tracking-[0.05em]">
                  Status
                </span>
                {isAgent ? (
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
                ) : (
                  <TicketStatusBadge status={ticket.status} />
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-storm-cloud uppercase tracking-[0.05em]">
                  Priority
                </span>
                {isAgent ? (
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
                ) : (
                  <PriorityBadge priority={ticket.priority} />
                )}
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

          {/* Thread */}
          {replies.length > 0 && (
            <div className="space-y-3 mb-4">
              <h2 className="text-[13px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                Replies ({replies.length})
              </h2>

              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className="rounded-md p-4"
                  style={{
                    background: reply.is_private ? '#1a1814' : '#161718',
                    border: `1px solid ${reply.is_private ? '#3d3020' : '#23252a'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-[500] text-porcelain">
                        {reply.user?.name ?? 'Unknown'}
                      </span>
                      {reply.is_private && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-[500]"
                          style={{ background: '#3d3020', color: '#d4a853' }}
                        >
                          <Lock size={8} />
                          Private
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-storm-cloud">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#c4c7cc] leading-relaxed whitespace-pre-wrap">
                    {reply.body}
                  </p>
                </div>
              ))}
              <div ref={repliesBottomRef} />
            </div>
          )}

          {/* Attachments */}
          <div className="mb-4">
            <FileUploadArea ticketId={ticketId} canDelete={isAgent} />
          </div>

          {/* Reply form */}
          <div
            className="rounded-md p-4"
            style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                {isPrivateNote ? 'Private Note' : 'Add a reply'}
              </h3>
              {isAgent && (
                <button
                  type="button"
                  onClick={() => setIsPrivateNote((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors"
                  style={
                    isPrivateNote
                      ? { background: '#3d3020', color: '#d4a853' }
                      : { background: '#23252a', color: '#6b7280' }
                  }
                >
                  <Lock size={10} />
                  {isPrivateNote ? 'Private' : 'Mark Private'}
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit(onReplySubmit)} className="space-y-3">
              <div>
                <textarea
                  {...register('body')}
                  rows={4}
                  placeholder={isPrivateNote ? 'Write a private note (only visible to agents)…' : 'Write your reply…'}
                  className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border focus:outline-none placeholder:text-fog-grey resize-none transition-colors"
                  style={{
                    borderColor: isPrivateNote ? '#3d3020' : '#383b3f',
                  }}
                />
                {errors.body && (
                  <p className="mt-1 text-[12px] text-warning-red">{errors.body.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-[500] hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={
                    isPrivateNote
                      ? { background: '#d4a853', color: '#1a1400' }
                      : { background: 'var(--color-aether-blue)', color: 'white' }
                  }
                >
                  <Send size={13} />
                  {isSubmitting ? 'Sending…' : isPrivateNote ? 'Add Note' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Agent sidebar */}
        {isAgent && (
          <AgentSidebar
            ticket={ticket}
            agents={agents}
            onAssigneeChange={handleAssigneeChange}
            onTypeChange={handleTypeChange}
          />
        )}
      </div>
    </div>
  )
}
