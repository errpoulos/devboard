import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, User } from 'lucide-react'
import { useContacts } from '@/features/crm/hooks/useCrm'
import { useContactNotes, useCreateContactNote } from '@/features/crm/hooks/useCrm'
import { queryKeys } from '@/api/queryKeys'
import NotesPanel from '@/components/NotesPanel'

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const contactId = Number(id)
  const navigate = useNavigate()

  const { data: contacts, isLoading } = useContacts()
  const { data: notes = [], isLoading: notesLoading } = useContactNotes(contactId)
  const createNote = useCreateContactNote(contactId)

  const contact = contacts?.find((c) => c.id === contactId)

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-[#23252a]" />
        ))}
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="p-6 max-w-3xl">
        <button
          onClick={() => navigate('/contacts')}
          className="flex items-center gap-1.5 text-[12px] text-[#8a8f98] hover:text-[#f7f8f8] mb-4"
        >
          <ArrowLeft size={14} /> Back to Contacts
        </button>
        <p className="text-[13px] text-[#8a8f98]">Contact not found.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <button
        onClick={() => navigate('/contacts')}
        className="flex items-center gap-1.5 text-[12px] text-[#8a8f98] hover:text-[#f7f8f8]"
      >
        <ArrowLeft size={14} /> Back to Contacts
      </button>

      {/* Contact info */}
      <div className="rounded-md p-5 border border-[#23252a]" style={{ background: '#0f1011' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#23252a] flex items-center justify-center shrink-0">
            <User size={16} className="text-[#8a8f98]" />
          </div>
          <div>
            <h1 className="text-[17px] font-[590] text-[#f7f8f8] tracking-[-0.14px]">
              {contact.first_name} {contact.last_name}
            </h1>
            {contact.email && (
              <p className="text-[12px] text-[#8a8f98]">{contact.email}</p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {contact.phone && (
            <>
              <dt className="text-[11px] text-[#6b7280] uppercase tracking-[0.04em]">Phone</dt>
              <dd className="text-[12px] text-[#c4c7cc]">{contact.phone}</dd>
            </>
          )}
          {contact.company && (
            <>
              <dt className="text-[11px] text-[#6b7280] uppercase tracking-[0.04em]">Company</dt>
              <dd className="text-[12px] text-[#c4c7cc]">{contact.company.name}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Sales notes */}
      <div className="rounded-md p-5 border border-[#23252a]" style={{ background: '#0f1011' }}>
        <p className="text-[11px] font-[500] text-[#8a8f98] uppercase tracking-[0.05em] mb-3">
          Sales Notes
        </p>
        {notesLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[#23252a]" />
            ))}
          </div>
        ) : (
          <NotesPanel
            notes={notes}
            invalidateKey={queryKeys.contactNotes(contactId)}
            onAdd={(body) => createNote.mutateAsync(body)}
            isAdding={createNote.isPending}
          />
        )}
      </div>
    </div>
  )
}
