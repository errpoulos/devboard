# DevBoard App Reference

## Purpose and Audience

DevBoard is the core application in the platform. It provides a Kanban-style task management system for engineering and product teams. Users organize work into workspaces, boards, and columns. Tasks support rich metadata (assignee, priority, due date, story points, attachments, comments) and update in real time across all connected clients via WebSockets.

DevBoard is also the destination for tasks created automatically by the Helpdesk's `DevboardBridge` when a ticket is classified as a bug report or feature request. Those auto-created tasks appear alongside manually created ones and carry a `helpdesk_ticket_id` reference.

**Primary audience:** developers, product managers, and anyone tracking engineering work.

---

## Local Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Demo credentials: `admin@devboard.test` / `password`

---

## Key Pages and Routes

### `/workspaces`
Lists all workspaces the authenticated user is a member of. Each workspace card links to its dashboard. A "New Workspace" form is available inline. The workspace is the top-level organizational unit; all boards, tasks, and members belong to a workspace.

### `/workspaces/:id/dashboard`
Per-workspace summary dashboard served by `DashboardService`. Shows task counts by status, recent activity, and a quick overview of active boards.

### `/workspaces/:id/boards/:boardId`
The main Kanban board view. This is the most feature-rich page in the application:

- Columns are rendered horizontally; tasks are rendered as draggable cards within each column
- `@dnd-kit/core` and `@dnd-kit/sortable` handle drag-and-drop for both task reordering within a column and moving tasks between columns
- The `useBoardChannel` hook subscribes to the `workspace.{id}` Reverb channel; any task move or update dispatched from the server is reflected immediately in all open sessions via `queryClient.invalidateQueries`
- The Zustand `boardStore` holds optimistic state during an in-flight drag operation; if the API call fails, the store rolls back to server state
- Clicking a task card opens a `TaskDetailModal` with full task editing: title, description, assignee, priority, due date, story points, comments, and file attachments
- A "Add Column" button at the right edge creates a new column via `BoardColumnController`
- A "Import CSV" button opens `ImportCsvModal` for bulk task creation

### `/workspaces/:id/settings`
Workspace settings: rename the workspace, manage members, and send invitations by email. Invitation links expire after 7 days. The invitation flow uses `WorkspaceService::invite()`, which dispatches a `MemberInvited` event handled by a queued listener that sends a `WorkspaceInvitationMail`.

---

## Role and Permission Model

DevBoard uses workspace-level roles stored in the `workspace_user` pivot table:

| Role | Permissions |
|---|---|
| `owner` | Full control: rename workspace, invite/remove members, create/delete boards, all task operations |
| `member` | Create and edit tasks, comment, manage own attachments; cannot delete the workspace or remove other members |

Role checks are enforced through Eloquent Policies (`WorkspacePolicy`, `BoardPolicy`, `TaskPolicy`, `CommentPolicy`). Controllers call `$this->authorize()` before delegating to a service. There is no frontend-only role gating — the API enforces everything.

---

## Notable Technical Features

### WorkspaceScope global Eloquent scope
All models that use the `BelongsToWorkspace` trait automatically filter by `workspace_id = app('current.workspace')->id`. The scope is applied at the ORM level, not in individual query methods, so it is impossible to forget. The `workspace` middleware alias resolves and binds the workspace before any controller action runs.

### Real-time with Reverb
The `useBoardChannel` hook subscribes to a private workspace channel. Server-side, `TaskMoved`, `TaskCreated`, `TaskUpdated`, and `TaskDeleted` events are broadcast on the `workspace.{id}` channel. The frontend invalidates the affected query keys on receipt, triggering a refetch. A `presence-board.{id}` channel is authorized server-side and reserved for future "who's viewing this board" UI.

### TaskStatusLog
Every time a task moves from one column to another, a `task_status_logs` record is written with `entered_at` and `exited_at` timestamps. The `exited_at` of the previous column entry and `entered_at` of the new one are written atomically. This log is the foundation for future cycle-time and throughput metrics.

### Optimistic drag-and-drop
The Zustand `boardStore` maintains an `optimisticTasks` map keyed by column ID. When the user starts a drag, the store is updated immediately. The API call (`reorderTasks` or `updateTask`) fires in the background. On error, the store is reset to the last server-confirmed state. This gives instant visual feedback without waiting for the round trip.

### CSV import
`BoardImportController` and `TaskImportController` accept CSV uploads. `CsvImportService` parses the file, validates rows, and batch-inserts tasks. The import result modal shows a count of created tasks and any validation errors per row.

### Helpdesk integration
Tasks created by `DevboardBridge` carry a `helpdesk_ticket_id` FK. The task card displays an `HD #N` badge when this field is set. DevBoard requires no polling or webhook for the reverse direction — the Helpdesk reads task status and comments directly via the bridge service.

---

## API Routes Summary

All routes are under `/api/v1/` and require Sanctum authentication. Workspace-scoped routes additionally require the `workspace` middleware.

```
POST   /auth/login
POST   /auth/logout
GET    /auth/me

GET    /workspaces
POST   /workspaces
GET    /workspaces/:id
PATCH  /workspaces/:id
DELETE /workspaces/:id

GET    /workspaces/:id/dashboard
GET    /workspaces/:id/members
POST   /workspaces/:id/members/invite
DELETE /workspaces/:id/members/:userId

GET    /workspaces/:id/boards
POST   /workspaces/:id/boards
POST   /workspaces/:id/boards/import
GET    /workspaces/:id/boards/:boardId

POST   /workspaces/:id/boards/:boardId/columns
PATCH  /workspaces/:id/boards/:boardId/columns/:colId
DELETE /workspaces/:id/boards/:boardId/columns/:colId
POST   /workspaces/:id/boards/:boardId/columns/reorder

GET    /workspaces/:id/boards/:boardId/tasks
POST   /workspaces/:id/boards/:boardId/tasks
POST   /workspaces/:id/boards/:boardId/tasks/import
GET    /workspaces/:id/boards/:boardId/tasks/:taskId
PATCH  /workspaces/:id/boards/:boardId/tasks/:taskId
DELETE /workspaces/:id/boards/:boardId/tasks/:taskId
POST   /workspaces/:id/boards/:boardId/tasks/reorder

GET    /workspaces/:id/boards/:boardId/tasks/:taskId/comments
POST   /workspaces/:id/boards/:boardId/tasks/:taskId/comments
DELETE /workspaces/:id/boards/:boardId/tasks/:taskId/comments/:commentId

GET    /workspaces/:id/boards/:boardId/tasks/:taskId/attachments
POST   /workspaces/:id/boards/:boardId/tasks/:taskId/attachments
GET    /workspaces/:id/boards/:boardId/tasks/:taskId/attachments/:attId/download
DELETE /workspaces/:id/boards/:boardId/tasks/:taskId/attachments/:attId
```
