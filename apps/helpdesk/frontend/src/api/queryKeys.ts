export const queryKeys = {
  tickets: (filters?: Record<string, unknown>) => filters ? ['tickets', filters] as const : ['tickets'] as const,
  ticket: (id: number) => ['tickets', id] as const,
  replies: (ticketId: number) => ['tickets', ticketId, 'replies'] as const,
  attachments: (ticketId: number) => ['tickets', ticketId, 'attachments'] as const,
  agents: () => ['agents'] as const,
  userNotes: (userId: number) => ['users', userId, 'notes'] as const,
  team: () => ['team'] as const,
  customers: () => ['customers'] as const,
  customer: (id: number) => ['customers', id] as const,
}
