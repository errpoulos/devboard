import { useState } from 'react'
import { Navigate } from 'react-router'
import { Copy, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import {
  useTeam,
  useAddTeamMember,
  useUpdateTeamMember,
  useRemoveTeamMember,
} from '@/features/tickets/hooks/useTickets'
import type { User } from '@/types'

function RoleBadge({ role }: { role: string | null | undefined }) {
  if (role === 'administrator') {
    return (
      <span
        className="text-[11px] px-1.5 py-0.5 rounded font-[500]"
        style={{ background: '#2d1f4a', color: '#c4b5fd' }}
      >
        Admin
      </span>
    )
  }
  if (role === 'agent') {
    return (
      <span
        className="text-[11px] px-1.5 py-0.5 rounded font-[500]"
        style={{ background: '#1a2540', color: '#93c5fd' }}
      >
        Agent
      </span>
    )
  }
  return (
    <span
      className="text-[11px] px-1.5 py-0.5 rounded font-[500]"
      style={{ background: '#23252a', color: '#8a8f98' }}
    >
      Customer
    </span>
  )
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
      className="rounded-md p-4 mb-6"
      style={{ background: '#1a2e1a', border: '1px solid #2d4a2d' }}
    >
      <p className="text-[13px] font-[510] text-emerald mb-1">
        Account created for {name}
      </p>
      <p className="text-[12px] text-[#86efac] mb-3">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] transition-colors"
          style={{ background: '#2d4a2d', color: '#86efac' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button
        onClick={onDismiss}
        className="mt-3 text-[11px] text-[#4a7a4a] hover:text-[#86efac] transition-colors"
      >
        Dismiss
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'administrator'

  const { data: teamData, isLoading } = useTeam()
  const addMember = useAddTeamMember()
  const updateMember = useUpdateTeamMember()
  const removeMember = useRemoveTeamMember()

  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState<'agent' | 'administrator'>('agent')
  const [addError, setAddError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<{ password: string; name: string } | null>(null)

  if (!isAdmin) {
    return <Navigate to="/tickets" replace />
  }

  const members: User[] = teamData?.data ?? []

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    setTempPassword(null)
    try {
      const result = await addMember.mutateAsync({ email: addEmail, name: addName, role: addRole })
      if (result.temp_password) {
        setTempPassword({ password: result.temp_password, name: addName })
      }
      setAddName('')
      setAddEmail('')
      setAddRole('agent')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msg =
        error?.response?.data?.errors?.email?.[0] ??
        error?.response?.data?.message ??
        'Failed to add member.'
      setAddError(msg)
    }
  }

  function handlePromote(member: User) {
    updateMember.mutate({ userId: member.id, data: { role: 'administrator' } })
  }

  function handleDemoteToAgent(member: User) {
    updateMember.mutate({ userId: member.id, data: { role: 'agent' } })
  }

  function handleRemove(member: User) {
    removeMember.mutate(member.id)
  }

  return (
    <div className="min-h-screen bg-pitch-black text-porcelain">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-[20px] font-[590] tracking-[-0.2px] mb-8">Settings</h1>

        <section>
          <h2 className="text-[15px] font-[510] tracking-[-0.13px] mb-4">Team Members</h2>

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
              <div className="px-4 py-6 text-[13px] text-storm-cloud">Loading team…</div>
            ) : members.length === 0 ? (
              <div className="px-4 py-6 text-[13px] text-storm-cloud">No team members yet.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#23252a]">
                    <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const isSelf = member.id === user?.id
                    return (
                      <tr
                        key={member.id}
                        className="border-b border-[#23252a] last:border-0 hover:bg-[#161718] transition-colors"
                      >
                        <td className="px-4 py-3 text-[13px] text-porcelain">{member.name}</td>
                        <td className="px-4 py-3 text-[13px] text-storm-cloud">{member.email}</td>
                        <td className="px-4 py-3">
                          <RoleBadge role={member.role} />
                        </td>
                        <td className="px-4 py-3">
                          {isSelf ? (
                            <span className="text-[12px] text-storm-cloud italic">You</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {member.role === 'agent' && (
                                <button
                                  onClick={() => handlePromote(member)}
                                  disabled={updateMember.isPending}
                                  className="text-[12px] px-2 py-1 rounded bg-[#2d1f4a] text-[#c4b5fd] hover:opacity-80 transition-opacity disabled:opacity-40"
                                >
                                  Promote to Admin
                                </button>
                              )}
                              {member.role === 'administrator' && (
                                <button
                                  onClick={() => handleDemoteToAgent(member)}
                                  disabled={updateMember.isPending}
                                  className="text-[12px] px-2 py-1 rounded bg-[#1a2540] text-[#93c5fd] hover:opacity-80 transition-opacity disabled:opacity-40"
                                >
                                  Demote to Agent
                                </button>
                              )}
                              <button
                                onClick={() => handleRemove(member)}
                                disabled={removeMember.isPending}
                                className="text-[12px] px-2 py-1 rounded bg-[#3d1515] text-[#fc8181] hover:opacity-80 transition-opacity disabled:opacity-40"
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

          {/* Add team member */}
          <div
            className="rounded-md p-5"
            style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
          >
            <h3 className="text-[13px] font-[510] text-porcelain mb-4">Add team member</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] text-storm-cloud mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                    className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue placeholder:text-fog-grey"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[12px] text-storm-cloud mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    className="w-full rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue placeholder:text-fog-grey"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-storm-cloud mb-1.5">Role</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as 'agent' | 'administrator')}
                    className="rounded px-3 py-2 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue"
                  >
                    <option value="agent">Agent</option>
                    <option value="administrator">Administrator</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={addMember.isPending}
                  className="px-4 py-2 rounded text-[13px] font-[500] bg-aether-blue text-white hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
                >
                  {addMember.isPending ? 'Adding…' : 'Add member'}
                </button>
              </div>
              {addError && <p className="text-[12px] text-warning-red">{addError}</p>}
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
