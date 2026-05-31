export const queryKeys = {
  me: ['auth', 'me'] as const,
  workspaces: () => ['workspaces'] as const,
  workspace: (id: number) => ['workspaces', id] as const,
  boards: (workspaceId: number) => ['workspaces', workspaceId, 'boards'] as const,
  board: (workspaceId: number, boardId: number) =>
    ['workspaces', workspaceId, 'boards', boardId] as const,
  tasks: (workspaceId: number, boardId: number) =>
    ['workspaces', workspaceId, 'boards', boardId, 'tasks'] as const,
  task: (workspaceId: number, boardId: number, taskId: number) =>
    ['workspaces', workspaceId, 'boards', boardId, 'tasks', taskId] as const,
  comments: (taskId: number) => ['tasks', taskId, 'comments'] as const,
  attachments: (taskId: number) => ['tasks', taskId, 'attachments'] as const,
  members: (workspaceId: number) => ['workspaces', workspaceId, 'members'] as const,
  dashboard: (workspaceId: number, boardId?: number | null) =>
    ['workspaces', workspaceId, 'dashboard', boardId ?? 'all'] as const,
}
