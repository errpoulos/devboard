import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useCreateUserNote, useDeleteNote, useUpdateNote } from '../hooks/useTickets'
import type { ClientNote } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  userId: number
  supportNotes: ClientNote[]
  salesNotes: ClientNote[]
}

export default function NotesPanel({ userId, supportNotes, salesNotes }: Props) {
  const [newBody, setNewBody] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')

  const createNote = useCreateUserNote(userId)
  const updateNote = useUpdateNote(userId)
  const deleteNote = useDeleteNote(userId)

  function handleCreate() {
    if (!newBody.trim()) return
    createNote.mutate(newBody.trim(), { onSuccess: () => setNewBody('') })
  }

  function startEdit(note: ClientNote) {
    setEditId(note.id)
    setEditBody(note.body)
  }

  function saveEdit() {
    if (editId === null) return
    updateNote.mutate({ noteId: editId, body: editBody }, { onSuccess: () => setEditId(null) })
  }

  const allNotes = [
    ...supportNotes.map((n) => ({ ...n, _type: 'support' as const })),
    ...salesNotes.map((n) => ({ ...n, _type: 'sales' as const })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <div className="space-y-3">
      {allNotes.length === 0 ? (
        <p className="text-[12px] text-storm-cloud italic">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {allNotes.map((note) => (
            <li
              key={`${note._type}-${note.id}`}
              className="rounded-md px-3 py-2.5"
              style={{
                background: note._type === 'sales' ? '#1a1f16' : '#16181a',
                border: `1px solid ${note._type === 'sales' ? '#2d3325' : '#23252a'}`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {editId === note.id ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={2}
                        className="w-full rounded px-2 py-1 text-[12px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue resize-none"
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <button onClick={saveEdit} className="text-aether-blue hover:opacity-80">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setEditId(null)} className="text-storm-cloud hover:text-porcelain">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#c4c7cc] whitespace-pre-wrap">{note.body}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-[500]"
                      style={{
                        background: note._type === 'sales' ? '#2d3325' : '#23252a',
                        color: note._type === 'sales' ? '#8fa870' : '#6b8fa8',
                      }}
                    >
                      {note._type === 'sales' ? 'Sales' : 'Support'}
                    </span>
                    <span className="text-[11px] text-storm-cloud">{note.author?.name}</span>
                    <span className="text-[11px] text-fog-grey">{formatDate(note.created_at)}</span>
                  </div>
                </div>

                {note._type === 'support' && editId !== note.id && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(note)}
                      className="text-storm-cloud hover:text-porcelain transition-colors"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => deleteNote.mutate(note.id)}
                      className="text-storm-cloud hover:text-warning-red transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={2}
          placeholder="Add a support note…"
          className="flex-1 rounded px-2 py-1.5 text-[12px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue placeholder:text-fog-grey resize-none"
        />
        <button
          onClick={handleCreate}
          disabled={!newBody.trim() || createNote.isPending}
          className="self-end rounded px-2.5 py-1.5 text-[12px] font-[500] bg-aether-blue text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}
