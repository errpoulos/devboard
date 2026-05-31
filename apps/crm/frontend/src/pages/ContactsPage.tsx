import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2, Plus, X, Users } from 'lucide-react'
import { useContacts, useCreateContact, useDeleteContact, useCompanies } from '@/features/crm/hooks/useCrm'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function ContactsPage() {
  const navigate = useNavigate()
  const { data: contacts, isLoading } = useContacts()
  const { data: companies } = useCompanies()
  const { mutate: createContact, isPending: isCreating } = useCreateContact()
  const { mutate: deleteContact } = useDeleteContact()
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onSubmit(values: FormValues) {
    createContact(
      {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        company_id: values.company_id ? Number(values.company_id) : undefined,
      },
      {
        onSuccess: () => {
          reset()
          setShowForm(false)
        },
      },
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-storm-cloud" />
          <h1 className="text-[18px] font-[590] text-porcelain tracking-[-0.16px]">Contacts</h1>
          {contacts && (
            <span className="text-[12px] text-storm-cloud ml-1">({contacts.length})</span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-aether-blue text-porcelain text-[12px] font-[500] hover:bg-[#4f5bc2] transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add Contact'}
        </button>
      </div>

      {showForm && (
        <div
          className="rounded-md p-4 mb-4 border border-gunmetal"
          style={{ background: '#0f1011' }}
        >
          <h3 className="text-[13px] font-[510] text-porcelain mb-3">New Contact</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-storm-cloud mb-1">First Name *</label>
                <input
                  {...register('first_name')}
                  placeholder="Jane"
                  className="w-full px-2.5 py-1.5 rounded bg-deep-slate border border-gunmetal text-porcelain text-[12px] placeholder:text-fog-grey focus:outline-none focus:border-aether-blue"
                />
                {errors.first_name && (
                  <p className="mt-1 text-[11px] text-warning-red">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-storm-cloud mb-1">Last Name *</label>
                <input
                  {...register('last_name')}
                  placeholder="Doe"
                  className="w-full px-2.5 py-1.5 rounded bg-deep-slate border border-gunmetal text-porcelain text-[12px] placeholder:text-fog-grey focus:outline-none focus:border-aether-blue"
                />
                {errors.last_name && (
                  <p className="mt-1 text-[11px] text-warning-red">{errors.last_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-storm-cloud mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="jane@example.com"
                  className="w-full px-2.5 py-1.5 rounded bg-deep-slate border border-gunmetal text-porcelain text-[12px] placeholder:text-fog-grey focus:outline-none focus:border-aether-blue"
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-warning-red">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-storm-cloud mb-1">Phone</label>
                <input
                  {...register('phone')}
                  placeholder="+1 555 000 0000"
                  className="w-full px-2.5 py-1.5 rounded bg-deep-slate border border-gunmetal text-porcelain text-[12px] placeholder:text-fog-grey focus:outline-none focus:border-aether-blue"
                />
              </div>
              <div>
                <label className="block text-[11px] text-storm-cloud mb-1">Company</label>
                <select
                  {...register('company_id')}
                  className="w-full px-2.5 py-1.5 rounded bg-deep-slate border border-gunmetal text-porcelain text-[12px] focus:outline-none focus:border-aether-blue"
                >
                  <option value="">No company</option>
                  {companies?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { reset(); setShowForm(false) }}
                className="px-3 py-1.5 rounded text-[12px] text-storm-cloud hover:text-porcelain transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-3 py-1.5 rounded bg-aether-blue text-porcelain text-[12px] font-[500] hover:bg-[#4f5bc2] disabled:opacity-50 transition-colors"
              >
                {isCreating ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-md border border-gunmetal overflow-hidden">
          <table className="w-full">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#23252a]">
                  {[3, 4, 2, 3].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className={`h-4 w-${w}/5 animate-pulse rounded bg-[#23252a]`} />
                    </td>
                  ))}
                  <td className="px-4 py-3"><div className="h-4 w-8 animate-pulse rounded bg-[#23252a]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : contacts && contacts.length > 0 ? (
        <div className="rounded-md border border-gunmetal overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gunmetal" style={{ background: '#0f1011' }}>
                <th className="text-left px-4 py-2.5 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.5px]">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.5px]">
                  Email
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.5px]">
                  Phone
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.5px]">
                  Company
                </th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, i) => (
                <tr
                  key={contact.id}
                  className="border-b border-gunmetal last:border-0 hover:bg-deep-slate transition-colors"
                  style={i % 2 === 0 ? { background: '#161718' } : { background: '#0f1011' }}
                >
                  <td className="px-4 py-3 text-[13px] text-porcelain font-[500]">
                    <button
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                      className="hover:underline text-left"
                    >
                      {contact.first_name} {contact.last_name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-storm-cloud">
                    {contact.email ?? <span className="text-fog-grey">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-storm-cloud">
                    {contact.phone ?? <span className="text-fog-grey">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-storm-cloud">
                    {contact.company?.name ?? <span className="text-fog-grey">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="text-fog-grey hover:text-warning-red transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="rounded-md p-8 text-center border border-gunmetal"
          style={{ background: '#0f1011' }}
        >
          <Users className="w-8 h-8 text-fog-grey mx-auto mb-2" />
          <p className="text-[13px] text-storm-cloud">No contacts yet.</p>
          <p className="text-[12px] text-fog-grey mt-1">Add your first contact to get started.</p>
        </div>
      )}
    </div>
  )
}
