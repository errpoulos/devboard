# DevBoard

A Kanban-style team task board built with Laravel 11 and React 19. Organize work across workspaces, boards, and columns with real-time drag-and-drop collaboration.

## Features

- **Workspaces** — Isolated environments for teams; create, edit, and delete workspaces
- **Boards** — Multiple boards per workspace, each auto-created with To Do / In Progress / Done columns
- **Kanban** — Drag-and-drop tasks between columns with optimistic UI updates
- **Real-time** — Live task movement and updates via Laravel Reverb WebSockets
- **Member management** — Invite members by email, assign roles (owner, admin, member)
- **Background jobs** — Queue-backed notifications and email via Laravel Horizon + Redis
- **Full-text search** — Task and board search powered by Meilisearch + Laravel Scout

## Tech Stack

### Backend
| Concern | Tool |
|---|---|
| Framework | Laravel 11 |
| Auth | Laravel Sanctum (SPA cookie auth) |
| WebSockets | Laravel Reverb + Laravel Echo |
| Queues | Laravel Horizon (Redis driver) |
| Search | Laravel Scout + Meilisearch |
| Feature flags | Laravel Pennant |
| Debugging | Laravel Telescope (dev only) |
| Monitoring | Laravel Pulse |
| Testing | Pest + PHPUnit |
| Code style | Laravel Pint |
| Database | MySQL 8 + Redis 7 |
| Environment | Laravel Sail (Docker Compose) |

### Frontend
| Concern | Tool |
|---|---|
| Framework | React 19 |
| Build | Vite |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| WebSockets | Laravel Echo + pusher-js |
| Forms | React Hook Form + Zod |
| Drag and drop | @dnd-kit/core |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Testing | Vitest + React Testing Library |
| HTTP | Axios (CSRF-configured) |

---

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Composer](https://getcomposer.org/) (for installing Sail before Docker takes over)
- Node.js 22+ (only needed if running the frontend outside Docker)

---

## Installation

### 1. Clone and install PHP dependencies

```bash
git clone <repo-url> devboard
cd devboard
composer install --no-scripts
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```dotenv
APP_KEY=          # filled by artisan key:generate below
DB_HOST=mysql     # matches the Sail service name
REDIS_HOST=redis  # matches the Sail service name
```

The defaults in `.env.example` work out of the box with Sail — you only need to change values for external services (mail, etc.).

### 3. Start all services with Sail

```bash
./vendor/bin/sail up -d
```

This starts: Laravel app (port 8000), MySQL (port 3307), Redis, Meilisearch (port 7700), Reverb WebSocket server (port 8080), Horizon queue worker, and the Vite frontend dev server (port 5173).

### 4. Generate app key and migrate

```bash
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
```

The seeder creates a demo user:
- **Email:** `test@example.com`
- **Password:** `password`

### 5. Open the app

Visit [http://localhost:5173](http://localhost:5173) and log in.

---

## Running Without Docker (manual setup)

If you prefer not to use Sail:

```bash
# Backend
php artisan key:generate
php artisan migrate --seed
php artisan serve          # http://localhost:8000
php artisan reverb:start --debug &
php artisan horizon &

# Frontend
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Ensure MySQL, Redis, and Meilisearch are running locally and that `.env` points to them.

---

## Environment Variables

Key variables beyond standard Laravel defaults:

```dotenv
# Sanctum — must include the frontend origin
SANCTUM_STATEFUL_DOMAINS=localhost:5173

# Reverb WebSocket server
REVERB_APP_ID=devboard-local
REVERB_APP_KEY=devboard-key
REVERB_APP_SECRET=devboard-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

# Meilisearch
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_KEY=

# Queue
QUEUE_CONNECTION=redis

# Vite (must match Reverb values above)
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
VITE_API_BASE_URL=http://localhost/api/v1
```

---

## Running Tests

### Backend (Pest)

```bash
./vendor/bin/sail pest
```

Feature tests live in `tests/Feature/Api/V1/`, unit tests in `tests/Unit/Services/`.

### Frontend (Vitest)

```bash
cd frontend && npm run test
```

Tests live alongside the code they test (e.g., `features/tasks/TaskCard.test.tsx`).

### Code style

```bash
./vendor/bin/sail pint          # fix PHP style
cd frontend && npm run lint     # ESLint + Prettier
```

---

## API Overview

All endpoints are versioned under `/api/v1/` and require Sanctum cookie auth (except login).

| Group | Routes |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Workspaces | `GET/POST /workspaces`, `GET/PATCH/DELETE /workspaces/{workspace}` |
| Members | `GET /workspaces/{workspace}/members`, `POST …/invite`, `DELETE …/{member}` |
| Boards | `GET/POST /workspaces/{workspace}/boards`, `GET/DELETE …/{board}` |
| Columns | `POST /workspaces/{workspace}/boards/{board}/columns/reorder` |
| Tasks | Full CRUD + reorder under `/workspaces/{workspace}/boards/{board}/tasks` |
| Comments | `GET/POST/DELETE` under `/workspaces/{workspace}/boards/{board}/tasks/{task}/comments` |

---

## Architecture

DevBoard follows a strict layered architecture: thin controllers delegate to service classes, data moves between layers via readonly DTOs, all authorization goes through Laravel Policies, and every API response is wrapped in an API Resource. Side effects (notifications, activity logs) are handled by queued event listeners to keep the HTTP cycle fast. See [CLAUDE.md](CLAUDE.md) for the full architecture reference and coding conventions.
