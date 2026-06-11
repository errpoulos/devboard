# CRM App Reference

## Purpose and Audience

The CRM manages the sales side of the customer lifecycle. Sales reps use it to track companies, contacts, and deals through a configurable pipeline. Notes written on contacts and companies are stored in the shared `client_notes` table and are immediately visible to helpdesk agents when those contacts open support tickets — no sync required.

**Primary audience:** sales reps and account managers.

---

## Local Access

- Frontend: http://localhost:5175
- Backend API: http://localhost:8002
- Demo credentials: `admin@devboard.test` / `password`

---

## Key Pages and Routes

### `/login`
Standard Sanctum SPA login. The CRM has its own Sanctum session domain, independent of other apps. Logging in here does not affect Helpdesk or DevBoard sessions.

### `/companies`
Paginated list of all companies in the organization. Each row links to the company detail page. An inline "New Company" form creates a company via `CompanyController::store()`.

### `/companies/:id`
Company detail page. Shows company fields and the list of contacts associated with that company. Agents can write org-level notes here (`category = 'sales'`, scoped to `organization_id`). Notes appear in the Helpdesk agent sidebar's "Org Notes" section for any ticket submitted by a user at that organization.

### `/contacts`
Paginated list of contacts. Each contact can be linked to a company. An inline creation form is available. Contacts are the bridge between the CRM and the Helpdesk — a contact's `subject_user_id` on their notes is matched to the ticket submitter's user ID in the Helpdesk.

### `/contacts/:id`
Contact detail page. Shows contact information, linked company, deal history, and a notes panel. Sales reps write notes here (`category = 'sales'`). When the note is saved, `ClientNoteController` looks up a row in the shared `users` table matching `contact.email`. If a match is found, `subject_user_id` is set to that user's ID, linking the note directly to their helpdesk account. If no match exists (the contact has not yet registered in the Helpdesk), `subject_user_id` is null and the note is treated as org-scoped. Notes are surfaced in the Helpdesk agent sidebar once the customer registers with the matching email.

### `/pipeline`
The sales pipeline board — a kanban view of deals across pipeline stages. This page uses the same `@dnd-kit` drag-and-drop stack as the DevBoard kanban.

- Stages are rendered as columns; deals are cards within each stage
- Dragging a deal card between stages calls `CrmService::moveDeal()`, which updates `pipeline_stage_id` and `position`
- Each stage column shows a deal count and the total value of all deals in that stage
- An "Add deal" button at the bottom of each column opens an inline form to create a new deal with title and optional value
- The `DragOverlay` renders a ghost card during dragging for visual feedback

### `/settings`
User management panel for CRM admins. Lists all users in the organization with role and status controls. Follows the same settings pattern used across the platform's admin-facing routes.

---

## Role and Permission Model

The CRM uses a simple model: any authenticated user belonging to the organization can access all CRM resources. There is no agent/customer split. The `ContactPolicy`, `CompanyPolicy`, and `DealPolicy` verify that the resource's `organization_id` matches the authenticated user's `organization_id` before allowing mutations.

The `EnsureOrganizationUser` concept is implicit in the service layer: `CrmService` always scopes queries with `where('organization_id', $user->organization_id)`, so users from different organizations cannot see each other's data even without explicit policy checks.

---

## Notable Technical Features

### Shared `client_notes` table

The `ClientNote` model in the CRM (`app/Models/ClientNote.php`) points at the same `client_notes` table used by the Helpdesk. Notes written in the CRM always use `category = 'sales'`. The CRM never reads `category = 'support'` notes.

Notes can be scoped two ways:
- **Contact-level notes:** `subject_user_id = <users.id matched by contact email>`, `organization_id = null`. These appear in the Helpdesk sidebar for the specific customer. If the contact's email does not match any row in `users`, the note falls back to org-scope.
- **Company-level notes:** `organization_id = company.organization_id`, `subject_user_id = null`. These appear in the Helpdesk sidebar's "Org Notes" section for any ticket from that organization.

The `ClientNoteController` in the CRM exposes separate endpoints for contact notes and company notes to make this distinction explicit at the API level.

### Pipeline stage seeding

`CrmService::seedDefaultStages()` seeds five default stages (Lead, Qualified, Proposal, Won, Lost) for a new organization if none exist. This is called during organization creation via the Admin app. The stages are ordered by `position` and are fully editable after creation.

### Deal position management

Deal `position` within a stage is maintained as an integer. When a new deal is created, `CrmService::createDeal()` sets its position to `max(position) + 1` for that stage. When a deal is moved via drag-and-drop, `moveDeal()` updates the `pipeline_stage_id` and `position` atomically. The frontend handles optimistic reordering within the drag overlay and fires the API call on `DragEndEvent`.

### Deal value tracking

Each deal has an optional `value` field (decimal). The `StageColumn` component in `PipelinePage.tsx` computes the total value per stage as `deals.reduce((sum, d) => sum + (d.value ?? 0), 0)` and renders it in green above the deal list. This gives an at-a-glance pipeline value view without a separate analytics endpoint.

---

## API Routes Summary

All routes require Sanctum authentication except `POST /auth/login`.

```
POST   /auth/login
POST   /auth/logout
GET    /auth/me

GET    /companies
POST   /companies
DELETE /companies/:id

GET    /contacts
POST   /contacts
DELETE /contacts/:id

GET    /pipeline               -- returns stages with nested deals

GET    /deals
POST   /deals
PATCH  /deals/:id
DELETE /deals/:id

GET    /contacts/:id/notes
POST   /contacts/:id/notes
GET    /companies/:id/notes
POST   /companies/:id/notes
PATCH  /notes/:id
DELETE /notes/:id

GET    /admin/users            -- org admin only
POST   /admin/users
PATCH  /admin/users/:id
DELETE /admin/users/:id
```
