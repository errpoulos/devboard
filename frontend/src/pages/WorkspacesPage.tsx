import { Link } from 'react-router'
import {
  useWorkspaces,
  useBoards,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useCreateBoard,
} from '@/features/workspace/hooks/useWorkspaces'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'
import type { Workspace } from '@/types'

function BoardList({ workspace }: { workspace: Workspace }) {
  const { data: boards } = useBoards(workspace.id)
  const createBoard = useCreateBoard(workspace.id)
  const [showBoardForm, setShowBoardForm] = useState(false)
  const [boardName, setBoardName] = useState('')

  return (
    <div className="mt-2 space-y-0.5">
      {boards?.map((board) => (
        <Link
          key={board.id}
          to={`/workspaces/${workspace.id}/boards/${board.id}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-[13px] text-storm-cloud hover:text-porcelain hover:bg-charcoal-grey transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-muted-ash shrink-0" />
          {board.name}
        </Link>
      ))}

      {boards?.length === 0 && !showBoardForm && (
        <p className="text-[12px] text-fog-grey px-3 py-1">No boards yet.</p>
      )}

      {showBoardForm ? (
        <div className="flex gap-2 pt-1 px-1">
          <Input
            placeholder="Board name"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setShowBoardForm(false); setBoardName('') }
            }}
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => {
              if (!boardName.trim()) return
              createBoard.mutate(
                { name: boardName.trim() },
                { onSuccess: () => { setShowBoardForm(false); setBoardName('') } },
              )
            }}
            disabled={createBoard.isPending}
          >
            Create
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowBoardForm(false); setBoardName('') }}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          className="flex items-center gap-1.5 text-[12px] text-fog-grey hover:text-storm-cloud px-3 py-1.5 w-full text-left transition-colors"
          onClick={(e) => { e.stopPropagation(); setShowBoardForm(true) }}
        >
          + New board
        </button>
      )}
    </div>
  )
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(workspace.name)
  const [editSlug, setEditSlug] = useState(workspace.slug)
  const updateWorkspace = useUpdateWorkspace()
  const deleteWorkspace = useDeleteWorkspace()

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setEditName(workspace.name)
    setEditSlug(workspace.slug)
    setEditing(true)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`Delete workspace "${workspace.name}"? This cannot be undone.`)) return
    deleteWorkspace.mutate(workspace.id)
  }

  function handleSave() {
    if (!editName.trim() || !editSlug.trim()) return
    updateWorkspace.mutate(
      { id: workspace.id, data: { name: editName.trim(), slug: editSlug.trim() } },
      { onSuccess: () => setEditing(false) },
    )
  }

  return (
    <div
      className="rounded-md border border-charcoal-grey transition-colors"
      style={{ background: '#0f1011', boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 4px 0px' }}
    >
      {editing ? (
        <div
          className="flex gap-2 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Workspace name"
            autoFocus
          />
          <Input
            value={editSlug}
            onChange={(e) => setEditSlug(e.target.value)}
            placeholder="slug"
          />
          <Button size="sm" onClick={handleSave} disabled={updateWorkspace.isPending}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center justify-between px-3 py-3 cursor-pointer group hover:bg-charcoal-grey/30 rounded-md transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[14px] font-[510] text-porcelain tracking-[-0.13px] truncate">
              {workspace.name}
            </span>
            <span className="text-[12px] text-fog-grey tracking-[-0.1px]">{workspace.slug}</span>
          </div>
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="p-1 text-fog-grey hover:text-storm-cloud rounded transition-colors"
              title="Edit workspace"
              onClick={handleEdit}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
              </svg>
            </button>
            <button
              className="p-1 text-fog-grey hover:text-warning-red rounded transition-colors"
              title="Delete workspace"
              onClick={handleDelete}
              disabled={deleteWorkspace.isPending}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {expanded && !editing && (
        <div className="px-3 pb-2 border-t border-charcoal-grey/50 pt-2">
          <BoardList workspace={workspace} />
        </div>
      )}
    </div>
  )
}

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces()
  const createWorkspace = useCreateWorkspace()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  if (isLoading) return <p className="text-[13px] text-storm-cloud">Loading workspaces…</p>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-[590] text-porcelain tracking-[-0.22px] leading-[1.33]">
          Workspaces
        </h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          New workspace
        </Button>
      </div>

      {showForm && (
        <div
          className="rounded-md border border-charcoal-grey p-3 mb-4 flex gap-2"
          style={{ background: '#161718' }}
        >
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Button
            onClick={() => {
              createWorkspace.mutate(
                { name, slug },
                { onSuccess: () => { setShowForm(false); setName(''); setSlug('') } },
              )
            }}
            disabled={createWorkspace.isPending}
          >
            Create
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {workspaces?.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}
        {workspaces?.length === 0 && (
          <p className="text-[13px] text-fog-grey text-center py-12">
            No workspaces yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  )
}
