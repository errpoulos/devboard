import { useState } from 'react'
import { usePipeline, useCreateDeal } from '@/features/crm/hooks/useCrm'
import type { PipelineStage } from '@/types'

function formatValue(v?: number) {
  if (v == null) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

function AddDealForm({ stageId, onDone }: { stageId: number; onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const createDeal = useCreateDeal()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createDeal.mutate(
      { title: title.trim(), stage_id: stageId, value: value ? Number(value) : undefined },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-1.5">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Deal title"
        className="w-full text-[12px] bg-[#0f1011] border border-[#23252a] rounded px-2 py-1.5 text-[#f7f8f8] placeholder:text-[#4a4f5a] focus:outline-none focus:border-[#5a5f6a]"
      />
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Value (optional)"
        className="w-full text-[12px] bg-[#0f1011] border border-[#23252a] rounded px-2 py-1.5 text-[#f7f8f8] placeholder:text-[#4a4f5a] focus:outline-none focus:border-[#5a5f6a]"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createDeal.isPending}
          className="text-[12px] bg-[#e4f222] text-[#08090a] font-[590] px-3 py-1 rounded disabled:opacity-40"
        >
          Add
        </button>
        <button type="button" onClick={onDone} className="text-[12px] text-[#8a8f98] hover:text-[#f7f8f8] px-2 py-1">
          Cancel
        </button>
      </div>
    </form>
  )
}

function StageColumn({ stage }: { stage: PipelineStage }) {
  const [addingDeal, setAddingDeal] = useState(false)
  const deals = stage.deals ?? []
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0)

  return (
    <div className="w-64 shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <span className="text-[13px] font-[510] text-[#f7f8f8]">{stage.name}</span>
          <span className="ml-2 text-[11px] text-[#8a8f98]">{deals.length}</span>
        </div>
        {total > 0 && <span className="text-[11px] text-[#4ade80]">{formatValue(total)}</span>}
      </div>

      <div className="flex-1 space-y-2">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="bg-[#0f1011] border border-[#23252a] rounded p-2.5 hover:border-[#3a3f4a] transition-colors"
          >
            <p className="text-[13px] text-[#f7f8f8] leading-snug">{deal.title}</p>
            {deal.value != null && (
              <p className="text-[12px] text-[#4ade80] mt-1">{formatValue(deal.value)}</p>
            )}
            {deal.contact && (
              <p className="text-[11px] text-[#8a8f98] mt-1">
                {deal.contact.first_name} {deal.contact.last_name}
              </p>
            )}
          </div>
        ))}
      </div>

      {addingDeal ? (
        <AddDealForm stageId={stage.id} onDone={() => setAddingDeal(false)} />
      ) : (
        <button
          onClick={() => setAddingDeal(true)}
          className="mt-2 text-[12px] text-[#8a8f98] hover:text-[#f7f8f8] text-left px-1 py-1"
        >
          + Add deal
        </button>
      )}
    </div>
  )
}

export default function PipelinePage() {
  const { data: stages, isLoading } = usePipeline()

  if (isLoading) {
    return <div className="text-[13px] text-[#8a8f98]">Loading pipeline…</div>
  }

  if (!stages?.length) {
    return <div className="text-[13px] text-[#8a8f98]">No pipeline stages. Contact your admin.</div>
  }

  return (
    <div>
      <h1 className="text-[18px] font-[590] text-[#f7f8f8] tracking-[-0.2px] mb-6">Pipeline</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <StageColumn key={stage.id} stage={stage} />
        ))}
      </div>
    </div>
  )
}
