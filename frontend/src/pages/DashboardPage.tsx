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
import { useWorkspaces } from '@/features/workspace/hooks/useWorkspaces'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'

const FALLBACK_COLORS = [
  '#5e6ad2',
  '#02b8cc',
  '#27a644',
  '#e4f222',
  '#8b5cf6',
  '#eb5757',
  '#f59e0b',
  '#ec4899',
]

function columnColor(color: string | null, index: number): string {
  return color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

const tooltipStyle = {
  backgroundColor: '#161718',
  border: '1px solid #23252a',
  borderRadius: '2px',
  color: '#f7f8f8',
  fontSize: 12,
}

export default function DashboardPage() {
  const { data: workspaces, isLoading: loadingWorkspaces } = useWorkspaces()
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const { data: metrics, isLoading: loadingMetrics } = useDashboard(workspaceId)

  const selectedWorkspace = workspaces?.find((w) => w.id === workspaceId)

  const pieData = metrics?.tasks_by_status.filter((d) => d.count > 0) ?? []
  const barData = metrics?.avg_time_per_status ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-[590] text-porcelain tracking-[-0.2px]">Dashboard</h1>
          <p className="text-[13px] text-storm-cloud mt-0.5">
            Progress metrics across all boards
          </p>
        </div>

        {/* Workspace picker */}
        <div>
          {loadingWorkspaces ? (
            <div className="w-44 h-8 bg-charcoal-grey rounded animate-pulse" />
          ) : (
            <select
              value={workspaceId ?? ''}
              onChange={(e) => setWorkspaceId(e.target.value ? Number(e.target.value) : null)}
              className="bg-deep-slate border border-charcoal-grey text-[13px] text-porcelain rounded px-3 py-1.5 focus:outline-none focus:border-muted-ash"
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
      </div>

      {/* Empty state */}
      {!workspaceId && (
        <div className="flex items-center justify-center h-64 border border-charcoal-grey rounded text-storm-cloud text-[13px]"
          style={{ borderRadius: '2px' }}>
          Select a workspace to view metrics
        </div>
      )}

      {/* Loading */}
      {workspaceId && loadingMetrics && (
        <div className="flex items-center justify-center h-64">
          <div className="text-storm-cloud text-[13px]">Loading metrics...</div>
        </div>
      )}

      {/* Charts */}
      {workspaceId && metrics && !loadingMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by status */}
          <div className="bg-deep-slate border border-charcoal-grey p-5" style={{ borderRadius: '2px' }}>
            <h2 className="text-[13px] font-[590] text-porcelain tracking-[-0.13px] mb-1">
              Tasks by status
            </h2>
            <p className="text-[12px] text-fog-grey mb-4">
              {selectedWorkspace?.name} — all boards
            </p>

            {pieData.length === 0 ? (
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
                    {pieData.map((entry, i) => (
                      <Cell key={entry.column} fill={columnColor(entry.color, i)} />
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

          {/* Avg time per status */}
          <div className="bg-deep-slate border border-charcoal-grey p-5" style={{ borderRadius: '2px' }}>
            <h2 className="text-[13px] font-[590] text-porcelain tracking-[-0.13px] mb-1">
              Avg time per status
            </h2>
            <p className="text-[12px] text-fog-grey mb-4">Hours tasks spend in each column</p>

            {barData.length === 0 ? (
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
                    {barData.map((entry, i) => (
                      <Cell key={entry.column} fill={columnColor(entry.color, i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
