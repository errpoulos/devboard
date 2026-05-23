import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePipeline, useCreateDeal, useUpdateDeal } from '@/features/crm/hooks/useCrm'
import type { Deal, PipelineStage } from '@/types'

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
      { title: title.trim(), pipeline_stage_id: stageId, value: value ? Number(value) : undefined },
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

function DealCard({ deal, isDragging = false }: { deal: Deal; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: `deal-${deal.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-[#0f1011] border rounded p-2.5 transition-colors cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'border-[#5a5f6a] shadow-lg' : 'border-[#23252a] hover:border-[#3a3f4a]'
      }`}
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
  )
}

function StageColumn({
  stage,
  activeId,
}: {
  stage: PipelineStage
  activeId: string | null
}) {
  const [addingDeal, setAddingDeal] = useState(false)
  const deals = stage.deals ?? []
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const dealIds = deals.map((d) => `deal-${d.id}`)

  const { setNodeRef, isOver } = useSortable({
    id: `stage-${stage.id}`,
    data: { type: 'stage', stageId: stage.id },
  })

  return (
    <div className="w-64 shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <span className="text-[13px] font-[510] text-[#f7f8f8]">{stage.name}</span>
          <span className="ml-2 text-[11px] text-[#8a8f98]">{deals.length}</span>
        </div>
        {total > 0 && <span className="text-[11px] text-[#4ade80]">{formatValue(total)}</span>}
      </div>

      <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 space-y-2 min-h-[40px] rounded transition-colors ${
            isOver && activeId ? 'bg-[#1a1c1f]' : ''
          }`}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </SortableContext>

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
  const updateDeal = useUpdateDeal()
  const [activeDealId, setActiveDealId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  if (isLoading) {
    return <div className="text-[13px] text-[#8a8f98]">Loading pipeline…</div>
  }

  if (!stages?.length) {
    return <div className="text-[13px] text-[#8a8f98]">No pipeline stages. Contact your admin.</div>
  }

  const allDeals = stages.flatMap((s) => s.deals ?? [])
  const activeDeal = activeDealId != null ? allDeals.find((d) => d.id === activeDealId) : null

  function findStageForDeal(dealId: number): PipelineStage | undefined {
    return stages!.find((s) => s.deals?.some((d) => d.id === dealId))
  }

  function findStageById(stageId: number): PipelineStage | undefined {
    return stages!.find((s) => s.id === stageId)
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    if (id.startsWith('deal-')) {
      setActiveDealId(Number(id.replace('deal-', '')))
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDealId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    if (!activeId.startsWith('deal-')) return

    const dealId = Number(activeId.replace('deal-', ''))
    const overId = String(over.id)

    let targetStageId: number
    let targetPosition: number

    if (overId.startsWith('stage-')) {
      // Dropped directly on a stage column
      targetStageId = Number(overId.replace('stage-', ''))
      const targetStage = findStageById(targetStageId)
      targetPosition = (targetStage?.deals?.length ?? 0) + 1
    } else if (overId.startsWith('deal-')) {
      // Dropped on another deal — place after it
      const overDealId = Number(overId.replace('deal-', ''))
      const overDeal = allDeals.find((d) => d.id === overDealId)
      if (!overDeal) return
      const overStage = findStageForDeal(overDealId)
      if (!overStage) return
      targetStageId = overStage.id
      targetPosition = overDeal.position
    } else {
      return
    }

    const currentStage = findStageForDeal(dealId)
    if (!currentStage) return

    if (currentStage.id === targetStageId) return

    updateDeal.mutate({ id: dealId, data: { pipeline_stage_id: targetStageId, position: targetPosition } })
  }

  const stageIds = stages.map((s) => `stage-${s.id}`)

  return (
    <div>
      <h1 className="text-[18px] font-[590] text-[#f7f8f8] tracking-[-0.2px] mb-6">Pipeline</h1>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={stageIds} strategy={verticalListSortingStrategy}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <StageColumn key={stage.id} stage={stage} activeId={activeDealId != null ? `deal-${activeDealId}` : null} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
