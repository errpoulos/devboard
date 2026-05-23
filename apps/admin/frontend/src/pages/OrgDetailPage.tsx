import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useOrg, useUpdateOrg, useDeleteUser } from '@/features/admin/hooks/useAdmin'
import type { User } from '@/types'

const PLAN_OPTIONS = ['free', 'pro', 'enterprise'] as const
const STATUS_OPTIONS = ['trial', 'active', 'suspended'] as const

function planBadge(plan: string) {
  const map: Record<string, { bg: string; color: string }> = {
    free: { bg: 'rgba(142,142,153,0.15)', color: '#8e8e99' },
    pro: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
    enterprise: { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
  }
  const style = map[plan] ?? { bg: 'rgba(142,142,153,0.15)', color: '#8e8e99' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 4,
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: style.bg,
        color: style.color,
      }}
    >
      {plan}
    </span>
  )
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
    trial: { bg: 'rgba(234,179,8,0.15)', color: '#facc15' },
    suspended: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  }
  const style = map[status] ?? { bg: 'rgba(142,142,153,0.15)', color: '#8e8e99' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 4,
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        background: style.bg,
        color: style.color,
      }}
    >
      {status}
    </span>
  )
}

function UserRow({ user, orgId }: { user: User; orgId: number }) {
  const deleteUser = useDeleteUser()
  const [confirming, setConfirming] = useState(false)

  return (
    <tr
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-overlay)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')
      }
    >
      <td style={{ padding: '0.75rem 1rem' }}>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</div>
      </td>
      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        {user.email}
      </td>
      <td style={{ padding: '0.75rem 1rem' }}>
        {user.is_super_admin ? (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(139,92,246,0.15)',
              color: '#a78bfa',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Super Admin
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Member</span>
        )}
      </td>
      <td style={{ padding: '0.75rem 1rem' }}>
        {confirming ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Confirm?</span>
            <button
              onClick={() => {
                deleteUser.mutate(user.id, {
                  onSuccess: () => setConfirming(false),
                })
              }}
              disabled={deleteUser.isPending}
              style={{
                padding: '3px 8px',
                background: 'var(--accent-red)',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                padding: '3px 8px',
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            style={{
              padding: '4px 10px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              color: '#f87171',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  )
}

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const orgId = Number(id)

  const { data, isLoading, isError } = useOrg(orgId)
  const updateOrg = useUpdateOrg()

  const [pendingPlan, setPendingPlan] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const org = data?.data

  function handleSave() {
    if (!org) return
    const payload: { plan?: string; status?: string } = {}
    if (pendingPlan && pendingPlan !== org.plan) payload.plan = pendingPlan
    if (pendingStatus && pendingStatus !== org.status) payload.status = pendingStatus
    if (Object.keys(payload).length === 0) return

    updateOrg.mutate(
      { id: orgId, data: payload },
      {
        onSuccess: () => {
          setPendingPlan(null)
          setPendingStatus(null)
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 2000)
        },
      },
    )
  }

  const currentPlan = pendingPlan ?? org?.plan ?? ''
  const currentStatus = pendingStatus ?? org?.status ?? ''
  const hasChanges =
    (pendingPlan !== null && pendingPlan !== org?.plan) ||
    (pendingStatus !== null && pendingStatus !== org?.status)

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    minWidth: 130,
  }

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid var(--border-subtle)',
  }

  const users: User[] = (org as unknown as { users?: User[] })?.users ?? []

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Back link */}
      <button
        onClick={() => navigate('/orgs')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: '1.5rem',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Organizations
      </button>

      {isLoading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : isError || !org ? (
        <div style={{ color: '#f87171' }}>Failed to load organization.</div>
      ) : (
        <>
          {/* Org header card */}
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {org.name}
                </h1>
                <code
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-overlay)',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  {org.slug}
                </code>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 6 }}>
                      Current plan
                    </span>
                    {planBadge(org.plan)}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 6 }}>
                      Status
                    </span>
                    {statusBadge(org.status)}
                  </div>
                </div>
              </div>

              {/* Editable controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plan</label>
                  <select
                    value={currentPlan}
                    onChange={(e) => setPendingPlan(e.target.value)}
                    style={selectStyle}
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</label>
                  <select
                    value={currentStatus}
                    onChange={(e) => setPendingStatus(e.target.value)}
                    style={selectStyle}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', color: 'transparent' }}>Save</label>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || updateOrg.isPending}
                    style={{
                      padding: '6px 16px',
                      background: hasChanges ? 'var(--accent-blue)' : 'var(--bg-overlay)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                      color: hasChanges ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: hasChanges ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s',
                    }}
                  >
                    {updateOrg.isPending ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Members</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {org.users_count ?? users.length}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created</span>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {new Date(org.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Users table */}
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Members
              </h2>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {users.length} user{users.length !== 1 ? 's' : ''}
              </span>
            </div>

            {users.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No members in this organization.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Role</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <UserRow key={user.id} user={user} orgId={orgId} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
