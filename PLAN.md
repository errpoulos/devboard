# DevBoard — SaaS Platform: Plan & Current State

> Written 2026-05-23. Pick this up in any terminal session.

---

## What This Is

DevBoard started as a single-tenant Kanban app (Laravel 11 + React 19). It is being transformed into a **multi-app SaaS platform** sharing a single MySQL database. Four apps total:

| App | Backend port | Frontend port | Purpose |
|---|---|---|---|
| **devboard** (core) | 8000 | 5173 | Kanban boards / task management |
| **helpdesk** | 8001 | 5174 | Support ticket system |
| **crm** | 8002 | 5175 | Contacts, companies, deals pipeline |
| **admin** | 8003 | 5176 | Super-admin panel (org + user mgmt) |

All four apps authenticate against the same `users` table in the shared `devboard` MySQL database. Each app is a standalone Laravel 11 app under `apps/<name>/` with its own `composer.json`, routes, models, and a React 19 frontend under `apps/<name>/frontend/`.

---

## Shared Data Model

The core schema lives in the main DevBoard migrations and is run once:

```
organizations       id, name, slug, plan, status
users               + organization_id (FK → organizations), + is_super_admin
workspaces          + organization_id (FK → organizations)
```

Migrations added (staged, not yet committed):
- `2026_05_23_000001_create_organizations_table.php`
- `2026_05_23_000002_add_organization_fields_to_users_table.php`
- `2026_05_23_000003_add_organization_id_to_workspaces_table.php`

Helpdesk-specific migrations (in `apps/helpdesk/database/migrations/`):
- `create_tickets_table` — id, org_id, user_id, subject, status, priority
- `create_ticket_replies_table` — id, ticket_id, user_id, body

CRM-specific migrations (in `apps/crm/database/migrations/`):
- `create_crm_companies_table`
- `create_crm_contacts_table`
- `create_crm_pipeline_stages_table`
- `create_crm_deals_table`

Admin has **no extra migrations** — it only reads `organizations` and `users`.

---

## What Is Done (staged, not committed)

### Core DevBoard app
- [x] `Organization` model + `OrganizationResource`
- [x] `User` model updated — `organization_id`, `is_super_admin`
- [x] `Workspace` model updated — `organization_id`
- [x] `WorkspaceController`, `WorkspaceService`, `WorkspacePolicy` updated for org-scoping
- [x] `DatabaseSeeder` — creates Acme Corp org, superadmin user, seeds org-scoped workspace

### Helpdesk app (`apps/helpdesk/`)
- [x] Full Laravel 11 scaffold (bootstrap, providers, routes)
- [x] Models: `Ticket`, `TicketReply`, `User`, `Organization`
- [x] DTOs: `StoreTicketDTO`, `UpdateTicketDTO`, `StoreTicketReplyDTO`
- [x] `TicketService`, `TicketPolicy`
- [x] Controllers: `AuthController`, `TicketController`, `TicketReplyController`
- [x] API Resources: `TicketResource`, `TicketReplyResource`, `UserResource`
- [x] Routes: login, tickets CRUD, reply store
- [x] Frontend pages: `LoginPage`, `TicketsPage`, `TicketDetailPage`, `NewTicketPage`
- [x] Frontend components: `PriorityBadge`, `TicketStatusBadge`
- [x] Zustand auth store, Axios instance, TanStack Query hooks

### CRM app (`apps/crm/`)
- [x] Full Laravel 11 scaffold
- [x] Models: `Company`, `Contact`, `Deal`, `PipelineStage`, `User`, `Organization`
- [x] `CrmService`
- [x] Controllers: `AuthController`, `CompanyController`, `ContactController`, `DealController`, `PipelineController`
- [x] API Resources for all entities
- [x] Routes: login, contacts/companies/deals CRUD, pipeline stages
- [x] Frontend pages: `LoginPage`, `ContactsPage`, `CompaniesPage`, `PipelinePage`
- [x] Zustand auth store, Axios instance, TanStack Query hooks

### Admin app (`apps/admin/`)
- [x] Full Laravel 11 scaffold
- [x] Models: `Organization`, `User`
- [x] `EnsureSuperAdmin` middleware (checks `is_super_admin` on authenticated user)
- [x] Controllers: `AuthController`, `OrganizationController`, `UserController`
- [x] API Resources: `OrganizationResource`, `UserResource`
- [x] Routes: login; then `auth:sanctum + super_admin` guard on all admin routes
- [x] Frontend pages: `LoginPage`, `OrgsPage`, `OrgDetailPage`
- [x] Zustand auth store, Axios instance, TanStack Query hooks

### Docker
- [x] `docker-compose.yml` extended with services: `helpdesk`, `helpdesk-frontend`, `crm`, `crm-frontend`, `admin`, `admin-frontend`

---

## What Is NOT Done Yet

### Immediate (must-have before first run)

- [ ] **Commit the staged changes** — 137 files are staged. Commit is blocked by a signing server infrastructure issue in the remote container (`code-sign` returns 400 "missing source"). Commit locally or in a fresh session.

- [ ] **`apps/*/config/` directories are empty** — each sub-app needs at minimum `config/auth.php` (Sanctum guard), `config/database.php`, and `config/sanctum.php`. Without these the apps won't boot. Copy from DevBoard core and strip down.

- [ ] **`apps/*/public/index.php` missing** — only helpdesk has one. CRM and Admin need `public/index.php` (the standard Laravel entry point).

- [ ] **`apps/*/storage/` scaffolding** — need `storage/logs/.gitkeep`, `storage/framework/{cache,sessions,views}/.gitkeep`, and `bootstrap/cache/.gitkeep` for each sub-app.

- [ ] **`.env` files** — each sub-app has `.env.example` but needs an actual `.env` copied and `APP_KEY` generated (`php artisan key:generate`) before it can run.

- [ ] **Migrations for sub-apps need a connection path** — the sub-app `AppServiceProvider`s need to point migrations at `apps/*/database/migrations/`. Currently only CRM and Helpdesk have migrations; they need to be run from within their respective app directories.

- [ ] **Admin app migrations** — the admin app has an empty `migrations/` folder. It needs none (reads shared tables), but the seeder must be confirmed to work: `superadmin@platform.test` / `password` is created by the main DevBoard seeder and is_super_admin=true.

### Frontend (scaffolded but incomplete)

- [ ] **CRM `PipelinePage`** — drag-and-drop kanban for deals is scaffolded but deal stage movement (PATCH `/deals/{deal}`) is not wired to dnd-kit yet.
- [ ] **Helpdesk `TicketDetailPage`** — reply form is present but optimistic update / scroll-to-bottom after reply is not implemented.
- [ ] **Admin `OrgDetailPage`** — lists users for an org but has no actions (suspend user, change plan) yet.
- [ ] **Navigation / routing** — each frontend has `App.tsx` with routes, but no shared navbar or breadcrumb between apps (intentional — they're separate apps).
- [ ] **Error boundaries and loading skeletons** — none of the sub-app frontends have these yet.

### Auth / multi-tenancy

- [ ] **Org-scope enforcement in CRM and Helpdesk** — controllers currently filter by `auth()->user()->organization_id` in the service layer but there are no automated tests verifying cross-org isolation. Write feature tests.
- [ ] **Shared session cookie domain** — if you want SSO across all four apps on `localhost`, all four `SANCTUM_STATEFUL_DOMAINS` must include each other's ports, OR use a subdomain strategy. Currently each app is fully isolated (separate logins).

### Testing

- [ ] No Pest feature tests written for any sub-app yet.
- [ ] No Vitest tests written for any sub-app frontend yet.

### Infrastructure / DevOps

- [ ] **Sail `runtimes/` or custom Dockerfile** for sub-apps — currently using the same `sail-8.4/app` image as DevBoard, which is fine for dev but the image must exist (built by `./vendor/bin/sail build` from the core app).
- [ ] **`horizon` and `reverb`** are core-app-only services. Helpdesk and CRM have `QUEUE_CONNECTION=redis` but no Horizon worker defined for them in docker-compose. Add dedicated horizon services or point them at the existing one.
- [ ] **Meilisearch** — CRM contacts/companies could benefit from Scout integration but it's not wired up.

---

## How to Continue Locally

### 1. Clone and commit

```bash
git clone <repo-url> devboard
cd devboard
# All 137 files are already staged in the remote container; push or export them.
git commit -m "feat: transform DevBoard into a multi-app SaaS platform

Adds Organization tenant model as the shared boundary. DevBoard workspaces
and users are now org-scoped. Three new standalone Laravel 11 + React 19
apps scaffolded under apps/: helpdesk, crm, and admin. All four apps share
the same MySQL database. docker-compose.yml extended to bring up all four
backends (8000-8003) and frontends (5173-5176).

https://claude.ai/code/session_01VKxFVUKpg4V3e7YRJhvJX2"
```

### 2. Bootstrap each sub-app

```bash
# Do this for helpdesk, crm, and admin
for app in helpdesk crm admin; do
  cp apps/$app/.env.example apps/$app/.env
  # Edit DB_HOST=127.0.0.1 if running outside Docker, or leave mysql for Sail
done
```

### 3. Start Docker and migrate

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed

# Then for each sub-app (from within its directory, or with --path flag)
docker compose exec helpdesk php artisan key:generate
docker compose exec helpdesk php artisan migrate
docker compose exec crm php artisan key:generate
docker compose exec crm php artisan migrate
# admin has no extra migrations
docker compose exec admin php artisan key:generate
```

### 4. Verify

- DevBoard: http://localhost:5173 — login `admin@devboard.test` / `password`
- Helpdesk: http://localhost:5174 — login with any org user
- CRM: http://localhost:5175 — login with any org user
- Admin: http://localhost:5176 — login `superadmin@platform.test` / `password`

---

## Suggested Next Steps (in priority order)

1. Fix the `apps/*/config/` gap — copy and trim `config/auth.php`, `config/database.php`, `config/sanctum.php` into each sub-app. Without this none of them boot.
2. Add `public/index.php` to CRM and Admin.
3. Run the stack end-to-end and fix boot errors.
4. Wire CRM pipeline drag-and-drop (dnd-kit → PATCH `/deals/{deal}`).
5. Add org-isolation Pest feature tests for CRM and Helpdesk.
6. Add Horizon workers for CRM and Helpdesk queues in docker-compose.
7. Add error boundaries and loading states to all three sub-app frontends.
