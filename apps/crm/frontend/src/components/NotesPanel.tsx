import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useDeleteNote, useUpdateNote } from '@/features/crm/hooks/useCrm'
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
  notes: ClientNote[]
  invalidateKey: readonly unknown[]
  onAdd: (body: string) => Promise<unknown>
  isAdding?: boolean
}

export default function NotesPanel({ notes, invalidateKey, onAdd, isAdding }: Props) {
  const [newBody, setNewBody] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')

  const updateNote = useUpdateNote(invalidateKey)
  const deleteNote = useDeleteNote(invalidateKey)

  async function handleAdd() {
    if (!newBody.trim()) return
    await onAdd(newBody.trim())
    setNewBody('')
  }

  function startEdit(note: ClientNote) {
    setEditId(note.id)
    setEditBody(note.body)
  }

  function saveEdit() {
    if (editId === null) return
    updateNote.mutate({ noteId: editId, body: editBody }, { onSuccess: () => setEditId(null) })
  }

  return (
    <div className="space-y-3">
      {notes.length === 0 ? (
        <p className="text-[12px] text-[#6b7280] italic">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-md px-3 py-2.5"
              style={{ background: '#1a1f16', border: '1px solid #2d3325' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {editId === note.id ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={2}
                        className="w-full rounded px-2 py-1 text-[12px] bg-[#23252a] text-[#f7f8f8] border border-[#383b3f] focus:outline-none focus:border-[#5865f2] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <button onClick={saveEdit} className="text-[#5865f2] hover:opacity-80">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setEditId(null)} className="text-[#6b7280] hover:text-[#f7f8f8]">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#c4c7cc] whitespace-pre-wrap">{note.body}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-[500] bg-[#2d3325] text-[#8fa870]">
                      Sales
                    </span>
                    <span className="text-[11px] text-[#6b7280]">{note.author?.name}</span>
                    <span className="text-[11px] text-[#4b5563]">{formatDate(note.created_at)}</span>
                  </div>
                </div>

                {editId !== note.id && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(note)}
                      className="text-[#6b7280] hover:text-[#f7f8f8] transition-colors"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => deleteNote.mutate(note.id)}
                      className="text-[#6b7280] hover:text-red-400 transition-colors"
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
          placeholder="Add a sales note…"
          className="flex-1 rounded px-2 py-1.5 text-[12px] bg-[#23252a] text-[#f7f8f8] border border-[#383b3f] focus:outline-none focus:border-[#5865f2] placeholder:text-[#4b5563] resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={!newBody.trim() || isAdding}
          className="self-end rounded px-2.5 py-1.5 text-[12px] font-[500] bg-[#5865f2] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}
