import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2, Plus, X, Building2 } from 'lucide-react'
import { useCompanies, useCreateCompany, useDeleteCompany } from '@/features/crm/hooks/useCrm'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function CompaniesPage() {
  const { data: companies, isLoading } = useCompanies()
  const { mutate: createCompany, isPending: isCreating } = useCreateCompany()
  const { mutate: deleteCompany } = useDeleteCompany()
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onSubmit(values: FormValues) {
    createCompany(
      { name: values.name, domain: values.domain || undefined, industry: values.industry || undefined },
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
          <Building2 className="w-5 h-5 text-storm-cloud" />
          <h1 className="text-[18px] font-[590] text-porcelain tracking-[-0.16px]">Companies</h1>
          {companies && (
            <span className="text-[12px] text-storm-cloud ml-1">({companies.length})</span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-aether-blue text-porcelain text-[12px] font-[500] hover:bg-[#4f5bc2] transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add Company'}
        </button>
      </div>

      {showForm && (
        <div
          className="rounded-md p-4 mb-4 border border-gunmetal"
          style={{ background: '#0f1011' }}
        >
          <h3 className="text-[13px] font-[510] text-porcelain mb-3">New Company</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-storm-cloud mb-1">Name *</label>
                <input
                  {...register('name')}
                  placeholder="Acme Corp"
                  className="w-full px-2.5 py-1.5 rounded bg-deep-slate border border-gunmetal text-porcelain text-[12px] placeholder:text-fog-grey focus:outline-none focus:border-aether-blue"
                />
                {errors.name && (
                  <p className="mt-1 text-[11px] text-warning-red">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-storm-cloud mb-1">Domain</label>
                <input
                  {...register('domain')}
                  placeholder="acme.com"
                  className="w-full px-2.5 py-1.5 rounded bg-deep-slate border border-gunmetal text-porcelain text-[12px] placeholder:text-fog-grey focus:outline-none focus:border-aether-blue"
                />
              </div>
              <div>
                <label className="block text-[11px] text-storm-cloud mb-1">Industry</label>
                <input
                  {...register('industry')}
                  placeholder="Technology"
                  className="w-full px-2.5 py-1.5 rounded bg-deep-slate border border-gunmetal text-porcelain text-[12px] placeholder:text-fog-grey focus:outline-none focus:border-aether-blue"
                />
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
                {isCreating ? 'Saving...' : 'Save Company'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-[13px] text-storm-cloud">Loading companies...</div>
      ) : companies && companies.length > 0 ? (
        <div className="rounded-md border border-gunmetal overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gunmetal" style={{ background: '#0f1011' }}>
                <th className="text-left px-4 py-2.5 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.5px]">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.5px]">
                  Domain
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.5px]">
                  Industry
                </th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, i) => (
                <tr
                  key={company.id}
                  className="border-b border-gunmetal last:border-0 hover:bg-deep-slate transition-colors"
                  style={i % 2 === 0 ? { background: '#161718' } : { background: '#0f1011' }}
                >
                  <td className="px-4 py-3 text-[13px] text-porcelain font-[500]">{company.name}</td>
                  <td className="px-4 py-3 text-[13px] text-storm-cloud">
                    {company.domain ?? <span className="text-fog-grey">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-storm-cloud">
                    {company.industry ?? <span className="text-fog-grey">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteCompany(company.id)}
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
          <Building2 className="w-8 h-8 text-fog-grey mx-auto mb-2" />
          <p className="text-[13px] text-storm-cloud">No companies yet.</p>
          <p className="text-[12px] text-fog-grey mt-1">Add your first company to get started.</p>
        </div>
      )}
    </div>
  )
}
