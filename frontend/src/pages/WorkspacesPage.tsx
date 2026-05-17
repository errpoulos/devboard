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
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import type { Workspace } from '@/types'

function BoardList({ workspace }: { workspace: Workspace }) {
  const { data: boards } = useBoards(workspace.id)
  const createBoard = useCreateBoard(workspace.id)
  const [showBoardForm, setShowBoardForm] = useState(false)
  const [boardName, setBoardName] = useState('')

  return (
    <div className="mt-3 space-y-1">
      {boards?.map((board) => (
        <Link
          key={board.id}
          to={`/workspaces/${workspace.id}/boards/${board.id}`}
          className="block px-3 py-2 rounded-md text-sm text-blue-600 hover:bg-blue-50"
        >
          {board.name}
        </Link>
      ))}
      {boards?.length === 0 && !showBoardForm && (
        <p className="text-sm text-gray-400 px-3">No boards yet.</p>
      )}

      {showBoardForm ? (
        <div className="flex gap-2 pt-1 px-1">
          <Input
            placeholder="Board name"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowBoardForm(false)
                setBoardName('')
              }
            }}
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => {
              if (!boardName.trim()) return
              createBoard.mutate(
                { name: boardName.trim() },
                {
                  onSuccess: () => {
                    setShowBoardForm(false)
                    setBoardName('')
                  },
                },
              )
            }}
            disabled={createBoard.isPending}
          >
            Create
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowBoardForm(false)
              setBoardName('')
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <button
          className="text-sm text-gray-400 hover:text-blue-600 px-3 py-1 w-full text-left"
          onClick={(e) => {
            e.stopPropagation()
            setShowBoardForm(true)
          }}
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
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
      onClick={() => !editing && setExpanded((v) => !v)}
    >
      {editing ? (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
        <div className="flex items-center justify-between cursor-pointer">
          <div>
            <h2 className="font-semibold text-gray-900">{workspace.name}</h2>
            <p className="text-sm text-gray-500">{workspace.slug}</p>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
              title="Edit workspace"
              onClick={handleEdit}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
              </svg>
            </button>
            <button
              className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
              title="Delete workspace"
              onClick={handleDelete}
              disabled={deleteWorkspace.isPending}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {expanded && !editing && <BoardList workspace={workspace} />}
    </div>
  )
}

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces()
  const createWorkspace = useCreateWorkspace()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  if (isLoading) return <p className="text-gray-500">Loading workspaces…</p>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          New workspace
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <Button
            onClick={() => {
              createWorkspace.mutate({ name, slug }, { onSuccess: () => { setShowForm(false); setName(''); setSlug('') } })
            }}
            disabled={createWorkspace.isPending}
          >
            Create
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {workspaces?.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}
      </div>
    </div>
  )
}
