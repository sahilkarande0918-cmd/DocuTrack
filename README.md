# DocuTrack

**College Document Request & Tracking Portal — MIT Academy of Engineering, Alandi, Pune.**

DocuTrack digitises the full lifecycle of an official college document request: a
student logs in, selects a document, fills a request, uploads supporting files and
submits it. Office staff verify, request corrections, approve or reject, process, and
upload the final document. The student is notified at every step and downloads the
issued document securely — no repeated visits to the office.

> This is an SDLC / prototyping academic project. The stack is chosen to be fully
> deployable on free tiers (Vercel + Neon Postgres) with no paid services.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components) + React 19 + TypeScript |
| Styling | Tailwind CSS v4, custom OKLCH design tokens |
| Auth | Auth.js (NextAuth v5) — credentials, JWT sessions, role-based |
| Database | PostgreSQL (Neon free tier) via Prisma ORM |
| File storage | Files stored as `bytea` in Postgres, served via an **auth-guarded route** (the private-storage / signed-URL equivalent — never public) |
| Validation | Zod (server-side, at the trust boundary) |
| Motion | Framer Motion (restrained; respects `prefers-reduced-motion`) |
| Icons | lucide-react |

No Firebase, no MongoDB, no Railway, no paid APIs.

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Create a free Postgres database (Neon)

1. Sign up at [neon.tech](https://neon.tech) (free, no card).
2. Create a project. Copy the **pooled** connection string (and the direct one).

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL` — Neon pooled connection string
- `DIRECT_URL` — Neon direct connection string (used for schema push)
- `AUTH_SECRET` — run `npx auth secret` or `openssl rand -base64 32`
- `STUDENT_EMAIL_DOMAIN` — defaults to `mitaoe.ac.in`

### 4. Create the schema and seed demo data

```bash
npm run db:setup   # prisma db push + seed
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo accounts

All demo accounts use the password **`Password123`**.

| Portal | Role | Email |
| --- | --- | --- |
| Student | Student | `rahul.patil@mitaoe.ac.in` |
| Student | Student | `sneha.kulkarni@mitaoe.ac.in` |
| Faculty / Staff | Office Staff | `office@mitaoe.ac.in` |
| Faculty / Staff | Authorized Approver | `hod.comp@mitaoe.ac.in` |
| Faculty / Staff | Faculty | `prof@mitaoe.ac.in` |
| Faculty / Staff | Administrator | `admin@mitaoe.ac.in` |

New students can self-register at `/signup` — **only `@mitaoe.ac.in` emails are
accepted**, enforced server-side (not just in the form).

---

## Roles & access

Two login portals only: **Student** and **Faculty / Staff**. Internally, staff
accounts carry one of four roles:

- `OFFICE_STAFF` / `FACULTY` — review, request corrections, process, upload final docs
- `APPROVER` — the above **plus** approve / reject
- `ADMIN` — the above plus user management, document types, activity log

Authorization is enforced in three layers:

1. **Proxy (middleware)** — `proxy.ts` blocks cross-portal access before the page loads.
2. **Server components / actions** — every page re-checks the session role (`requireStudent`, `requireStaff`, `requireAdmin`).
3. **Data access** — students can only read/write their own requests, files and notifications; the file route verifies ownership on every download.

## Request status model

A controlled state machine (`lib/workflow.ts`) — arbitrary status strings are
impossible, and every transition is validated server-side:

```
submitted → under_review → { correction_required → correction_submitted → under_review
                           | approved → processing → ready → completed
                           | rejected }
```

Every transition writes a timestamped `RequestEvent` (who, what, previous → new
status, remarks) — the audit trail powering the activity log and accountability.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:setup` | Push schema + seed demo data |
| `npm run db:seed` | Re-seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Run unit tests (workflow + validation logic) |
| `npm run lint` | Lint |

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import into Vercel.
3. Add env vars: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `STUDENT_EMAIL_DOMAIN`.
4. Deploy. Run `npm run db:setup` once against the production database.

---

## Requirement traceability (FR → feature)

| FR | Requirement | Where |
| --- | --- | --- |
| FR-01 | Authentication | `auth.ts`, `/login`, `/signup` |
| FR-02 | Institute-email restriction | `lib/domain.ts` (server-enforced) |
| FR-03 | Document selection | `/student/new-request` (step 1) |
| FR-04 | Request form | new-request wizard (steps 2–3) |
| FR-05 | Supporting document upload | wizard step 4, `lib/actions/request-actions.ts` |
| FR-06 | Request ID generation | `generateRequestNumber()` — `DT-YYYY-#####` |
| FR-07 | Request tracking | `/student/requests/[id]`, `/student/track`, `RequestTimeline` |
| FR-08 | Verification | `startReview`, faculty request detail |
| FR-09 | Correction workflow | `requestCorrection` / `submitCorrection` |
| FR-10 | Approval / rejection | `approveRequest` / `rejectRequest` |
| FR-11 | Status management | `lib/workflow.ts` state machine |
| FR-12 | Final document delivery | `uploadFinalDocument`, `/api/files/[id]` |
| FR-13 | Notifications | `Notification` model, `/…/notifications` |
| FR-14 | Download | auth-guarded `/api/files/[id]` |
| FR-15 | Admin management | `/admin/users`, `/admin/document-types`, `/admin/activity` |

## Project structure

```
app/            routes: /login /signup /student/* /faculty/* /admin/* /api/*
components/      UI: app-shell (sidebar), status-badge, timeline, tables, modal…
lib/             prisma, auth session helpers, roles, workflow, validation, actions/
prisma/          schema.prisma + seed.ts
tests/           workflow + validation unit tests
```
