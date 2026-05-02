# Netwrk Web UI — Implementation Plan

## Overview

A Next.js web app at `app.mynetwrk.com` providing the core Netwrk experience optimized for desktop browsers. Parallel implementation to the mobile app (no shared component packages); same backend API at `mynetwrk.com`.

---

## Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | SSR + file-based routing |
| UI components | shadcn/ui | Radix primitives + Tailwind |
| Styling | Tailwind CSS | Utility-first, co-located with shadcn |
| Server state | TanStack Query | Same pattern as mobile |
| HTTP client | Axios | Same as mobile; token via cookie |
| Auth token storage | `httpOnly` cookie | Set by backend on login; never readable by JS |
| Search/filter/sort state | URL query params | Bookmarkable; browser back works naturally |
| Ephemeral UI state | React `useState` | Modals, hover states, etc. |
| Maps | Google Maps JS API | Same API key already in use |
| Deployment | Vercel (free tier) | DNS: CNAME in Route53 → Vercel hostname |

---

## Pages & Routes

### `/login`
- Email + password form
- On success: backend sets `httpOnly` auth cookie; redirect to `/contacts`
- Link to `/register`
- Minimal layout, centered card

### `/register`
- Name, email, password fields
- On success: same cookie flow as login; redirect to `/contacts`
- Link to `/login`

### `/contacts` (primary page)
- **Left sidebar:** sort options, filter by tag, search input
- **Main area:** contact cards in a grid or list (toggle between views)
- Search is semantic (same backend endpoint); state lives in `?q=` URL param
- Sort lives in `?sort=` URL param; filter tags in `?tags=` URL param
- Each contact card shows: name, last contacted, next contact date, tags, location snippet
- Clicking a card opens the contact detail slide-over (see below)
- **Add Contact** button opens the Add Contact slide-over (see below)
- Post-launch: richer table view — sortable columns (Name, Last Contacted, Next Contact Date, Location, Tags), column visibility toggles, multi-select + bulk actions (delete, tag, export), inline cell editing. Built on TanStack Table + shadcn Data Table. **Do not implement at launch; full design pass needed first.**

### `/contacts` — Contact Detail Slide-over (Sheet)
- Opens from the right (~40% screen width) over the contacts list
- Displays all contact fields: name, location, how you met, notes, last contact date, planned contact frequency, tags, contact info pairs
- Edit mode toggled inline (pencil icon → editable fields → save)
- Delete button with confirmation dialog

### `/contacts` — Add Contact Slide-over (Sheet)
- Opens from the right, same width as detail sheet
- Form fields (all from mobile parity):
  - **Name** (required, text)
  - **Location** (text, geocoded on save)
  - **How you met** (text)
  - **Notes** (textarea)
  - **Last contact** (date picker)
  - **Planned contact frequency** (nullable select: weekly, biweekly, monthly, quarterly, etc.)
  - **Tags** (multi-select combobox, create-on-type)
  - **Contact info** (dynamic list of platform + value pairs; platform is a select: email, phone, Instagram, LinkedIn, Twitter, etc.; value is text)
- Save button → POST to backend → optimistic update via TanStack Query → sheet closes

### `/account`
- Display current user's name and email
- Change password form
- Log out button (clears cookie, redirects to `/login`)
- Delete account option with confirmation

### `/map`
- Full-viewport Google Maps embed
- Markers for contacts that have a location
- Clicking a marker opens a small info popup: name, last contacted, link to open contact detail sheet
- Same nearby-contacts logic as mobile (center on user's current location via browser geolocation API)
- Can be deferred to post-launch if needed; low implementation risk

---

## Auth Flow

1. User submits login form → `POST /auth/login` with email + password
2. Backend responds with `Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Lax`
3. All subsequent Axios requests are made with `withCredentials: true` so the cookie is sent automatically
4. On 401 response: clear local TanStack Query cache, redirect to `/login`
5. Logout: `POST /auth/logout` → backend clears cookie → client redirects to `/login`

---

## API Layer

- All API calls go through custom hooks (e.g. `useContacts`, `useCreateContact`, `useUpdateContact`)
- Base URL configured via env var: `NEXT_PUBLIC_API_URL=https://mynetwrk.com`
- Axios instance configured with `withCredentials: true`
- Query keys mirror the mobile app convention (defined in `constants/queryKeys.ts`)
- TanStack Query used for all server state: contacts list, contact detail, user profile

---

## Project Structure

```
web/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── contacts/page.tsx
│   │   ├── account/page.tsx
│   │   └── map/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                 # shadcn generated components
│   ├── contacts/           # ContactCard, ContactSheet, AddContactSheet, etc.
│   ├── layout/             # Sidebar, TopBar, AppShell
│   └── map/                # MapView
├── hooks/                  # TanStack Query hooks
├── lib/
│   ├── axios.ts            # Configured Axios instance
│   └── queryClient.ts      # TanStack Query client
├── constants/
│   └── queryKeys.ts
└── types/                  # Shared TypeScript types (Contact, User, etc.)
```

---

## Deployment

- **Platform:** Vercel (free hobby tier)
- **Domain:** `app.mynetwrk.com`
- **DNS:** Add a `CNAME` record in Route53 pointing `app.mynetwrk.com` to the Vercel-assigned hostname (e.g. `cname.vercel-dns.com`)
- **Env vars set in Vercel dashboard:**
  - `NEXT_PUBLIC_API_URL=https://mynetwrk.com`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>`
- **Deploy trigger:** push to `main` branch auto-deploys

---

## Implementation Milestones

Work in this order. Each milestone should be independently shippable.

### 1. Project scaffold
- Init Next.js app in `/web` with App Router + TypeScript
- Install and configure: Tailwind, shadcn/ui, TanStack Query, Axios
- Set up Axios instance with `withCredentials: true` and base URL from env
- Set up TanStack Query client and provider
- Implement `AppShell` layout (sidebar nav + main content area) for authenticated pages
- Add Vercel config and connect repo; confirm `app.mynetwrk.com` resolves

### 2. Auth (Login + Register)
- Build `/login` and `/register` pages
- Wire up to backend auth endpoints
- Implement redirect-if-authenticated and redirect-if-unauthenticated middleware
- Implement logout

### 3. Contacts page — list view
- Fetch and display contacts with `useContacts` hook
- Implement search (`?q=`), sort (`?sort=`), and tag filter (`?tags=`) via URL params
- Build `ContactCard` component
- Grid/list view toggle

### 4. Contact detail slide-over
- `ContactSheet` component (shadcn `Sheet` from right)
- Display all contact fields
- Inline edit mode
- Delete with confirmation

### 5. Add Contact slide-over
- `AddContactSheet` component
- Full form with all fields (see page spec above)
- Tag combobox with create-on-type
- Dynamic contact info list (platform + value pairs)
- Optimistic insert via TanStack Query

### 6. Account page
- Display user info
- Change password
- Logout
- Delete account

### 7. Map page
- Google Maps embed with contact markers
- Geolocation for centering
- Marker click → info popup with link to contact sheet

### 8. Post-launch: Richer table view
- Requires separate design pass before implementation
- TanStack Table + shadcn Data Table
- Sortable columns, column visibility, multi-select bulk actions, inline editing

---

## Post-launch: Backend API improvements

The current backend was built for the mobile app and uses conventions that differ from web/REST standards. The web app works around these today; the items below are improvements to make to the backend (and update the web to match) after launch.

### Auth token transport
**Current:** `user_token` is returned as a JSON response body on login and must be sent in the JSON body of every subsequent request.
**Standard:** Token should be set as an `httpOnly; Secure; SameSite=Lax` cookie by the backend on login, sent automatically by the browser on every request, and cleared server-side on logout. No JS ever touches the token value.
**Also needed:** A `/auth/logout` endpoint to clear the cookie server-side.

### Authorization header
**Current:** `user_token` is a field inside the JSON request body of every endpoint.
**Standard:** Token should be sent as `Authorization: Bearer <token>` header. This is a universal convention and decouples auth from payload shape.

### RESTful endpoint design
**Current:** All endpoints are `POST` with action-named URLs (`/searchContacts`, `/addContactForUser`, `/removeContactForUser`, `/validateUserCredentials`, etc.).
**Standard:** Resource-based URLs with proper HTTP verbs:
- `GET /contacts` — list/search
- `POST /contacts` — create
- `GET /contacts/:id` — fetch one
- `PUT /contacts/:id` — update
- `DELETE /contacts/:id` — delete
- `POST /auth/login`, `POST /auth/logout`, `POST /auth/register`
- `GET /auth/me`

### Consistent date format
**Current:** Dates are returned as `"DD Mon, YYYY"` strings (e.g. `"05 Jan, 2025"`), but sent as `"YYYY-MM-DD"`.
**Standard:** All dates should use ISO 8601 (`YYYY-MM-DD`) in both directions.

### Tags as objects
**Current:** Tags are plain strings in both directions.
**Standard:** Tags should be objects with stable IDs (`{ id, name }`) to support rename and delete operations.

### Change password endpoint
**Current:** No endpoint exists.
**Needed:** `POST /auth/change-password` with `{ current_password, new_password }`.

### User registration
**Current:** `/storeUserCredentials` takes `{ username, password, location? }` — no email field exists.
**Standard:** Registration should accept an email address and store it for account recovery.
