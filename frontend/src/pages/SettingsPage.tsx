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
    <div className="rounded-md p-4 mb-6" style={{ background: '#1a2e1a', border: '1px solid #2d4a2d' }}>
      <p className="text-[13px] font-[510] mb-1" style={{ color: '#4ade80' }}>
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
        className="mt-3 text-[11px] hover:opacity-80 transition-opacity"
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
      <div className="p-8 text-[13px]" style={{ color: '#8a8f98' }}>
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
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-[20px] font-[590] tracking-[-0.2px] mb-8" style={{ color: '#f7f8f8' }}>
        Settings
      </h1>

      <section>
        <h2 className="text-[15px] font-[510] mb-4" style={{ color: '#d0d6e0' }}>
          Users
        </h2>

        {tempPassword && (
          <TempPasswordAlert
            password={tempPassword.password}
            name={tempPassword.name}
            onDismiss={() => setTempPassword(null)}
          />
        )}

        <div
          className="rounded-md overflow-hidden mb-8"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          {isLoading ? (
            <div className="px-4 py-6 text-[13px]" style={{ color: '#8a8f98' }}>
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-6 text-[13px]" style={{ color: '#8a8f98' }}>
              No users yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#23252a]">
                  {['Name', 'Email', 'Admin', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[11px] font-[500] uppercase tracking-[0.05em]"
                      style={{ color: '#8a8f98' }}
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
                    <tr
                      key={u.id}
                      className="border-b border-[#23252a] last:border-0"
                      style={{ background: 'transparent' }}
                    >
                      <td className="px-4 py-3 text-[13px]" style={{ color: '#f7f8f8' }}>
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-[13px]" style={{ color: '#8a8f98' }}>
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_super_admin ? (
                          <span
                            className="text-[11px] px-1.5 py-0.5 rounded font-[500]"
                            style={{ background: '#2d1f4a', color: '#c4b5fd' }}
                          >
                            Admin
                          </span>
                        ) : (
                          <span
                            className="text-[11px] px-1.5 py-0.5 rounded font-[500]"
                            style={{ background: '#23252a', color: '#8a8f98' }}
                          >
                            Member
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-[12px] italic" style={{ color: '#8a8f98' }}>
                            You
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {!u.is_super_admin ? (
                              <button
                                onClick={() =>
                                  updateMutation.mutate({ id: u.id, data: { is_super_admin: true } })
                                }
                                disabled={updateMutation.isPending}
                                className="text-[12px] px-2 py-1 rounded disabled:opacity-40"
                                style={{ background: '#2d1f4a', color: '#c4b5fd' }}
                              >
                                Make Admin
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  updateMutation.mutate({ id: u.id, data: { is_super_admin: false } })
                                }
                                disabled={updateMutation.isPending}
                                className="text-[12px] px-2 py-1 rounded disabled:opacity-40"
                                style={{ background: '#1a2540', color: '#93c5fd' }}
                              >
                                Remove Admin
                              </button>
                            )}
                            <button
                              onClick={() => deleteMutation.mutate(u.id)}
                              disabled={deleteMutation.isPending}
                              className="text-[12px] px-2 py-1 rounded disabled:opacity-40"
                              style={{ background: '#3d1515', color: '#fc8181' }}
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
        <div
          className="rounded-md p-5"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          <h3 className="text-[13px] font-[510] mb-4" style={{ color: '#f7f8f8' }}>
            Add user
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-[12px] mb-1.5" style={{ color: '#8a8f98' }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="w-full rounded px-3 py-2 text-[13px] focus:outline-none"
                  style={{
                    background: '#23252a',
                    color: '#f7f8f8',
                    border: '1px solid #383b3f',
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[12px] mb-1.5" style={{ color: '#8a8f98' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="w-full rounded px-3 py-2 text-[13px] focus:outline-none"
                  style={{
                    background: '#23252a',
                    color: '#f7f8f8',
                    border: '1px solid #383b3f',
                  }}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  id="is_super_admin"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="is_super_admin" className="text-[12px] whitespace-nowrap" style={{ color: '#d0d6e0' }}>
                  Admin
                </label>
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded text-[13px] font-[500] disabled:opacity-50 whitespace-nowrap"
                style={{ background: '#5e6ad2', color: '#fff' }}
              >
                {createMutation.isPending ? 'Adding…' : 'Add user'}
              </button>
            </div>
            {formError && (
              <p className="text-[12px]" style={{ color: '#fc8181' }}>
                {formError}
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  )
}
