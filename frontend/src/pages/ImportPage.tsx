import { useRef, useState } from 'react'
import { useWorkspaces, useBoards } from '@/features/workspace/hooks/useWorkspaces'
import { useImportBoards, useImportTasks } from '@/features/csv/useCsvImport'
import type { ImportResult } from '@/features/csv/api'
import { cn } from '@/lib/utils'

const BOARDS_COLUMNS = [
  { col: 'name', req: true, desc: 'Board name' },
  { col: 'description', req: false, desc: 'Optional board description' },
]

const TASKS_COLUMNS = [
  { col: 'title', req: true, desc: 'Task title' },
  { col: 'description', req: false, desc: 'Task description' },
  { col: 'priority', req: false, desc: 'low · medium · high · urgent' },
  { col: 'story_points', req: false, desc: 'Integer' },
  { col: 'due_date', req: false, desc: 'YYYY-MM-DD' },
  { col: 'status', req: false, desc: 'Column name (e.g. "In Progress")' },
]

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function DropZone({
  file,
  onChange,
}: {
  file: File | null
  onChange: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(f: File) {
    if (!f.name.endsWith('.csv') && f.type !== 'text/csv') {
      alert('Please select a .csv file')
      return
    }
    onChange(f)
  }

  return (
    <div
      className={cn(
        'rounded-md border-2 border-dashed p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors',
        dragOver ? 'border-neon-lime bg-neon-lime/5' : 'border-charcoal-grey hover:border-muted-ash',
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
    >
      <svg className="w-7 h-7 text-fog-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {file ? (
        <p className="text-[13px] text-porcelain font-[510] tracking-[-0.13px]">{file.name}</p>
      ) : (
        <p className="text-[13px] text-storm-cloud tracking-[-0.13px]">Drop CSV here or click to browse</p>
      )}
      <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

function ResultBanner({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex-1 rounded-md p-3 text-center" style={{ background: '#0f1011' }}>
          <p className="text-[20px] font-[590] text-emerald tracking-[-0.22px]">{result.created}</p>
          <p className="text-[11px] text-fog-grey tracking-[-0.1px]">Created</p>
        </div>
        <div className="flex-1 rounded-md p-3 text-center" style={{ background: '#0f1011' }}>
          <p className={cn('text-[20px] font-[590] tracking-[-0.22px]', result.failed > 0 ? 'text-warning-red' : 'text-fog-grey')}>
            {result.failed}
          </p>
          <p className="text-[11px] text-fog-grey tracking-[-0.1px]">Failed</p>
        </div>
      </div>
      {result.errors.length > 0 && (
        <div className="rounded-md overflow-hidden max-h-40 overflow-y-auto" style={{ background: '#0f1011' }}>
          {result.errors.map((err, i) => (
            <div key={i} className="flex gap-3 px-3 py-1.5 border-b border-charcoal-grey/50 last:border-0">
              <span className="text-[11px] text-fog-grey shrink-0 font-mono">{err.row === 0 ? 'header' : `row ${err.row}`}</span>
              <span className="text-[12px] text-warning-red tracking-[-0.1px]">{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ColumnRef({ rows }: { rows: { col: string; req: boolean; desc: string }[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        className="flex items-center gap-1.5 text-[12px] text-fog-grey hover:text-storm-cloud transition-colors tracking-[-0.1px]"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className={cn('w-3 h-3 transition-transform', open && 'rotate-90')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Expected columns
      </button>
      {open && (
        <div className="mt-2 rounded-md overflow-hidden" style={{ background: '#0f1011' }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-charcoal-grey">
                <th className="text-left px-3 py-2 text-fog-grey font-[510]">Column</th>
                <th className="text-left px-3 py-2 text-fog-grey font-[510]">Required</th>
                <th className="text-left px-3 py-2 text-fog-grey font-[510]">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.col} className="border-b border-charcoal-grey/50 last:border-0">
                  <td className="px-3 py-1.5 font-mono text-[11px] text-porcelain">{r.col}</td>
                  <td className="px-3 py-1.5">{r.req ? <span className="text-neon-lime">Yes</span> : <span className="text-fog-grey">No</span>}</td>
                  <td className="px-3 py-1.5 text-storm-cloud">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Import Boards Panel ──────────────────────────────────────────────────────

function ImportBoardsPanel() {
  const { data: workspaces } = useWorkspaces()
  const [workspaceId, setWorkspaceId] = useState<number>(0)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const importBoards = useImportBoards(workspaceId)

  const selectClass = 'w-full text-[13px] text-porcelain bg-transparent border border-charcoal-grey rounded-md px-3 py-2 focus:outline-none focus:border-muted-ash tracking-[-0.13px]'

  function handleImport() {
    if (!file || !workspaceId) return
    setResult(null)
    importBoards.mutate(file, { onSuccess: (r) => setResult(r) })
  }

  return (
    <div className="rounded-md border border-charcoal-grey" style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}>
      <div className="px-5 py-4 border-b border-charcoal-grey">
        <h2 className="text-[15px] font-[510] text-porcelain tracking-[-0.13px]">Import Boards</h2>
        <p className="text-[12px] text-fog-grey mt-0.5 tracking-[-0.1px]">
          Create multiple boards in a workspace from a CSV file.
        </p>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="block text-[11px] text-fog-grey tracking-[-0.1px] uppercase mb-1.5">Workspace</label>
          <select
            className={selectClass}
            style={{ background: '#0f1011' }}
            value={workspaceId}
            onChange={(e) => setWorkspaceId(Number(e.target.value))}
          >
            <option value={0} style={{ background: '#0f1011' }}>Select a workspace…</option>
            {workspaces?.map((w) => (
              <option key={w.id} value={w.id} style={{ background: '#0f1011' }}>{w.name}</option>
            ))}
          </select>
        </div>

        <DropZone file={file} onChange={(f) => { setFile(f); setResult(null) }} />
        <ColumnRef rows={BOARDS_COLUMNS} />

        {result && <ResultBanner result={result} />}
      </div>
      <div className="px-5 py-3 border-t border-charcoal-grey flex items-center justify-between">
        <button
          className="text-[12px] text-fog-grey hover:text-storm-cloud transition-colors tracking-[-0.1px]"
          onClick={() => downloadCsv('boards-template.csv', 'name,description\nMy Board,A board for the team\nSprint 1,\n')}
        >
          Download template
        </button>
        <button
          className="text-[13px] font-[590] bg-neon-lime text-pitch-black rounded-md px-4 py-1.5 disabled:opacity-40 tracking-[-0.13px] hover:bg-[#cdd91f] transition-colors"
          onClick={handleImport}
          disabled={!file || !workspaceId || importBoards.isPending}
        >
          {importBoards.isPending ? 'Importing…' : 'Import'}
        </button>
      </div>
    </div>
  )
}

// ─── Import Tasks Panel ───────────────────────────────────────────────────────

function ImportTasksPanel() {
  const { data: workspaces } = useWorkspaces()
  const [workspaceId, setWorkspaceId] = useState<number>(0)
  const [boardId, setBoardId] = useState<number>(0)
  const { data: boards } = useBoards(workspaceId)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const importTasks = useImportTasks(workspaceId, boardId)

  const selectClass = 'w-full text-[13px] text-porcelain bg-transparent border border-charcoal-grey rounded-md px-3 py-2 focus:outline-none focus:border-muted-ash tracking-[-0.13px]'

  function handleImport() {
    if (!file || !workspaceId || !boardId) return
    setResult(null)
    importTasks.mutate(file, { onSuccess: (r) => setResult(r) })
  }

  return (
    <div className="rounded-md border border-charcoal-grey" style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}>
      <div className="px-5 py-4 border-b border-charcoal-grey">
        <h2 className="text-[15px] font-[510] text-porcelain tracking-[-0.13px]">Import Tasks</h2>
        <p className="text-[12px] text-fog-grey mt-0.5 tracking-[-0.1px]">
          Bulk-create tasks in a specific board from a CSV file.
        </p>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-fog-grey tracking-[-0.1px] uppercase mb-1.5">Workspace</label>
            <select
              className={selectClass}
              style={{ background: '#0f1011' }}
              value={workspaceId}
              onChange={(e) => { setWorkspaceId(Number(e.target.value)); setBoardId(0) }}
            >
              <option value={0} style={{ background: '#0f1011' }}>Select workspace…</option>
              {workspaces?.map((w) => (
                <option key={w.id} value={w.id} style={{ background: '#0f1011' }}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-fog-grey tracking-[-0.1px] uppercase mb-1.5">Board</label>
            <select
              className={selectClass}
              style={{ background: '#0f1011' }}
              value={boardId}
              onChange={(e) => setBoardId(Number(e.target.value))}
              disabled={!workspaceId || !boards?.length}
            >
              <option value={0} style={{ background: '#0f1011' }}>Select board…</option>
              {boards?.map((b) => (
                <option key={b.id} value={b.id} style={{ background: '#0f1011' }}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <DropZone file={file} onChange={(f) => { setFile(f); setResult(null) }} />
        <ColumnRef rows={TASKS_COLUMNS} />

        {result && <ResultBanner result={result} />}
      </div>
      <div className="px-5 py-3 border-t border-charcoal-grey flex items-center justify-between">
        <button
          className="text-[12px] text-fog-grey hover:text-storm-cloud transition-colors tracking-[-0.1px]"
          onClick={() => downloadCsv('tasks-template.csv', 'title,description,priority,story_points,due_date,status\nFix login bug,The login page redirects incorrectly,high,3,2026-06-01,In Progress\nDesign new feature,,,medium,,,\n')}
        >
          Download template
        </button>
        <button
          className="text-[13px] font-[590] bg-neon-lime text-pitch-black rounded-md px-4 py-1.5 disabled:opacity-40 tracking-[-0.13px] hover:bg-[#cdd91f] transition-colors"
          onClick={handleImport}
          disabled={!file || !workspaceId || !boardId || importTasks.isPending}
        >
          {importTasks.isPending ? 'Importing…' : 'Import'}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-[24px] font-[590] text-porcelain tracking-[-0.22px] leading-[1.33]">
        Import
      </h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ImportBoardsPanel />
        <ImportTasksPanel />
      </div>
    </div>
  )
}
