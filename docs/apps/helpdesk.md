# Helpdesk App Reference

## Purpose and Audience

The Helpdesk handles customer support tickets. It serves two distinct user types on the same codebase: customers who submit and track their own tickets, and agents who triage, respond to, and close tickets on behalf of the organization.

The Helpdesk is also the integration hub of the platform. It reads sales notes from the CRM's shared `client_notes` records, creates engineering tasks in DevBoard when tickets are classified as bugs or feature requests, and surfaces DevBoard task status and developer comments back to agents — all through the shared database.

**Primary audience:** support agents (internal) and end customers (external).

---

## Local Access

- Frontend: http://localhost:5174
- Backend API: http://localhost:8001
- Agent credentials: `admin@devboard.test` / `password`
- Customer registration: http://localhost:5174/register (self-service)

---

## Key Pages and Routes

### `/login` and `/register`
Standard login page for both agents and customers. The `/register` route is customer-only self-registration (`RegistrationController::store`). New customers are assigned `role = 'customer'` and associated with the organization. Agent accounts are created by admins through the team management panel, not via self-registration.

### `/tickets`
The ticket list. The view rendered depends on the user's role:

- **Customers** see only their own tickets, with status badges and a "New Ticket" button.
- **Agents** see all tickets across the organization, with filter/sort controls and an assignment column.

### `/tickets/new`
The new ticket submission form. Customers select a subject, description, priority, and type. On submission, `TicketService::create()` handles the creation. If the ticket type is `bug_report` or `feature_request`, the service immediately calls `DevboardBridge::createTask()` to insert a corresponding task into DevBoard.

### `/tickets/:id`
The ticket detail page. This is the most complex page in the Helpdesk:

**Left column (main thread):**
- Ticket subject, description, type badge, status selector, priority selector
- Threaded replies with timestamps and author names
- Private note replies render with a gold "Private" badge; customers cannot see them and cannot submit private notes
- File attachment upload area (drag-and-drop or file picker); agents can delete attachments
- Reply form with a "Mark Private" toggle (agents only)

**Right column (agent sidebar, agents only):**
- Ticket Settings: type selector and agent assignment dropdown. Changing the type to `bug_report` or `feature_request` triggers DevBoard task creation if one doesn't exist yet.
- Customer info: name and email of the ticket submitter.
- Client Notes: tabbed panel showing support notes (written by agents) and sales notes (written from the CRM). Both tabs read from `client_notes` filtered by `subject_user_id = ticket.user_id`.
- Org Notes: notes scoped to the customer's organization (`organization_id`), visible for any ticket from that org.
- DevBoard Task panel: if `ticket.devboard_task_id` is set, the sidebar shows the task ID, current kanban column (with a color-coded status badge), and any developer comments from the DevBoard task thread.

### `/customers`
Agent-only customer list. Shows all users with `role = 'customer'` in the organization. Links to customer detail pages.

### `/customers/:id`
Customer detail page. Shows the customer's profile, their ticket history, and their full notes panel. Agents can write new support or org-level notes directly from this page. Also surfaces a CRM deal summary via `CustomerController::crmSummary()`.

### `/settings`
Team management for admin-role agents. Provides the agent list with role and status management, and an "Invite Agent" form that creates new agent accounts.

---

## Role and Permission Model

Roles are stored in `users.role` as an enum:

| Role | Capabilities |
|---|---|
| `customer` | Submit tickets, view and reply to own tickets, upload attachments to own tickets |
| `agent` | View all tickets, assign tickets, set type, write private notes, manage attachments, view agent sidebar, access customer list |
| `admin` | All agent capabilities plus team management (create/update/delete agent accounts) |

`TicketPolicy` enforces view and mutation permissions. Customers who attempt to view tickets they do not own receive a 403. The `reply` action checks the role to strip `is_private = true` from any customer-submitted reply body (customers cannot mark notes private regardless of what they send).

There is no separate super-admin role in the Helpdesk. The `is_super_admin` flag lives on the shared `users` table but is only checked by the Admin app's middleware.

---

## Notable Technical Features

### DevboardBridge integration

The `DevboardBridge` service (`app/Services/DevboardBridge.php`) uses Eloquent model wrappers (`DevboardTask`, `DevboardBoard`, `DevboardBoardColumn`, `DevboardWorkspace`, `DevboardComment`) that point at DevBoard's tables. All are in `app/Models/Devboard/`. The bridge is injected into `TicketService` via constructor injection.

Task creation is triggered in two places in `TicketService`:
1. On `create()`, if `$data->type` is `bug_report` or `feature_request`.
2. On `update()`, if the type changes to one of those values and no `devboard_task_id` already exists.

This prevents duplicate task creation on repeated updates.

### Shared `client_notes` table

The `ClientNote` model in the Helpdesk points at the same `client_notes` table as the CRM. The Helpdesk reads notes with `category = 'sales'` (written by CRM) and writes notes with `category = 'support'`. Both categories are surfaced in the agent sidebar's Notes panel — the UI uses a tabbed interface to separate them without any backend filtering.

### Private notes

`ticket_replies.is_private` is a boolean. The `TicketResource` conditionally excludes private replies when the requesting user is a customer:

```php
'replies' => $this->whenLoaded('replies', fn() =>
    TicketReplyResource::collection(
        $this->replies->filter(fn($r) => !$r->is_private || $user->isAgent())
    )
),
```

The frontend reply form toggles an `isPrivateNote` state flag; the agent sees the gold "Private" styling before submitting. After submission, the reply appears with the gold badge in the thread for agents and is invisible to the customer.

### File attachments

`TicketAttachmentController` handles upload and download. Files are stored in the `storage/app/private/ticket-attachments/` directory and served through a signed download URL. Agents can delete any attachment; customers can delete only their own. The `FileUploadArea` React component handles drag-and-drop and previews file names before upload.

### CRM summary endpoint

`GET /api/v1/users/:userId/crm-summary` returns the customer's active deals from the CRM's `deals` table, scoped by `organization_id`. This endpoint is read-only and does not modify any CRM data. It gives the helpdesk agent immediate visibility into deal value and stage without navigating to a separate application.

---

## API Routes Summary

All routes require Sanctum authentication except `POST /auth/login` and `POST /auth/register`.

```
POST   /auth/login
POST   /auth/register
POST   /auth/logout
GET    /auth/me

GET    /tickets
POST   /tickets
GET    /tickets/:id
PATCH  /tickets/:id
DELETE /tickets/:id

GET    /tickets/:id/replies
POST   /tickets/:id/replies

GET    /tickets/:id/attachments
POST   /tickets/:id/attachments
GET    /tickets/:id/attachments/:attId/download
DELETE /tickets/:id/attachments/:attId

GET    /users/:userId/notes          -- agent only
POST   /users/:userId/notes          -- agent only
GET    /orgs/:orgId/notes            -- agent only
POST   /orgs/:orgId/notes            -- agent only
PATCH  /notes/:noteId
DELETE /notes/:noteId

GET    /agents                       -- agent only
GET    /customers                    -- agent only
GET    /customers/:userId            -- agent only
GET    /users/:userId/crm-summary    -- agent only
GET    /users/:userId

GET    /team                         -- admin only
POST   /team
PATCH  /team/:userId
DELETE /team/:userId
```
