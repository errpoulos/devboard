import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { ImportResult } from './api'

interface BoardsConfig {
  mode: 'boards'
  workspaceId: number
  onImport: (file: File) => void
  isPending: boolean
  result: ImportResult | null
}

interface TasksConfig {
  mode: 'tasks'
  workspaceId: number
  boardId: number
  columnNames: string[]
  onImport: (file: File) => void
  isPending: boolean
  result: ImportResult | null
}

type Props = (BoardsConfig | TasksConfig) & { onClose: () => void }

const BOARDS_TEMPLATE = `name,description\nMy Board,A board for the team\nSprint 1,First sprint\n`

function buildTasksTemplate(columnNames: string[]): string {
  const status = columnNames[0] ?? 'To Do'
  return `title,description,priority,story_points,due_date,status\nFix login bug,The login page redirects incorrectly,high,3,2026-06-01,${status}\nDesign new feature,,,medium,,,\n`
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ImportCsvModal(props: Props) {
  const { onClose } = props
  const backdropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showFormat, setShowFormat] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please select a .csv file')
      return
    }
    setSelectedFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleUpload() {
    if (!selectedFile) return
    props.onImport(selectedFile)
  }

  function handleDownloadTemplate() {
    if (props.mode === 'boards') {
      downloadCsv('boards-template.csv', BOARDS_TEMPLATE)
    } else {
      downloadCsv('tasks-template.csv', buildTasksTemplate(props.columnNames))
    }
  }

  const title = props.mode === 'boards' ? 'Import Boards' : 'Import Tasks'
  const result = props.result
  const isDone = !!result

  const formatRows =
    props.mode === 'boards'
      ? [
          { col: 'name', req: true, desc: 'Board name' },
          { col: 'description', req: false, desc: 'Optional board description' },
        ]
      : [
          { col: 'title', req: true, desc: 'Task title' },
          { col: 'description', req: false, desc: 'Task description' },
          { col: 'priority', req: false, desc: 'low · medium · high · urgent (default: medium)' },
          { col: 'story_points', req: false, desc: 'Integer' },
          { col: 'due_date', req: false, desc: 'YYYY-MM-DD' },
          { col: 'status', req: false, desc: 'Column name (e.g. "In Progress")' },
        ]

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-black/70 p-4"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div
        className="w-full max-w-md flex flex-col rounded-md"
        style={{
          background: '#161718',
          boxShadow: 'rgba(8, 9, 10, 0.6) 0px 4px 32px 0px, rgb(35, 37, 42) 0px 0px 0px 1px inset',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-grey">
          <h2 className="text-[15px] font-[510] text-porcelain tracking-[-0.13px]">{title}</h2>
          <button
            className="text-fog-grey hover:text-storm-cloud text-lg leading-none transition-colors"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {!isDone ? (
            <>
              {/* Drop zone */}
              <div
                className={cn(
                  'rounded-md border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors',
                  dragOver
                    ? 'border-neon-lime bg-neon-lime/5'
                    : 'border-charcoal-grey hover:border-muted-ash',
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <svg className="w-8 h-8 text-fog-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-[13px] text-porcelain font-[510] tracking-[-0.13px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-fog-grey mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-[13px] text-storm-cloud tracking-[-0.13px]">
                      Drop a CSV file here or click to browse
                    </p>
                    <p className="text-[11px] text-fog-grey mt-0.5">Max 2 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>

              {/* Column format reference */}
              <div>
                <button
                  className="flex items-center gap-1.5 text-[12px] text-fog-grey hover:text-storm-cloud transition-colors tracking-[-0.1px]"
                  onClick={() => setShowFormat((v) => !v)}
                >
                  <svg className={cn('w-3 h-3 transition-transform', showFormat && 'rotate-90')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Expected columns
                </button>

                {showFormat && (
                  <div className="mt-2 rounded-md overflow-hidden" style={{ background: '#0f1011' }}>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-charcoal-grey">
                          <th className="text-left px-3 py-2 text-fog-grey font-[510] tracking-[-0.1px]">Column</th>
                          <th className="text-left px-3 py-2 text-fog-grey font-[510] tracking-[-0.1px]">Required</th>
                          <th className="text-left px-3 py-2 text-fog-grey font-[510] tracking-[-0.1px]">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formatRows.map((r) => (
                          <tr key={r.col} className="border-b border-charcoal-grey/50 last:border-0">
                            <td className="px-3 py-1.5 font-mono text-[11px] text-porcelain">{r.col}</td>
                            <td className="px-3 py-1.5">
                              {r.req ? (
                                <span className="text-neon-lime">Yes</span>
                              ) : (
                                <span className="text-fog-grey">No</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-storm-cloud">{r.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Results */
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-1 rounded-md p-3 text-center" style={{ background: '#0f1011' }}>
                  <p className="text-[24px] font-[590] text-emerald tracking-[-0.22px]">
                    {result.created}
                  </p>
                  <p className="text-[11px] text-fog-grey mt-0.5 tracking-[-0.1px]">Created</p>
                </div>
                <div className="flex-1 rounded-md p-3 text-center" style={{ background: '#0f1011' }}>
                  <p className={cn('text-[24px] font-[590] tracking-[-0.22px]', result.failed > 0 ? 'text-warning-red' : 'text-fog-grey')}>
                    {result.failed}
                  </p>
                  <p className="text-[11px] text-fog-grey mt-0.5 tracking-[-0.1px]">Failed</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-md overflow-hidden max-h-48 overflow-y-auto" style={{ background: '#0f1011' }}>
                  {result.errors.map((err, i) => (
                    <div
                      key={i}
                      className="flex gap-3 px-3 py-2 border-b border-charcoal-grey/50 last:border-0"
                    >
                      <span className="text-[11px] text-fog-grey shrink-0 font-mono">
                        {err.row === 0 ? 'header' : `row ${err.row}`}
                      </span>
                      <span className="text-[12px] text-warning-red tracking-[-0.1px]">
                        {err.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-charcoal-grey">
          <button
            className="text-[12px] text-fog-grey hover:text-storm-cloud transition-colors tracking-[-0.1px]"
            onClick={handleDownloadTemplate}
          >
            Download template
          </button>

          <div className="flex gap-2">
            <button
              className="text-[13px] text-storm-cloud hover:text-porcelain px-3 py-1.5 transition-colors tracking-[-0.13px]"
              onClick={onClose}
            >
              {isDone ? 'Close' : 'Cancel'}
            </button>
            {!isDone && (
              <button
                className="text-[13px] font-[590] bg-neon-lime text-pitch-black rounded-md px-4 py-1.5 disabled:opacity-40 tracking-[-0.13px] hover:bg-[#cdd91f] transition-colors"
                onClick={handleUpload}
                disabled={!selectedFile || props.isPending}
              >
                {props.isPending ? 'Importing…' : 'Import'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
