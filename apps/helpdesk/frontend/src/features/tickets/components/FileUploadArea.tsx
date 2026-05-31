import { useRef, useState } from 'react'
import { Paperclip, X, Download } from 'lucide-react'
import { useAttachments, useDeleteAttachment, useUploadAttachment } from '../hooks/useTickets'
import type { TicketAttachment } from '@/types'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface Props {
  ticketId: number
  canDelete?: boolean
}

export default function FileUploadArea({ ticketId, canDelete = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const { data, isLoading } = useAttachments(ticketId)
  const upload = useUploadAttachment(ticketId)
  const remove = useDeleteAttachment(ticketId)

  const attachments: TicketAttachment[] = data?.data ?? []

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file) => upload.mutate(file))
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-md px-4 py-3 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-aether-blue bg-[#1a2535]' : 'border-[#383b3f] hover:border-[#62666d]'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      >
        <Paperclip size={14} className="inline mr-1.5 text-storm-cloud" />
        <span className="text-[12px] text-storm-cloud">
          {upload.isPending ? 'Uploading…' : 'Attach files — click or drag and drop'}
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {!isLoading && attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between rounded px-3 py-1.5 text-[12px]"
              style={{ background: '#161718', border: '1px solid #23252a' }}
            >
              <span className="text-porcelain truncate mr-2">{att.filename}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-storm-cloud">{formatBytes(att.size)}</span>
                <a
                  href={`/api/v1/tickets/${ticketId}/attachments/${att.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-storm-cloud hover:text-aether-blue transition-colors"
                  title="Download"
                >
                  <Download size={12} />
                </a>
                {canDelete && (
                  <button
                    onClick={() => remove.mutate(att.id)}
                    className="text-storm-cloud hover:text-warning-red transition-colors"
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
