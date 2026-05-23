export const queryKeys = {
  tickets: () => ['tickets'] as const,
  ticket: (id: number) => ['tickets', id] as const,
  replies: (ticketId: number) => ['tickets', ticketId, 'replies'] as const,
}
