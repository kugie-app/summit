---
title: "Summit"
created: 2026-04-03
updated: 2026-04-03
---

## Overview
Summit is an open-source, self-hostable invoicing and financial management application designed for freelancers, small businesses, and agencies. It provides tools for creating invoices/quotes, tracking expenses and income, managing clients/vendors, and generating financial reports. Maintained by Kugie.app. **Status: Active.**

## Repositories
| Repo | URL | Tech |
|------|-----|------|
| Summit (monorepo) | https://github.com/kugie-app/summit | Next.js 16, TypeScript, Drizzle ORM, Tailwind CSS |

## Tech Stack
- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, shadcn/ui (Radix UI), Recharts, React Hook Form, Zod, Lucide icons
- **Backend:** Next.js API Routes (App Router), NextAuth.js 4 (credentials auth), Jose (JWT for client portal)
- **Database:** PostgreSQL (via `@neondatabase/serverless` driver + `pg`), Drizzle ORM
- **Hosting/Infra:** Railway (primary), Docker (multi-stage build, `kugieapp/summit` on Docker Hub), self-hostable
- **CI/CD:** GitHub Actions — `pr-checks.yml` (test + build on PRs), `main-build.yml` (build on main push), `release.yml` (Docker build + push + GitHub Release on semver tags)
- **External Services:** Resend (transactional email), Xendit (payment gateway), MinIO/S3-compatible (file storage for receipts & logos), Slack (webhook notifications for payments)

## Key Architecture
- **Monorepo / single Next.js app** — no separate backend service. All API logic lives in `src/app/api/` route handlers.
- **Auth flow:** Internal users authenticate via NextAuth.js (credentials provider with bcrypt). Client portal uses magic links with JWT tokens (Jose).
- **Database:** PostgreSQL with Drizzle ORM. Schema at `src/lib/db/schema.ts`. Migrations via `drizzle-kit generate` / `drizzle-kit push`. Railway pre-deploy runs `pnpm run push --force`.
- **File storage:** MinIO (S3-compatible) for receipt uploads and company logos. Upload/download via `src/app/api/upload/` and `src/app/api/download/` routes.
- **Payments:** Xendit integration for online invoice payments. Invoice creates a Xendit invoice via `/api/invoices/[id]/create-xendit-invoice`, and Xendit calls back via `/api/webhooks/xendit/payment` to mark invoices as paid.
- **Recurring transactions:** Cron endpoint at `/api/cron/process-recurring` (secured with `CRON_API_KEY`) processes recurring invoices, expenses, and income on configurable schedules (daily/weekly/monthly/yearly). Also `/api/jobs/recurring-transactions`.
- **Email:** Invoices and quotes can be sent directly via email using Resend. React Email templates for rich HTML emails.
- **PDF generation:** Server-side via `@react-pdf/renderer` for invoices and quotes.
- **Client portal:** Separate route group `(portal)` — clients log in via magic link, can view their invoices and quotes.
- **Team/RBAC:** Users belong to companies with roles: admin, staff, accountant. Team invitations system with email verification.
- **Reports:** Dedicated report API endpoints for profit & loss, invoice summary, aging receivables, expense breakdown, cash flow, revenue overview, income vs expenses, transaction metrics.

## Key Features
- **Invoicing** — Create, edit, send, track invoices (Draft/Sent/Paid/Overdue/Cancelled). PDF generation. Email delivery. Online payment via Xendit.
- **Quoting** — Create, send, track quotes (Draft/Sent/Accepted/Rejected/Expired). PDF generation. Convert accepted quotes to invoices.
- **Expense tracking** — Record and categorize expenses. Upload receipts to S3/MinIO. Approval statuses.
- **Income tracking** — Record and categorize income. Link to invoices or clients.
- **Client management** — Store client info, view per-client invoices/income.
- **Vendor management** — Manage supplier/vendor information.
- **Recurring transactions** — Auto-generate invoices, expenses, or income on daily/weekly/monthly/yearly schedules.
- **Dashboard** — Overview of outstanding/overdue invoices, profit & loss summary.
- **Financial reports** — Profit & loss, invoice summary, aging receivables, expense breakdown, cash flow, revenue overview.
- **Client portal** — Dedicated portal for clients to view invoices and quotes. Magic link authentication.
- **Team management** — Invite members with Admin/Accountant/Staff roles. Permission-based access.
- **API tokens** — Generate API tokens for external integrations.
- **Company settings** — Configure company details, logo, default currency, bank account info.

## Environment & Deployment
- **Production URL:** https://summitfinance.app
- **Demo URL:** https://demo.summitfinance.app (login: `summit@demo.com` / `demopass`, view-only)
- **Deployment method:** Railway (primary). Docker image also available (`docker pull kugieapp/summit:1.0.0`). Docker Compose for local containerized setup. Railway template available for one-click deploy.
- **Environment variables:** Stored in Railway dashboard for production. `.env` file locally (see `.env.example` for template). Key vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `XENDIT_SECRET_KEY`, `MINIO_*`, `CRON_API_KEY`, `CLIENT_AUTH_SECRET`.

## Integrations
- **Xendit** — Payment gateway for online invoice payments. Webhook at `/api/webhooks/xendit/payment` auto-updates invoice status on payment. Verification via `XENDIT_CALLBACK_VERIFICATION_TOKEN`.
- **Resend** — Transactional email service for sending invoices, quotes, magic links, and team invitations. Uses React Email templates.
- **MinIO / S3** — File storage for receipt uploads and company logos. Any S3-compatible provider works.
- **Slack** — Webhook notifications when payments are received via Xendit.

## Known Limitations / Tech Debt
- Docker image env vars must be passed individually via `-e` flags; `.env` file mounting not yet supported.
- Drizzle config points schema to `./src/lib/db/schema.ts` but `out` is set to `./src/lib/db/migrations` while the root `drizzle/` directory also contains a migration (`0000_funny_blockbuster.sql`) — dual migration paths could cause confusion.
- Demo instance is view-only with no write capability — not a full test environment.
- `docker-compose.yaml` has a typo: `NEXAUTH_URL` instead of `NEXTAUTH_URL`.
- `docker-compose.yaml` has `NEXT_TELEMETRY_DISABLED$` (trailing `$`) typo.
- Pre-deploy command uses `pnpm run push --force` which force-pushes schema changes — risky for production data migrations.
- Client portal auth uses custom JWT (Jose) separate from NextAuth — two parallel auth systems to maintain.
- No automated database backup strategy documented.

## Revenue Model
Open-source (MIT license), self-hostable. No SaaS pricing model — Summit is free to use. Maintained by Kugie.app as an internal tool and community project.

## Active Clients
Used internally by the Kugie.app team. Available for self-hosting by any freelancer, small business, or agency. No client-specific customizations in the codebase.

## Notes
- Default currency is IDR (Indonesian Rupiah), reflecting Kugie.app's primary market.
- Xendit is a Southeast Asian payment gateway — the payment integration is region-specific.
- Signup can be disabled via `NEXT_PUBLIC_DISABLE_SIGNUP=1` for single-tenant deployments.
- Docker images published to Docker Hub under `kugieapp/summit`. Multi-arch builds (amd64 + arm64).
- Package manager is pnpm. Node.js 20 required.
- Last stable Docker version: 1.0.0.
