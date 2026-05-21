import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { useWorkspaces, useBoards } from '@/features/workspace/hooks/useWorkspaces'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import type { Board } from '@/types'

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(31, h) + name.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

// Maps column name → a unique hue over the full 360° wheel.
// Same name always produces the same color; different names produce different hues.
function columnColor(name: string): string {
  const hue = hashName(name) % 360
  return `hsl(${hue}, 65%, 62%)`
}

const tooltipStyle = {
  backgroundColor: '#161718',
  border: '1px solid #23252a',
  borderRadius: '2px',
  color: '#f7f8f8',
  fontSize: 12,
}

function BoardSelect({
  boards,
  value,
  onChange,
}: {
  boards: Board[]
  value: number | null
  onChange: (id: number | null) => void
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="bg-charcoal-grey border border-muted-ash text-[11px] text-storm-cloud px-2 py-1 focus:outline-none focus:text-porcelain"
      style={{ borderRadius: '2px' }}
    >
      <option value="">All boards</option>
      {boards.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  )
}

function TasksByStatusWidget({
  workspaceId,
  boards,
}: {
  workspaceId: number
  boards: Board[]
}) {
  const [boardId, setBoardId] = useState<number | null>(null)
  const { data: metrics, isLoading } = useDashboard(workspaceId, boardId)
  const pieData = metrics?.tasks_by_status.filter((d) => d.count > 0) ?? []

  return (
    <div
      className="bg-deep-slate border border-charcoal-grey p-5"
      style={{ borderRadius: '2px' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="text-[13px] font-[590] text-porcelain tracking-[-0.13px]">
          Tasks by status
        </h2>
        <BoardSelect boards={boards} value={boardId} onChange={setBoardId} />
      </div>
      <p className="text-[12px] text-fog-grey mb-4">
        {boardId ? boards.find((b) => b.id === boardId)?.name : 'All boards'}
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-storm-cloud text-[12px]">
          Loading…
        </div>
      ) : pieData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-storm-cloud text-[12px]">
          No tasks yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="count"
              nameKey="column"
              cx="50%"
              cy="45%"
              outerRadius={90}
              strokeWidth={0}
            >
              {pieData.map((entry) => (
                <Cell key={entry.column} fill={columnColor(entry.column)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={{ color: '#f7f8f8' }}
              formatter={(value, name) => [value as number, name as string]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: '#8a8f98', fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function AvgTimeWidget({
  workspaceId,
  boards,
}: {
  workspaceId: number
  boards: Board[]
}) {
  const [boardId, setBoardId] = useState<number | null>(null)
  const { data: metrics, isLoading } = useDashboard(workspaceId, boardId)
  const barData = metrics?.avg_time_per_status ?? []

  return (
    <div
      className="bg-deep-slate border border-charcoal-grey p-5"
      style={{ borderRadius: '2px' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="text-[13px] font-[590] text-porcelain tracking-[-0.13px]">
          Avg time per status
        </h2>
        <BoardSelect boards={boards} value={boardId} onChange={setBoardId} />
      </div>
      <p className="text-[12px] text-fog-grey mb-4">
        {boardId ? boards.find((b) => b.id === boardId)?.name : 'All boards'} — hours per column
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-storm-cloud text-[12px]">
          Loading…
        </div>
      ) : barData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-storm-cloud text-[12px]">
          No history yet — move tasks between columns to see data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#23252a" vertical={false} />
            <XAxis
              dataKey="column"
              tick={{ fill: '#8a8f98', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8a8f98', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              unit="h"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={{ color: '#f7f8f8' }}
              formatter={(value) => [`${value as number}h`, 'Avg time']}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="avg_hours" radius={[2, 2, 0, 0]} maxBarSize={48}>
              {barData.map((entry) => (
                <Cell key={entry.column} fill={columnColor(entry.column)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: workspaces, isLoading: loadingWorkspaces } = useWorkspaces()
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const { data: boards } = useBoards(workspaceId ?? 0)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-[590] text-porcelain tracking-[-0.2px]">Dashboard</h1>
          <p className="text-[13px] text-storm-cloud mt-0.5">Progress metrics across boards</p>
        </div>

        {loadingWorkspaces ? (
          <div className="w-44 h-8 bg-charcoal-grey rounded animate-pulse" />
        ) : (
          <select
            value={workspaceId ?? ''}
            onChange={(e) => setWorkspaceId(e.target.value ? Number(e.target.value) : null)}
            className="bg-deep-slate border border-charcoal-grey text-[13px] text-porcelain px-3 py-1.5 focus:outline-none focus:border-muted-ash"
            style={{ borderRadius: '2px' }}
          >
            <option value="">Select workspace</option>
            {workspaces?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {!workspaceId ? (
        <div
          className="flex items-center justify-center h-64 border border-charcoal-grey text-storm-cloud text-[13px]"
          style={{ borderRadius: '2px' }}
        >
          Select a workspace to view metrics
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksByStatusWidget workspaceId={workspaceId} boards={boards ?? []} />
          <AvgTimeWidget workspaceId={workspaceId} boards={boards ?? []} />
        </div>
      )}
    </div>
  )
}
