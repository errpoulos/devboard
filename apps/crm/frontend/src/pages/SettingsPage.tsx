import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/axios'
import type { User } from '@/types'

function fetchOrgUsers(): Promise<{ data: User[] }> {
  return api.get('/admin/users').then((r) => r.data)
}

function createUser(payload: {
  name: string
  email: string
  is_super_admin: boolean
}): Promise<{ data: User; temp_password?: string }> {
  return api.post('/admin/users', payload).then((r) => r.data)
}

function updateUser(
  userId: number,
  payload: Partial<{ name: string; is_super_admin: boolean }>,
): Promise<{ data: User }> {
  return api.patch(`/admin/users/${userId}`, payload).then((r) => r.data)
}

function deleteUser(userId: number): Promise<void> {
  return api.delete(`/admin/users/${userId}`).then(() => undefined)
}

function TempPasswordAlert({
  password,
  name,
  onDismiss,
}: {
  password: string
  name: string
  onDismiss: () => void
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded p-4 mb-6"
      style={{ background: '#1a2e1a', border: '1px solid #2d4a2d' }}
    >
      <p className="text-[13px] font-medium mb-1" style={{ color: '#4ade80' }}>
        Account created for {name}
      </p>
      <p className="text-[12px] mb-3" style={{ color: '#86efac' }}>
        Share this temporary password — it won't be shown again.
      </p>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 px-3 py-1.5 rounded text-[13px] font-mono"
          style={{ background: '#0f1c0f', color: '#86efac', border: '1px solid #2d4a2d' }}
        >
          {password}
        </code>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px]"
          style={{ background: '#2d4a2d', color: '#86efac' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button
        onClick={onDismiss}
        className="mt-3 text-[11px] hover:opacity-80"
        style={{ color: '#4a7a4a' }}
      >
        Dismiss
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchOrgUsers,
    enabled: !!currentUser?.is_super_admin,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; is_super_admin: boolean }> }) =>
      updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<{ password: string; name: string } | null>(null)

  if (!currentUser?.is_super_admin) {
    return (
      <div className="p-8 text-[13px] text-[#8a8f98]">
        You don't have permission to access this page.
      </div>
    )
  }

  const users: User[] = data?.data ?? []

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setTempPassword(null)
    try {
      const result = await createMutation.mutateAsync({ name, email, is_super_admin: isSuperAdmin })
      if (result.temp_password) {
        setTempPassword({ password: result.temp_password, name })
      }
      setName('')
      setEmail('')
      setIsSuperAdmin(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msg =
        e?.response?.data?.errors?.email?.[0] ??
        e?.response?.data?.message ??
        'Failed to add user.'
      setFormError(msg)
    }
  }

  return (
    <div>
      <h1 className="text-[18px] font-semibold text-[#f7f8f8] mb-6">Settings</h1>

      <section>
        <h2 className="text-[14px] font-medium text-[#d0d6e0] mb-4">Users</h2>

        {tempPassword && (
          <TempPasswordAlert
            password={tempPassword.password}
            name={tempPassword.name}
            onDismiss={() => setTempPassword(null)}
          />
        )}

        <div className="rounded border border-[#23252a] overflow-hidden mb-6" style={{ background: '#0d0e0f' }}>
          {isLoading ? (
            <div className="px-4 py-5 text-[13px] text-[#8a8f98]">Loading users…</div>
          ) : users.length === 0 ? (
            <div className="px-4 py-5 text-[13px] text-[#8a8f98]">No users yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#23252a]">
                  {['Name', 'Email', 'Role', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  return (
                    <tr key={u.id} className="border-b border-[#23252a] last:border-0">
                      <td className="px-4 py-3 text-[13px] text-[#f7f8f8]">{u.name}</td>
                      <td className="px-4 py-3 text-[13px] text-[#8a8f98]">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.is_super_admin ? (
                          <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-[#2d1f4a] text-[#c4b5fd]">
                            Admin
                          </span>
                        ) : (
                          <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-[#23252a] text-[#8a8f98]">
                            Member
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-[12px] italic text-[#8a8f98]">You</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {!u.is_super_admin ? (
                              <button
                                onClick={() =>
                                  updateMutation.mutate({ id: u.id, data: { is_super_admin: true } })
                                }
                                disabled={updateMutation.isPending}
                                className="text-[12px] px-2 py-1 rounded bg-[#2d1f4a] text-[#c4b5fd] disabled:opacity-40"
                              >
                                Make Admin
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  updateMutation.mutate({ id: u.id, data: { is_super_admin: false } })
                                }
                                disabled={updateMutation.isPending}
                                className="text-[12px] px-2 py-1 rounded bg-[#1a2540] text-[#93c5fd] disabled:opacity-40"
                              >
                                Remove Admin
                              </button>
                            )}
                            <button
                              onClick={() => deleteMutation.mutate(u.id)}
                              disabled={deleteMutation.isPending}
                              className="text-[12px] px-2 py-1 rounded bg-[#3d1515] text-[#fc8181] disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Add user form */}
        <div className="rounded border border-[#23252a] p-5" style={{ background: '#0d0e0f' }}>
          <h3 className="text-[13px] font-medium text-[#f7f8f8] mb-4">Add user</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-[12px] text-[#8a8f98] mb-1.5">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-[#f7f8f8] border border-[#383b3f] focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[12px] text-[#8a8f98] mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-[#f7f8f8] border border-[#383b3f] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  id="crm_is_admin"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                />
                <label htmlFor="crm_is_admin" className="text-[12px] text-[#d0d6e0] whitespace-nowrap">
                  Admin
                </label>
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded text-[13px] font-medium bg-[#5e6ad2] text-white disabled:opacity-50 whitespace-nowrap"
              >
                {createMutation.isPending ? 'Adding…' : 'Add user'}
              </button>
            </div>
            {formError && <p className="text-[12px] text-[#fc8181]">{formError}</p>}
          </form>
        </div>
      </section>
    </div>
  )
}
