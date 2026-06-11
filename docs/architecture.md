# Architecture Reference

This document covers the technical decisions that shape how DevBoard is built and how the four apps relate to each other.

---

## Why a Shared Database

The platform integrates four apps — DevBoard, Helpdesk, CRM, and Admin — by having all of them read and write the same MySQL database, rather than running separate databases and synchronizing via APIs or message queues.

**The alternative would be microservices with async integration.** That means a webhook from the CRM fires when a note is saved, a queue consumer in the Helpdesk picks it up and writes a local copy, and the agent sidebar queries that local copy. This works, but it introduces several problems at startup scale: eventual consistency windows (how stale can a sales note be before it misleads an agent?), duplicate data that can diverge, dead-letter queues that need monitoring, and integration contracts that must be versioned and tested across service boundaries.

**The shared database trades those problems for tight coupling.** The coupling is acceptable here because all four apps are owned by one team, deployed together, and designed to be a single product. The benefit is that "integration" between apps is just a SQL join. When a helpdesk agent opens a ticket, the `client_notes` query reads sales notes written by the CRM application in the same transaction log, with zero lag and zero duplication. When `DevboardBridge` inserts a task, it writes to the same `tasks` table that the DevBoard kanban reads from — there is no propagation delay.

Each sub-app is its own independent Laravel installation with its own `bootstrap/app.php`, middleware stack, and API surface. The shared database is the only intentional coupling point. Apps do not call each other over HTTP.

---

## Tenant Isolation

Every table that holds organization-scoped data carries an `organization_id` column. This includes `workspaces`, `boards`, `tasks`, `comments`, `tickets`, `deals`, `contacts`, `companies`, and `client_notes`.

### WorkspaceScope

For models that belong to a workspace (boards, tasks, columns, comments, attachments), the `BelongsToWorkspace` trait applies a global Eloquent scope automatically:

```php
// app/Models/Traits/BelongsToWorkspace.php
protected static function booted(): void
{
    static::addGlobalScope(new WorkspaceScope);
}

// app/Models/Scopes/WorkspaceScope.php
public function apply(Builder $builder, Model $model): void
{
    if (app()->has('current.workspace')) {
        $builder->where($model->getTable().'.workspace_id', app('current.workspace')->id);
    }
}
```

The scope is conditional: it only filters if `current.workspace` is bound in the container. This means the scope is safe to use in Artisan commands and tests where no workspace is active, while being enforced on every HTTP request that goes through the workspace middleware.

### SetCurrentWorkspace Middleware

All routes nested under `/api/v1/workspaces/{workspace}/` are wrapped by the `workspace` middleware alias, which resolves the workspace from the route parameter, verifies the authenticated user is a member, and binds it into the service container:

```php
app()->instance('current.workspace', $workspace);
```

After this point, any Eloquent query on a `BelongsToWorkspace` model is automatically scoped to that workspace's ID. There is no way to accidentally query tasks from a different workspace through normal Eloquent usage.

For the sub-apps (Helpdesk, CRM), tenant scoping is applied explicitly in service methods rather than via a global scope, because those apps work at the organization level rather than the workspace level. The `CrmService` always adds `where('organization_id', $user->organization_id)` to every query.

---

## Cross-App Eloquent

The helpdesk app needs to read and write DevBoard's `tasks`, `boards`, `workspaces`, and `comments` tables. Rather than HTTP calls, it uses thin Eloquent model wrappers located in `apps/helpdesk/app/Models/Devboard/`.

Each wrapper simply declares the correct table name:

```php
// apps/helpdesk/app/Models/Devboard/DevboardTask.php
class DevboardTask extends Model
{
    protected $table = 'tasks';

    protected $fillable = [
        'workspace_id', 'board_column_id', 'title',
        'description', 'priority', 'position', 'helpdesk_ticket_id',
    ];

    public function column(): BelongsTo
    {
        return $this->belongsTo(DevboardBoardColumn::class, 'board_column_id');
    }
}
```

The wrapper models intentionally do **not** apply `WorkspaceScope`. `DevboardBridge` is the only place these models are used, and it always queries with explicit `workspace_id` and `board_id` constraints. The absence of the global scope is deliberate: the bridge operates outside a request context that would have the workspace middleware set.

Similarly, the CRM app has a `DevboardTask` wrapper used to surface deal-linked tasks in the admin CRM summary view.

---

## Shared `client_notes` Table

The `client_notes` table is the main data-sharing mechanism between CRM and Helpdesk. Its schema:

```
client_notes
  id               bigint PK
  organization_id  bigint nullable  -- org-level notes
  subject_user_id  bigint nullable  -- user-level notes (FK → users)
  author_id        bigint           -- FK → users (cascadeOnDelete)
  category         enum('sales', 'support')
  body             text
  created_at
  updated_at
```

**Category** determines which app wrote the note and which app should display it:
- `sales` — written by CRM; queried by Helpdesk's agent sidebar
- `support` — written by Helpdesk agents; not currently read by CRM

**subject_user_id** targets a specific user (customer). This is used when an agent writes a note about a customer's individual behavior or history.

**organization_id** without a `subject_user_id` is an org-level note — relevant to anyone at that organization, regardless of which user opens the ticket.

The Helpdesk `ClientNoteController` and `AgentSidebar` component query both types. The `TicketResource` eager-loads `customer_notes` (notes where `subject_user_id = ticket.user_id`) and `org_notes` (notes where `organization_id = ticket.organization_id` and `subject_user_id IS NULL`) and serializes them into the ticket response. The frontend splits them by category for display.

---

## Authentication

All four apps use **Sanctum SPA cookie authentication**. There are no personal access tokens issued to the first-party frontends.

### Login sequence

1. The React frontend calls `GET /sanctum/csrf-cookie`, which sets the `XSRF-TOKEN` cookie.
2. The frontend submits credentials to `POST /api/v1/auth/login`.
3. Laravel validates, creates a session, and sets a session cookie.
4. All subsequent Axios requests include the `X-XSRF-TOKEN` header (automatically read from the cookie by Axios's `withXSRFToken: true` config) and the session cookie (`withCredentials: true`).

Each sub-app has its own Sanctum session domain configured in `.env` (`SANCTUM_STATEFUL_DOMAINS`). Sub-app sessions are independent — logging into the CRM does not log you into the Helpdesk. This is intentional: the apps have different user roles and separate login flows.

### Role model

Users have a `role` column (`agent`, `customer`, `admin`) and an `is_super_admin` boolean. The correct authorization check depends on which app is handling the request:

- **DevBoard**: workspace membership and role in `workspace_user` pivot (owner / member)
- **Helpdesk**: `role` on the `users` table; `agent` vs `customer` gates which UI controls and API actions are available
- **CRM**: any authenticated user in the organization can access CRM resources
- **Admin**: `is_super_admin = true`, enforced by `EnsureSuperAdmin` middleware on every protected route

---

## Real-Time Architecture

DevBoard uses Laravel Reverb as the WebSocket server. Reverb runs as a separate Docker Compose service, started with:

```bash
php artisan reverb:start --host=0.0.0.0 --port=8080
```

### Channel types

- **Private channels** (`workspace.{id}`) — used for workspace-scoped events such as task creation and deletion. The Echo client subscribes via `echo.private('workspace.{id}')`, which appends the `private-` prefix internally. Only authenticated workspace members can subscribe.
- **Presence channels** (`presence-board.{id}`) — authorized server-side; reserved for a future "who's viewing this board" feature. The channel authorization route is wired up but the frontend does not yet subscribe.

### Frontend subscription pattern

Channel subscriptions live in custom hooks, not in page components. The hook registers the subscription in `useEffect` and returns the cleanup function:

```typescript
// frontend/src/features/tasks/hooks/useBoardChannel.ts
useEffect(() => {
  const channel = echo.private(`workspace.${workspaceId}`);
  channel.listen('TaskMoved', (e: TaskMovedEvent) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
  });
  return () => echo.leave(`workspace.${workspaceId}`);
}, [workspaceId, boardId]);
```

TanStack Query's `invalidateQueries` is the bridge between WebSocket events and UI state. The event triggers a refetch rather than manually patching the cache, which keeps the state management simple and consistent with server state.

### Channel authorization

Private and presence channel authorization is handled by Laravel's broadcast route, registered via `->withBroadcasting()` in `bootstrap/app.php`. The channel route uses the `auth:sanctum` middleware. The Echo instance uses a custom Axios authorizer to pass the CSRF token and session cookie through the authorization request.

---

## Queue Architecture

The queue driver is `redis`. Horizon manages all workers in development and production.

### Named queues

Four queues are defined:

| Queue | Purpose |
|---|---|
| `default` | General-purpose background work |
| `notifications` | In-app and push notifications |
| `mail` | Outbound email (invitation emails, digest) |
| `media` | File processing and attachment scanning |

All queued listeners that perform slow work (sending email, writing activity logs, calling external services) implement `ShouldQueue`. Listeners that do not implement `ShouldQueue` run synchronously and should be limited to fast in-memory operations.

Every job class sets explicit `$tries` and `$backoff` values. The Horizon dashboard is accessible at `/horizon` (protected by `HorizonServiceProvider`, which gates access by email).

### Scheduled commands

Scheduled tasks are defined in `routes/console.php` (Laravel 11 style):

- `sanctum:prune-expired --hours=24` — daily
- `horizon:snapshot` — every 5 minutes (for Horizon metrics)
- `app:send-weekly-digest` — Mondays at 08:00 UTC

---

## Layered Backend Pattern

Every API endpoint follows this chain:

```
Request → FormRequest (validation) → Controller → Service → DTO + Policy → Resource
```

**Controllers** are orchestrators only. They validate input via a Form Request, call one Service method, and return a Resource. They contain no Eloquent queries, no conditional logic beyond a single `if ($result)`, and no direct event dispatching.

**Services** own all business logic and Eloquent interactions. A Service method creates models, dispatches events, and coordinates cross-concern work. Services are plain PHP classes with no framework dependencies beyond what is constructor-injected.

**DTOs** are `readonly` PHP classes that carry structured data between the controller and service. They expose a static `fromRequest()` factory that reads only validated fields. The service never receives a raw `$request` object or an associative array from the controller.

**Policies** gate every resource action. The controller calls `$this->authorize('update', $task)` before delegating to the service. Policies are registered automatically via Laravel's model-based policy discovery.

**Resources** shape API responses. Every endpoint returns a `JsonResource` or `ResourceCollection`. Raw `response()->json()` calls, `$model->toArray()`, and hand-built arrays are not used.

**Events and Listeners** handle side effects. When `TaskService::create()` finishes, it dispatches `new TaskCreated($task, $actor)`. A queued listener picks it up and handles the activity log, notification, or cache invalidation. This keeps the service focused on its primary responsibility and makes side effects auditable by inspecting the event listener map.

---

## DevboardBridge

`DevboardBridge` (`apps/helpdesk/app/Services/DevboardBridge.php`) is the service responsible for writing to and reading from DevBoard's tables from within the Helpdesk application.

### Why direct DB access instead of HTTP

An HTTP call from Helpdesk to DevBoard's API would require:
- The DevBoard backend to be running and reachable from the Helpdesk container
- An authentication mechanism for service-to-service calls (API tokens, shared secret)
- Error handling for network failures and API version mismatches
- A contract (the DevBoard API) that cannot be changed without coordinating both apps

Direct database access requires none of this. Because both apps share one MySQL instance and the `DevboardTask` wrapper maps to the same physical `tasks` table, the bridge is just Eloquent code. It runs in the same request cycle as the ticket update, with no network hop, no auth overhead, and no additional failure modes.

The tradeoff is that the bridge is coupled to DevBoard's schema. A column rename in a DevBoard migration would break the bridge. This is mitigated by the fact that both apps are in the same repository and the same team owns the schema.

### Task creation flow

When `TicketService` detects that a ticket's type has been set to `bug_report` or `feature_request` (either on creation or on update), it calls `DevboardBridge::createTask($ticket)`:

1. Bridge queries `DevboardWorkspace` for the record where `is_default = true`
2. Bridge queries `DevboardBoard` for a board with the matching name ("Bug Reports" or "Feature Requests") within that workspace
3. Bridge queries `DevboardBoardColumn` for the first column by position (the leftmost / backlog column)
4. Bridge inserts a `DevboardTask` with the ticket's subject, description, priority, and `helpdesk_ticket_id` FK
5. Returns the new task ID, which `TicketService` writes back to `tickets.devboard_task_id`

The `app:ensure-devboard-defaults` Artisan command seeds the default workspace, boards, and columns that the bridge depends on.

### Status read-back

When the Helpdesk `TicketResource` serializes a ticket that has a `devboard_task_id`, it calls `DevboardBridge::getTaskStatus()` and `DevboardBridge::getTaskComments()` to build the `devboard_task` payload. The `AgentSidebar` React component renders this as a status badge and a list of developer notes.
