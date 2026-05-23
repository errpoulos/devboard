import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDeleteOrg, useOrgs, useUpdateOrg } from '@/features/admin/hooks/useAdmin'
import type { Organization } from '@/types'

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
        padding: '2px 8px',
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
        padding: '2px 8px',
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

function DeleteDialog({
  org,
  onConfirm,
  onCancel,
  loading,
}: {
  org: Organization
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '1.5rem',
          maxWidth: 400,
          width: '100%',
          margin: '0 1rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Delete Organization
        </h2>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{org.name}</strong>?
          This action cannot be undone and will remove all associated users and workspaces.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--accent-red)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OrgRow({ org }: { org: Organization }) {
  const navigate = useNavigate()
  const updateOrg = useUpdateOrg()
  const deleteOrg = useDeleteOrg()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateOrg.mutate({ id: org.id, data: { plan: e.target.value } })
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateOrg.mutate({ id: org.id, data: { status: e.target.value } })
  }

  const selectStyle: React.CSSProperties = {
    padding: '3px 6px',
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: '0.8125rem',
    cursor: 'pointer',
  }

  return (
    <>
      <tr
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-overlay)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')
        }
      >
        <td style={{ padding: '0.875rem 1rem' }}>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{org.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{org.slug}</div>
        </td>
        <td style={{ padding: '0.875rem 1rem' }}>
          <select value={org.plan} onChange={handlePlanChange} style={selectStyle}>
            {PLAN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </td>
        <td style={{ padding: '0.875rem 1rem' }}>
          <select value={org.status} onChange={handleStatusChange} style={selectStyle}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </td>
        <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
          {org.users_count ?? 0}
        </td>
        <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          {new Date(org.created_at).toLocaleDateString()}
        </td>
        <td style={{ padding: '0.875rem 1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => navigate(`/orgs/${org.id}`)}
              style={{
                padding: '4px 10px',
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Manage
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
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
              Delete
            </button>
          </div>
        </td>
      </tr>
      {confirmDelete && (
        <DeleteDialog
          org={org}
          onConfirm={() => {
            deleteOrg.mutate(org.id, { onSuccess: () => setConfirmDelete(false) })
          }}
          onCancel={() => setConfirmDelete(false)}
          loading={deleteOrg.isPending}
        />
      )}
    </>
  )
}

export default function OrgsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useOrgs(page)

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Organizations
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {data?.meta.total ?? 0} total organizations
        </p>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading organizations...
          </div>
        ) : isError ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>
            Failed to load organizations.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={thStyle}>Organization</th>
                    <th style={thStyle}>Plan</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Users</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}
                      >
                        No organizations found.
                      </td>
                    </tr>
                  ) : (
                    data?.data.map((org) => <OrgRow key={org.id} org={org} />)
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.meta.last_page > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Page {data.meta.current_page} of {data.meta.last_page}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '4px 12px',
                      background: 'var(--bg-overlay)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6,
                      color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
                    disabled={page === data.meta.last_page}
                    style={{
                      padding: '4px 12px',
                      background: 'var(--bg-overlay)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6,
                      color:
                        page === data.meta.last_page ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: page === data.meta.last_page ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
