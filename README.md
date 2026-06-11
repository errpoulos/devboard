# DevBoard

*A unified customer lifecycle platform — CRM, Helpdesk, and Engineering on a shared database.*

---

## The Problem

Modern SaaS teams run on a stack of disconnected tools. Sales closes a deal in one system, support answers questions in another, and engineering tracks bugs in a third. Every handoff between those tools requires someone to manually copy context — paste a customer email into a ticket, describe the bug in a Slack message, link a Jira card in a reply. That context transfer is slow, lossy, and entirely optional. In practice, it rarely happens.

The result is that your support team talks to angry customers without knowing they were promised a specific feature during the sales cycle. Your developers fix bugs without knowing which customer opened the original ticket, or how critical that customer is to the business. When a customer churns, no one can trace the chain of events that led there because the records are scattered across three platforms that have never spoken to each other.

DevBoard solves this by collapsing CRM, Helpdesk, and engineering task management onto a single MySQL database. There is no sync job, no webhook pipeline, no eventual consistency to reason about. A sales note written in the CRM is readable in the Helpdesk agent sidebar the moment the customer opens a ticket. A bug report triggers a DevBoard task by a direct database insert. A developer comment on that task surfaces in the agent sidebar under Developer Notes. The entire customer lifecycle — from first sales contact to resolved support ticket to shipped fix — is navigable from any app in the platform.

---

## Platform

| App | Role | Frontend | Backend API |
|---|---|---|---|
| **DevBoard** | Kanban task management with real-time collaboration | http://localhost:5173 | http://localhost:8000 |
| **Helpdesk** | Support ticket system for agents and customers | http://localhost:5174 | http://localhost:8001 |
| **CRM** | Sales pipeline: companies, contacts, deals | http://localhost:5175 | http://localhost:8002 |
| **Admin** | Super-admin panel for organizations and plans | http://localhost:5176 | http://localhost:8003 |

All four apps share one MySQL database. Redis and Meilisearch are also shared services.

---

## How It Connects

```
  CRM                   Helpdesk              DevBoard
  ───                   ────────              ────────
  Sales rep creates      Customer opens        Developer works
  a contact              a ticket              a task
       │                      │                    │
       │  client_notes         │  devboard_task_id  │
       │  category=sales       │  (FK → tasks)      │
       └──────────────────────►│                    │
                               │◄───────────────────┘
                    Agent sidebar shows:     Ticket sidebar shows:
                    - Sales notes from CRM   - Kanban column status
                    - DevBoard task status   - Developer comments
                    - Support history
```

- **Sales notes travel to support.** Notes written on a contact in the CRM are stored in the shared `client_notes` table with `category = 'sales'`. When that contact opens a helpdesk ticket, the agent sidebar queries the same table and surfaces those notes — no copy-paste, no integration setup.

- **Bug reports become engineering tasks automatically.** When an agent classifies a ticket as `bug_report` or `feature_request`, the `DevboardBridge` service inserts a task directly into the DevBoard `tasks` table, targeting the correct board by name ("Bug Reports" / "Feature Requests"). The ticket stores the resulting `devboard_task_id` as a foreign key.

- **Engineering status flows back to support.** The ticket detail page reads the linked DevBoard task's current kanban column and displays it in the agent sidebar. A developer moving a card to "In Progress" is immediately visible to the support agent without any polling or messaging overhead.

- **Developer comments appear in the ticket thread.** The `DevboardBridge` exposes comments on the linked task. The helpdesk ticket sidebar renders those comments as "Developer Notes", tagged with a wrench icon to distinguish them from internal support notes.

---

## Features

### DevBoard (Kanban)
- Workspaces with member invitation and role management (owner / member)
- Multiple boards per workspace; boards have fully customizable columns
- Drag-and-drop task reordering within and across columns via `@dnd-kit`
- Optimistic UI updates with rollback on error
- Real-time board updates via Laravel Reverb WebSockets — moves made by one user appear instantly for others
- Task detail modal: rich description, assignee, priority, due date, story points, file attachments
- Inline comments with delete support
- `TaskStatusLog` table tracks time spent per column for cycle-time reporting
- CSV import for bulk task creation
- Dashboard with per-workspace summary stats

### Helpdesk
- Dual-role authentication: `agent` and `customer` accounts
- Customer self-registration; agents created via team management panel
- Ticket lifecycle: open → in_progress → resolved → closed, with priority (low / medium / high / urgent)
- Ticket types: `support_request`, `bug_report`, `feature_request`
- Private notes on ticket replies, visible only to agents
- File attachment upload and download per ticket
- Agent assignment dropdown; customers cannot see agent-only controls
- Agent sidebar: customer info, per-customer support and sales notes, org-level notes, linked DevBoard task status and developer comments
- CRM deal summary for the customer visible directly in the ticket view

### CRM
- Companies and contacts with detail pages
- Kanban-style deal pipeline with configurable stages (Lead / Qualified / Proposal / Won / Lost)
- Drag-and-drop deal cards between pipeline stages
- Deal value tracking with per-stage totals
- Sales notes on contacts and companies (stored in shared `client_notes` table, visible in Helpdesk)
- User management panel for org admins

### Admin
- Super-admin only access via `is_super_admin` flag and `EnsureSuperAdmin` middleware
- Organization table: paginated list of all tenants with inline plan and status editing
- Plan management: free / pro / enterprise
- Status management: trial / active / suspended
- Organization detail page with member list and per-user management
- User list with role and status controls

---

## Tech Stack

### Backend

| Concern | Tool |
|---|---|
| Framework | Laravel 11 |
| Authentication | Laravel Sanctum (SPA cookie auth) |
| Real-time / WebSockets | Laravel Reverb + Laravel Echo |
| Background jobs | Laravel Horizon + Redis queues |
| Full-text search | Laravel Scout + Meilisearch |
| Feature flags | Laravel Pennant |
| Dev debugging | Laravel Telescope |
| Monitoring | Laravel Pulse |
| Testing | Pest + PHPUnit |
| Code style | Laravel Pint |
| Database | MySQL 8 |
| Cache / queues | Redis 7 |
| Local environment | Laravel Sail (Docker Compose) |

### Frontend

| Concern | Tool |
|---|---|
| Framework | React 19 |
| Build tool | Vite |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Client / UI state | Zustand |
| WebSockets | Laravel Echo + pusher-js |
| Forms and validation | React Hook Form + Zod |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Testing | Vitest + React Testing Library |
| HTTP client | Axios (with CSRF support) |

---

## Architecture

The backend follows a strict layered pattern: thin controllers delegate to **Services** that own all business logic, passing data via **DTOs** (readonly PHP classes). Every resource action is gated by a **Policy**. Every endpoint returns an **API Resource** — never a raw Eloquent model.

The cross-app integration relies on a **shared MySQL database** rather than HTTP calls or event buses between apps. Each sub-app holds thin Eloquent model wrappers that point at tables owned by another app (e.g., `DevboardTask` in the helpdesk app sets `$table = 'tasks'` and is used read-write by `DevboardBridge`). This approach eliminates network latency, async consistency problems, and the operational overhead of maintaining internal API contracts.

Tenant isolation is enforced via `organization_id` on every record. The `WorkspaceScope` global Eloquent scope automatically filters all workspace-scoped models by `app('current.workspace')`, which is injected by `SetCurrentWorkspace` middleware on protected routes.

Side effects (notifications, activity logs) are dispatched as Laravel Events and handled by queued Listeners (`ShouldQueue`), keeping the HTTP cycle fast. Horizon manages all workers.

For a deeper technical reference, see [docs/architecture.md](docs/architecture.md).

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Composer
- Node.js 22+

### Setup

**1. Clone the repository**

```bash
git clone <repo-url>
cd devboard
```

**2. Install backend dependencies**

```bash
composer install
```

**3. Configure the core app environment**

```bash
cp .env.example .env
```

Edit `.env` to set your database credentials and Reverb/Meilisearch config. The defaults work with Sail out of the box.

**4. Configure sub-app environments**

```bash
for APP in helpdesk crm admin; do
  cp apps/$APP/.env.example apps/$APP/.env
done
```

Each sub-app `.env` must point at the same `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` as the core app.

**5. Start all services**

```bash
./vendor/bin/sail up -d
```

This starts the core Laravel app, all three sub-apps, Horizon workers, Reverb WebSocket server, Node frontends, MySQL, Redis, and Meilisearch.

**6. Generate keys and run migrations**

```bash
# Core app
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed

# Sub-apps
for APP in helpdesk crm admin; do
  docker compose exec $APP php artisan key:generate
  docker compose exec $APP php artisan migrate
done

# Seed default DevBoard boards and workspace
./vendor/bin/sail artisan app:ensure-devboard-defaults
```

**7. Access the platform**

| App | URL | Email | Password | Notes |
|---|---|---|---|---|
| DevBoard | http://localhost:5173 | admin@devboard.test | password | Seeded workspace with 20 tasks across 4 columns |
| Helpdesk | http://localhost:5174 | admin@devboard.test | password | Agent role — full sidebar and controls visible |
| CRM | http://localhost:5175 | admin@devboard.test | password | Create a Company → Contact → write a Sales Note to see the Helpdesk integration |
| Admin | http://localhost:5176 | superadmin@platform.test | password | Super-admin only |

---

## Using the Platform

The following walkthrough traces a complete customer lifecycle through all four apps.

1. **Register a customer account in the Helpdesk** (http://localhost:5174). Use any email — for example `alice@acmecorp.test`. Submit a ticket about an uptime issue.

2. **Open the CRM** (http://localhost:5175) as the sales rep (`admin@devboard.test`). Navigate to Contacts and create a new contact for Alice using the **same email** (`alice@acmecorp.test`). Write a sales note on her detail page: *"Interested in enterprise plan, concerned about uptime SLAs."* Because a helpdesk user with that email already exists, the note is stored with `subject_user_id` linking it directly to Alice's account.

3. **The agent sees the sales context.** Log in to the Helpdesk as the agent (`admin@devboard.test`) and open Alice's ticket. The right-hand agent sidebar shows a "Client Notes" section. The sales note written in the CRM is already there, under the "Sales" tab — no integration config, no copy-paste.

4. **The agent classifies the ticket.** In the "Ticket Settings" panel, change the ticket type from "Support Request" to "Bug Report". The `TicketService` detects the type change and calls `DevboardBridge::createTask()`, which inserts a task into the DevBoard `tasks` table, targeting the "Bug Reports" board.

5. **Open DevBoard** (http://localhost:5173). Navigate to the default workspace and the Bug Reports board. The new card is there, with the ticket subject as its title. The card shows an `HD #N` reference linking it back to the originating ticket.

6. **The developer moves the card.** Drag the task from "Backlog" to "In Progress". Any other users viewing the same board see the move in real time via the Reverb WebSocket channel.

7. **Support sees the update.** Return to the ticket in the Helpdesk. The agent sidebar now shows a "DevBoard Task #N" panel with the current column — "In Progress". If the developer adds a comment on the task, it appears here under "Developer Notes".

---

## Development

### Running tests

```bash
# Backend (Pest)
./vendor/bin/sail pest

# Individual sub-app
docker compose exec helpdesk ./vendor/bin/pest

# Frontend (Vitest)
cd frontend && npm run test
cd apps/helpdesk/frontend && npm run test
cd apps/crm/frontend && npm run test
cd apps/admin/frontend && npm run test
```

### Linting

```bash
# PHP (Pint)
./vendor/bin/pint

# Frontend (ESLint + Prettier)
cd frontend && npm run lint
```

### Artisan scaffold commands

```bash
php artisan make:request StoreTaskRequest
php artisan make:resource TaskResource
php artisan make:policy TaskPolicy --model=Task
php artisan make:event TaskCreated
php artisan make:listener HandleTaskCreated --event=TaskCreated
php artisan make:job ProcessAttachment
```

### Useful runtime commands

```bash
# Check Horizon worker status
./vendor/bin/sail artisan horizon:status

# Restart Reverb after config changes
./vendor/bin/sail artisan reverb:restart

# Re-seed DevBoard default boards
./vendor/bin/sail artisan app:ensure-devboard-defaults
```

---

## Project Structure

```
devboard/
├── app/                  # Core DevBoard Laravel app
│   ├── DTOs/             # Readonly data transfer objects
│   ├── Events/           # Domain events (TaskCreated, TaskMoved, etc.)
│   ├── Http/
│   │   ├── Controllers/  # Thin orchestrators only
│   │   ├── Requests/     # Form request validation
│   │   └── Resources/    # API response shaping
│   ├── Models/
│   │   ├── Scopes/       # WorkspaceScope global Eloquent scope
│   │   └── Traits/       # BelongsToWorkspace trait
│   ├── Policies/         # Authorization (one per model)
│   └── Services/         # All business logic
├── apps/
│   ├── helpdesk/         # Helpdesk sub-app (own Laravel instance)
│   │   └── app/
│   │       ├── Models/Devboard/  # Thin wrappers pointing at DevBoard tables
│   │       └── Services/DevboardBridge.php
│   ├── crm/              # CRM sub-app
│   └── admin/            # Admin super-panel sub-app
├── database/
│   ├── migrations/       # All core schema migrations
│   ├── factories/        # Model factories for testing
│   └── seeders/          # Demo data seeders
├── frontend/             # DevBoard React app (Vite)
│   └── src/
│       ├── features/     # Feature-scoped components, hooks, api
│       ├── pages/        # Route-level components
│       ├── store/        # Zustand slices
│       └── types/        # TypeScript interfaces
├── routes/
│   └── api.php           # Versioned API routes (/api/v1/...)
├── docker-compose.yml    # Full platform: all apps, MySQL, Redis, Meilisearch
└── docs/                 # Technical reference documentation
    ├── architecture.md
    └── apps/
        ├── devboard.md
        ├── helpdesk.md
        ├── crm.md
        └── admin.md
```
