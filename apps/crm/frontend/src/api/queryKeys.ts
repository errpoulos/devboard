export const queryKeys = {
  me: ['auth', 'me'] as const,
  companies: () => ['companies'] as const,
  company: (id: number) => ['companies', id] as const,
  contacts: () => ['contacts'] as const,
  contact: (id: number) => ['contacts', id] as const,
  pipeline: () => ['pipeline'] as const,
  deals: (stageId?: number) => (stageId !== undefined ? ['deals', stageId] : ['deals']) as readonly unknown[],
}
