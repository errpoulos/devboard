# Admin App Reference

## Purpose and Audience

The Admin app is a super-admin control panel for managing the entire platform. It is used exclusively by platform operators — people who run the DevBoard SaaS itself, not individual organization members. From here, operators can view all tenant organizations, change their billing plan and status, drill into their member lists, and hard-delete organizations.

No regular user — not even an org-level admin — can access the Admin app. Access is gated by `users.is_super_admin = true`.

**Primary audience:** platform operators and internal DevBoard staff.

---

## Local Access

- Frontend: http://localhost:5176
- Backend API: http://localhost:8003
- Super-admin credentials: `superadmin@platform.test` / `password`

---

## Key Pages and Routes

### `/login`
The Admin app has its own isolated login page and Sanctum session domain. Super-admin credentials are not the same as the demo user credentials used in other apps. Logging in with a non-super-admin account results in a 403 from `EnsureSuperAdmin` middleware on the first protected request.

### `/orgs`
Paginated organization list — the main working screen. Displays all organizations sorted alphabetically with the following columns:

- **Organization** — name and slug
- **Plan** — inline `<select>` with options `free`, `pro`, `enterprise`. Changing the value fires a `PATCH /organizations/:id` request immediately via `useUpdateOrg`. Color-coded badges (gray / blue / purple) indicate the current plan.
- **Status** — inline `<select>` with options `trial`, `active`, `suspended`. Color-coded badges (yellow / green / red). Changing to `suspended` should be used to block access for delinquent organizations.
- **Users** — count of members in the organization.
- **Created** — creation date.
- **Actions** — a "Manage" button linking to the detail page, and a "Delete" button that opens a confirmation dialog.

Pagination is standard (25 per page) with Previous / Next controls.

### `/orgs/:id`
Organization detail page. Shows extended information about a single organization including its full member list with user-level management controls (edit role, suspend, delete). This is the appropriate place to investigate a specific tenant's account or resolve a support escalation.

---

## Access Control

The `EnsureSuperAdmin` middleware is applied to every protected route in the Admin app:

```php
// app/Http/Middleware/EnsureSuperAdmin.php
if (!$request->user() || $request->user()->is_super_admin !== true) {
    abort(403, 'Super-admin access required.');
}
```

This check is enforced at the HTTP middleware level, before any controller runs. The `is_super_admin` field lives on the shared `users` table and is set to `false` by default. It can only be set to `true` directly in the database or through a manual Artisan call — there is no self-serve elevation path.

The admin frontend's `authStore` stores the authenticated user after login. The `App.tsx` root component checks `user.is_super_admin` and redirects to `/login` if the flag is not set, providing a client-side guard in addition to the server-side middleware.

---

## Notable Technical Features

### Inline plan and status editing

The organization table uses inline `<select>` elements rather than a separate edit page for plan and status changes. `useUpdateOrg` (a TanStack Query mutation) fires on every `onChange` event with a `PATCH` to the backend. The `OrganizationController::update()` endpoint validates against an allowlist of values:

```php
$validated = $request->validate([
    'plan'   => ['sometimes', 'string', 'in:free,pro,enterprise'],
    'status' => ['sometimes', 'string', 'in:trial,active,suspended'],
]);
```

This pattern means plan changes take effect immediately with no confirm step. The mutation's `isPending` state disables the select while the request is in flight to prevent double submission.

### Delete with confirmation dialog

Clicking "Delete" on an organization row opens a `DeleteDialog` modal component that renders over the table with a dark overlay. The dialog displays the organization name and warns that the action cannot be undone. Clicking "Delete" in the dialog calls `useDeleteOrg`, which fires `DELETE /organizations/:id` and on success removes the row from the TanStack Query cache via `queryClient.invalidateQueries`.

The `OrganizationController::destroy()` method delegates to Eloquent's `$organization->delete()`. Cascading deletes for users and workspaces are the responsibility of foreign key constraints or model observers defined in the core app's schema.

### Loading skeletons

The organizations table uses `TableRowSkeleton` (from `components/Skeleton.tsx`) during the initial load. The skeleton renders placeholder rows with animated pulse effects at the same column widths as the real data, avoiding layout shift when the data arrives.

### Pagination

Standard Laravel `paginate(25)` is used. The `OrganizationResource` collection wraps the paginator, which Laravel automatically serializes with `meta.current_page`, `meta.last_page`, and `meta.total`. The frontend uses these to render the pagination controls and disable the Previous/Next buttons at the boundaries.

---

## API Routes Summary

All routes require Sanctum authentication and `EnsureSuperAdmin` middleware except `POST /auth/login`.

```
POST   /auth/login
POST   /auth/logout
GET    /auth/me

GET    /organizations                -- paginated list
GET    /organizations/:id            -- detail with user list
PATCH  /organizations/:id            -- update plan / status
DELETE /organizations/:id

GET    /users                        -- all users across all orgs
PATCH  /users/:id                    -- update role / status
DELETE /users/:id
```
