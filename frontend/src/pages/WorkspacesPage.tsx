import { Link } from 'react-router'
import { useWorkspaces, useBoards, useCreateWorkspace } from '@/features/workspace/hooks/useWorkspaces'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null)
  const { data: boards } = useBoards(selectedWorkspaceId ?? 0)
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
              createWorkspace.mutate({ name, slug }, { onSuccess: () => setShowForm(false) })
            }}
            disabled={createWorkspace.isPending}
          >
            Create
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {workspaces?.map((ws) => (
          <div
            key={ws.id}
            className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => setSelectedWorkspaceId(ws.id)}
          >
            <h2 className="font-semibold text-gray-900">{ws.name}</h2>
            <p className="text-sm text-gray-500">{ws.slug}</p>

            {selectedWorkspaceId === ws.id && (
              <div className="mt-3 space-y-1">
                {boards?.map((board) => (
                  <Link
                    key={board.id}
                    to={`/workspaces/${ws.id}/boards/${board.id}`}
                    className="block px-3 py-2 rounded-md text-sm text-blue-600 hover:bg-blue-50"
                  >
                    {board.name}
                  </Link>
                ))}
                {boards?.length === 0 && (
                  <p className="text-sm text-gray-400 px-3">No boards yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
