export const queryKeys = {
  orgs: () => ['orgs'] as const,
  org: (id: number) => ['orgs', id] as const,
  users: (orgId?: number) => (orgId ? ['users', { orgId }] : ['users']) as const,
}
