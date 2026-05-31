export const queryKeys = {
  me: ['auth', 'me'] as const,
  companies: () => ['companies'] as const,
  company: (id: number) => ['companies', id] as const,
  companyNotes: (id: number) => ['companies', id, 'notes'] as const,
  contacts: () => ['contacts'] as const,
  contact: (id: number) => ['contacts', id] as const,
  contactNotes: (id: number) => ['contacts', id, 'notes'] as const,
  pipeline: () => ['pipeline'] as const,
  deals: (stageId?: number) => (stageId !== undefined ? ['deals', stageId] : ['deals']) as readonly unknown[],
}
