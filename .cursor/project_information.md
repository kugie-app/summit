Okay, here is a Product Requirements Document (PRD) style documentation for the "Summit" repository, based on the provided file map, file contents, and project description.

---

# Summit - Product Requirements Document

**Version:** 1.0
**Date:** 2024-08-14

## Table of Contents

1.  [Repository Overview](#1-repository-overview)
    *   [1.1. Purpose](#11-purpose)
    *   [1.2. Core Features](#12-core-features)
    *   [1.3. Target Audience](#13-target-audience)
    *   [1.4. Main Technologies](#14-main-technologies)
    *   [1.5. Key Dependencies](#15-key-dependencies)
2.  [Folder Structure Analysis](#2-folder-structure-analysis)
    *   [2.1. Root Directory](#21-root-directory)
    *   [2.2. `src/` Directory](#22-src-directory)
    *   [2.3. `drizzle/` Directory](#23-drizzle-directory)
    *   [2.4. Component Interaction Flow](#24-component-interaction-flow)
3.  [Development Workflow Guide](#3-development-workflow-guide)
    *   [3.1. Environment Setup](#31-environment-setup)
    *   [3.2. Installation](#32-installation)
    *   [3.3. Database Setup & Migrations](#33-database-setup--migrations)
    *   [3.4. Running the Development Server](#34-running-the-development-server)
    *   [3.5. Building for Production](#35-building-for-production)
    *   [3.6. Linting](#36-linting)
    *   [3.7. Testing](#37-testing)
4.  [Key Components Documentation](#4-key-components-documentation)
    *   [4.1. Authentication (`src/lib/auth`, `src/middleware.ts`)](#41-authentication)
    *   [4.2. UI Components (`src/components/ui`, `src/components/layout`)](#42-ui-components)
    *   [4.3. Feature Components (e.g., `InvoiceForm`, `QuoteList`)](#43-feature-components)
    *   [4.4. Database (`src/lib/db`, `drizzle/`)](#44-database)
    *   [4.5. API Routes (`src/app/api`)](#45-api-routes)
    *   [4.6. Email (`src/emails`, `Resend`)](#46-email)
    *   [4.7. PDF Generation (`src/lib/pdf.ts`, `@react-pdf/renderer`)](#47-pdf-generation)
    *   [4.8. Permissions (`src/lib/auth/permissions`)](#48-permissions)
    *   [4.9. Client Portal (`src/app/portal`)](#49-client-portal)
    *   [4.10. Recurring Transactions (`src/lib/cron`, `src/lib/jobs`)](#410-recurring-transactions)
5.  [Common Workflows](#5-common-workflows)
    *   [5.1. Adding a New Authenticated Page](#51-adding-a-new-authenticated-page)
    *   [5.2. Adding a New API Endpoint](#52-adding-a-new-api-endpoint)
    *   [5.3. Modifying the Database Schema](#53-modifying-the-database-schema)
    *   [5.4. Adding a Reusable UI Component](#54-adding-a-reusable-ui-component)
    *   [5.5. Implementing a New Feature (e.g., "Projects")](#55-implementing-a-new-feature)
6.  [API Documentation](#6-api-documentation)
    *   [6.1. Authentication (`/api/auth`)](#61-authentication-api)
    *   [6.2. Clients (`/api/clients`)](#62-clients-api)
    *   [6.3. Invoices (`/api/invoices`)](#63-invoices-api)
    *   [6.4. Quotes (`/api/quotes`)](#64-quotes-api)
    *   [6.5. Expenses (`/api/expenses`, `/api/expense-categories`)](#65-expenses-api)
    *   [6.6. Income (`/api/income`, `/api/income-categories`)](#66-income-api)
    *   [6.7. Users & Invitations (`/api/users`, `/api/invitations`)](#67-users--invitations-api)
    *   [6.8. Vendors (`/api/vendors`)](#68-vendors-api)
    *   [6.9. Reports (`/api/reports`)](#69-reports-api)
    *   [6.10. Webhooks (`/api/webhooks`)](#610-webhooks-api)
    *   [6.11. Client Portal API (`/api/portal`)](#611-client-portal-api)
    *   [6.12. Jobs (`/api/jobs`)](#612-jobs-api)
7.  [Areas for Further Documentation](#7-areas-for-further-documentation)

---

## 1. Repository Overview

### 1.1. Purpose

Summit is an open-source financial management application specifically designed for small teams and businesses. It provides essential tools for managing quotations, invoices, and tracking income and expenses, focusing on simplicity and core functionality over complex features found in larger enterprise solutions.

### 1.2. Core Features

*   User Authentication & Role-Based Access Control (Admin, Accountant, Staff)
*   Company Profile Management
*   Client Management (CRUD)
*   Vendor Management (CRUD)
*   Income & Expense Category Management
*   Quotation Creation, Management, PDF Generation, and Emailing
*   Invoice Creation (including from Quotes), Management, PDF Generation, Emailing, and Xendit Payment Integration
*   Income & Expense Tracking (CRUD)
*   Recurring Transaction Processing (Expenses, Income)
*   Basic Reporting (Profit & Loss, Invoice Summary, Aging Receivables, etc.)
*   Team Member Invitation System
*   Client Portal for viewing Invoices and Quotes (Magic Link Auth)
*   Theme Switching (Light/Dark/System)

### 1.3. Target Audience

Small businesses, freelancers, and teams requiring a straightforward, self-hostable solution for managing basic financial documents and tracking.

### 1.4. Main Technologies

*   **Framework:** Next.js 15.3 (App Router)
*   **Language:** TypeScript
*   **Database:** PostgreSQL (likely via Neon based on `package.json` deps)
*   **ORM:** Drizzle ORM
*   **Authentication:** NextAuth.js (Credentials Provider, JWT)
*   **UI:** React 19, Tailwind CSS, Shadcn/ui
*   **State Management:** React Context, `useState`, `useEffect` (primarily local state)
*   **Form Handling:** React Hook Form with Zod for validation
*   **API:** Next.js API Routes
*   **Email:** Resend
*   **PDF Generation:** `@react-pdf/renderer`
*   **Payments:** Xendit (Invoice creation & webhook handling)
*   **Linting/Formatting:** ESLint, Prettier

### 1.5. Key Dependencies

*   `next`: 15.3.0
*   `react`: 19.0.0
*   `drizzle-orm`: 0.41.0
*   `drizzle-kit`: 0.30.6
*   `postgres`: 3.4.5 / `@neondatabase/serverless`: 1.0.0
*   `tailwindcss`: 4.x.x (assumed based on `@tailwindcss/postcss`)
*   `next-auth`: 4.24.11
*   `zod`: 3.24.2
*   `react-hook-form`: 7.55.0
*   `@hookform/resolvers`: 5.0.1
*   `shadcn/ui` components (various versions based on `components.json`)
*   `lucide-react`: 0.488.0
*   `resend`: 4.2.0
*   `xendit-node`: 6.3.0
*   `@react-pdf/renderer`: 4.3.0
*   `bcrypt`: 5.1.1
*   `date-fns`: 3.6.0

*(Refer to `/package.json` for the complete list and exact versions.)*

---

## 2. Folder Structure Analysis

The repository follows a standard Next.js App Router structure with conventions for organizing code by feature and type.

### 2.1. Root Directory

*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
*   `components.json`: Configuration file for Shadcn/ui.
*   `drizzle.config.ts`: Configuration for Drizzle Kit (ORM migrations and schema pushing).
*   `eslint.config.mjs`: ESLint configuration file.
*   `next.config.ts`: Next.js configuration file.
*   `package.json`: Lists project dependencies and scripts.
*   `postcss.config.mjs`: PostCSS configuration, likely used with Tailwind CSS.
*   `README.md`: Project overview and setup instructions.
*   `drizzle/`: Contains database migration files generated by Drizzle Kit.
    *   `meta/`: Metadata about migrations.
    *   `*.sql`: SQL migration files.

### 2.2. `src/` Directory

Contains the core application code.

*   **`app/`**: Next.js App Router directory.
    *   **`(authenticated)/`**: Route group for pages requiring user authentication. Uses `src/middleware.ts` for protection.
        *   `clients/`, `dashboard/`, `expenses/`, etc.: Feature-specific route directories.
            *   `page.tsx`: Defines the UI for a specific route.
            *   `[clientId]/`, `[invoiceId]/`, etc.: Dynamic route segments.
            *   `edit/`, `new/`: Sub-routes for specific actions (e.g., editing an invoice).
    *   **`api/`**: Defines API endpoints.
        *   `auth/`, `clients/`, `invoices/`, etc.: Resource-based API route structure.
        *   `[clientId]/`, `[invoiceId]/`, etc.: Dynamic API routes for specific resources.
        *   `route.ts`: Defines the request handlers (GET, POST, PUT, DELETE) for an API endpoint.
    *   **`auth/`**: Public authentication pages (Sign In, Sign Up).
    *   **`portal/`**: Routes related to the client-facing portal. Requires separate client authentication (`client_token` cookie).
    *   **`accept-invitation/`**: Public page for users to accept team invitations.
    *   **`access-denied/`**: Page shown when a user lacks permission.
    *   `globals.css`: Global CSS styles, including Tailwind directives.
    *   `layout.tsx`: Root layout for the entire application. Sets up providers (`ThemeProvider`, `NextAuthProvider`).
    *   `page.tsx`: Root page, currently redirects to `/dashboard`.
*   **`components/`**: Reusable React components.
    *   **`auth/`**: Components related to authentication/authorization (e.g., `PermissionGuard`).
    *   **`clients/`, `dashboard/`, `expenses/`, etc.:** Feature-specific components.
    *   **`layout/`**: Layout components (`Header`, `Sidebar`).
    *   **`pdf/`**: Components used for generating PDFs (`InvoicePDF`, `QuotePDF`).
    *   **`ui/`**: UI primitives based on Shadcn/ui (`Button`, `Card`, `Input`, etc.).
    *   `NextAuthProvider.tsx`, `ThemeProvider.tsx`: Context providers.
*   **`emails/`**: React Email components for transactional emails (`InvitationEmail`, `InvoiceEmail`, etc.).
*   **`lib/`**: Core logic, utilities, and configurations.
    *   **`auth/`**: Authentication logic.
        *   `client/`: Client-side auth utilities (for portal).
        *   `permissions/`: Role and permission definitions and helpers.
        *   `options.ts`: NextAuth configuration.
    *   **`cron/`**: Logic related to scheduled tasks (recurring items).
    *   **`db/`**: Database setup and schema.
        *   `queries/`: Potentially for reusable database queries (e.g., `company-scoped.ts`).
        *   `index.ts`: Drizzle ORM client initialization.
        *   `schema.ts`: Defines database tables and relations using Drizzle ORM syntax.
    *   **`jobs/`**: Logic for background or scheduled jobs (recurring transactions).
    *   **`reports/`**: Logic for generating report data.
    *   **`validations/`**: Zod schemas for data validation (API requests, forms).
    *   **`xendit/`**: Xendit payment gateway integration logic.
    *   `pdf.ts`: Utility for rendering React components to PDF buffers.
    *   `utils.ts`: General utility functions (e.g., `cn`, `formatCurrency`).
*   **`middleware.ts`**: Next.js middleware for handling routing, authentication, and authorization checks before requests reach pages or API routes.

### 2.3. `drizzle/` Directory

*   Contains SQL migration files generated by Drizzle Kit. These files track changes to the database schema defined in `src/lib/db/schema.ts`.
*   `meta/`: Contains metadata (`_journal.json`, `0000_snapshot.json`) used by Drizzle Kit to manage migrations.

### 2.4. Component Interaction Flow

1.  **Request:** A user interacts with the UI (e.g., fills an invoice form).
2.  **Client Component (`src/components/invoices/InvoiceForm.tsx`):** Handles form state (React Hook Form) and user input. On submit, it makes a `fetch` request to the corresponding API endpoint (e.g., `POST /api/invoices`).
3.  **Middleware (`src/middleware.ts`):** Intercepts the request, checks authentication (NextAuth token for main app, `client_token` for portal), and potentially authorization based on the path.
4.  **API Route (`src/app/api/invoices/route.ts`):** Handles the incoming request.
    *   Validates user session and permissions.
    *   Validates request data using Zod schemas (`src/lib/validations/invoice.ts`).
    *   Interacts with the database using Drizzle ORM (`src/lib/db/index.ts`, `src/lib/db/schema.ts`). May use company-scoped helpers (`src/lib/db/queries/company-scoped.ts`).
    *   May interact with external services (e.g., Xendit via `src/lib/xendit`, Resend via `Resend` client).
    *   Sends back a JSON response.
5.  **Client Component:** Receives the response, updates UI state, shows toasts (`sonner`), and potentially navigates (`useRouter`).
6.  **UI Primitives (`src/components/ui`):** Used throughout the client components for consistent styling and behavior.
7.  **Layout (`src/app/layout.tsx`, `src/components/layout`):** Wraps pages, providing consistent structure (Sidebar, Header) and global providers.

---

## 3. Development Workflow Guide

### 3.1. Environment Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd summit
    ```
2.  **Environment Variables:** Create a `.env.local` file in the root directory by copying `.env.example` (if it exists, otherwise create manually). Fill in the required variables:
    *   `DATABASE_URL`: Connection string for your PostgreSQL database (e.g., Neon).
    *   `NEXTAUTH_SECRET`: A secret key for NextAuth.js JWT signing. Generate one using `openssl rand -base64 32`.
    *   `NEXTAUTH_URL`: The base URL of your application (e.g., `http://localhost:3000` for development).
    *   `RESEND_API_KEY`: API key from Resend for sending emails.
    *   `RESEND_FROM_EMAIL`: The email address Resend will send from.
    *   `XENDIT_SECRET_KEY`: Secret API key from Xendit.
    *   `XENDIT_CALLBACK_VERIFICATION_TOKEN`: Token for verifying Xendit webhooks.
    *   `CLIENT_AUTH_SECRET`: Secret key for signing client portal JWTs.
    *   `RECURRING_TRANSACTIONS_API_KEY`: API key for securing the recurring transactions job endpoint.
    *   `CRON_API_KEY`: API key for securing the general cron endpoint.
    *   `NEXT_PUBLIC_APP_URL`: Publicly accessible base URL of the application (used in emails).

### 3.2. Installation

Install project dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

*Note: The `package.json` includes `resolutions` and `overrides` for `prettier`. Ensure your package manager respects these.*

### 3.3. Database Setup & Migrations

1.  **Ensure Database is Running:** Make sure your PostgreSQL database server is accessible using the `DATABASE_URL` provided.
2.  **Generate Migrations (After Schema Changes):** If you modify `src/lib/db/schema.ts`, generate a new migration file:
    ```bash
    npm run generate
    # or pnpm generate, yarn generate
    ```
    Review the generated SQL file in the `drizzle/` directory.
3.  **Apply Migrations:** Push the schema changes to your database:
    ```bash
    npm run push
    # or pnpm push, yarn push
    ```
    This command applies pending migrations. For production, a more robust migration strategy (like `drizzle-kit migrate`) might be preferable.

### 3.4. Running the Development Server

Start the Next.js development server (with Turbopack enabled):

```bash
npm run dev
# or pnpm dev, yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3.5. Building for Production

Create an optimized production build:

```bash
npm run build
# or pnpm build, yarn build
```

Start the production server:

```bash
npm run start
# or pnpm start, yarn start
```

### 3.6. Linting

Check the code for linting errors according to the configuration in `eslint.config.mjs`:

```bash
npm run lint
# or pnpm lint, yarn lint
```

### 3.7. Testing

*   **Current Status:** No specific testing frameworks (e.g., Jest, Vitest, Cypress) or test files (`*.test.ts`, `*.spec.ts`) were found in the provided repository structure.
*   **To Add Tests:** A testing strategy needs to be defined and implemented. This could involve:
    *   Unit tests for utility functions, validation schemas, and potentially complex component logic.
    *   Integration tests for API endpoints.
    *   End-to-end tests using a framework like Cypress or Playwright.

---

## 4. Key Components Documentation

### 4.1. Authentication (`src/lib/auth`, `src/middleware.ts`)

*   **Purpose:** Handles user authentication for the main application and client authentication for the portal.
*   **Main App Auth:** Uses NextAuth.js with a Credentials Provider. Stores session info in JWTs.
    *   `src/lib/auth/options.ts`: Defines NextAuth configuration, providers, and callbacks (jwt, session). Includes logic to add role, companyId, and permissions to the session token.
    *   `src/app/api/auth/[...nextauth]/route.ts`: Default NextAuth API route handler.
    *   `src/app/api/auth/register/route.ts`: Handles new user and company sign-up.
    *   `src/app/api/auth/clear-session/route.ts`: Endpoint to clear NextAuth cookies, used during invitation acceptance flow.
*   **Client Portal Auth:** Uses custom JWT logic for magic link authentication.
    *   `src/lib/auth/client/utils.ts`: Contains functions for creating/verifying client JWTs, managing cookies (`client_token`), generating magic link tokens, and requiring client auth.
    *   `src/app/api/portal/auth/magic-link/route.ts`: Generates and emails a magic link token.
    *   `src/app/api/portal/auth/verify/route.ts`: Verifies the magic link token and creates a client session (JWT cookie).
    *   `src/app/api/portal/auth/logout/route.ts`: Clears the client session cookie.
*   **Middleware (`src/middleware.ts`):** Protects routes based on authentication status. Redirects unauthenticated users to `/auth/signin` for the main app and `/portal/login` for the portal. Checks `client_token` for portal API routes. Allows access to public paths.
*   **Usage:** Session data is accessed using `useSession` (client-side) or `getServerSession` (server-side). Client session via `getClientSession`.

### 4.2. UI Components (`src/components/ui`, `src/components/layout`)

*   **Purpose:** Provides reusable UI elements and application layout structure.
*   **`src/components/ui`:** Contains Shadcn/ui components (`Button`, `Card`, `Input`, `Table`, `Dialog`, `Select`, etc.). These are primitive components used to build the application's interface, styled with Tailwind CSS. Configuration in `components.json`.
*   **`src/components/layout`:**
    *   `Header.tsx`: Top navigation bar, includes theme switcher and user profile dropdown/sign-out. Uses `useSession`.
    *   `Sidebar.tsx`: Left-hand navigation menu for authenticated users. Uses `usePathname` to highlight the active link. Navigation items are grouped.
*   **Dependencies:** `react`, `tailwindcss`, `clsx`, `tailwind-merge`, `lucide-react`, Radix UI primitives.

### 4.3. Feature Components (e.g., `InvoiceForm`, `QuoteList`)

*   **Purpose:** Encapsulate UI and logic for specific features.
*   **Examples:**
    *   `src/components/invoices/InvoiceForm.tsx`: Handles creation and editing of invoices. Uses `react-hook-form`, Zod (`@/lib/validations/invoice.ts`), fetches clients (`/api/clients`), submits data to `/api/invoices`. Includes sub-component `InvoiceItemForm.tsx`.
    *   `src/components/quotes/QuoteList.tsx`: Displays a sortable, filterable, and paginated list of quotes. Fetches data from `/api/quotes`, uses `useRouter` for navigation, Shadcn `Table`, `DropdownMenu` for actions.
    *   `src/components/clients/ClientsTable.tsx`: Renders the table of clients with sorting, pagination, and actions (view, edit, delete). Interacts with `/api/clients` for deletion. Uses `ClientDialog`.
    *   `src/app/(authenticated)/settings/page.tsx`: Client component managing settings tabs, specifically Team Management. Fetches users (`/api/users`) and invitations (`/api/invitations`), handles invites (`POST /api/invitations`), deletions (`DELETE /api/users/:id`, `DELETE /api/invitations/:id`). Uses `useSession`, `react-hook-form`, Shadcn components.
*   **Dependencies:** React, Next.js (`useRouter`, `usePathname`), UI components, validation schemas, `fetch` API, `sonner` (for toasts).

### 4.4. Database (`src/lib/db`, `drizzle/`)

*   **Purpose:** Defines the database schema, initializes the ORM client, and manages migrations.
*   **`src/lib/db/schema.ts`:** Defines all database tables (`companies`, `users`, `clients`, `invoices`, `quotes`, `expenses`, etc.), enums (`roleEnum`, `invoiceStatusEnum`), relations (`relations`), and indexes using Drizzle ORM syntax.
*   **`src/lib/db/index.ts`:** Initializes the Drizzle ORM client using `postgres` driver, connecting to the database specified in `DATABASE_URL`.
*   **`drizzle/`:** Stores SQL migration files generated by Drizzle Kit based on schema changes.
*   **`src/lib/db/queries/company-scoped.ts`:** Provides helper functions (`getCompanyScopedRecords`, `insertCompanyScopedRecord`, etc.) to ensure database operations are automatically filtered by the user's `companyId`, enforcing multi-tenancy.
*   **Dependencies:** `drizzle-orm`, `postgres` / `@neondatabase/serverless`, `drizzle-kit` (dev dependency).

### 4.5. API Routes (`src/app/api`)

*   **Purpose:** Provides backend endpoints for CRUD operations, authentication, reporting, and other server-side logic.
*   **Structure:** Organized by resource (e.g., `/api/clients`, `/api/invoices/[invoiceId]`).
*   **Implementation:** Uses Next.js API Routes (`route.ts`). Each file exports functions for HTTP methods (GET, POST, PUT, DELETE, PATCH).
*   **Logic:** Typically involves:
    *   Authenticating the user using `getServerSession` and `authOptions`.
    *   Checking user permissions.
    *   Validating request parameters and body using Zod schemas (`src/lib/validations`).
    *   Interacting with the database using Drizzle (`src/lib/db`).
    *   Returning JSON responses with appropriate status codes.
*   **Example (`/api/invoices/[invoiceId]/route.ts`):**
    *   `GET`: Fetches a specific invoice and its items/client.
    *   `PUT`: Updates an invoice and its items (uses db transaction).
    *   `DELETE`: Soft-deletes an invoice.

### 4.6. Email (`src/emails`, `Resend`)

*   **Purpose:** Defines email templates and handles sending transactional emails.
*   **`src/emails/`:** Contains React components defining email templates (e.g., `InvitationEmail.tsx`, `InvoiceEmail.tsx`, `QuoteEmail.tsx`, `MagicLinkEmail.tsx`) using `@react-email/components`.
*   **Sending:** Uses the `Resend` library client, initialized with `process.env.RESEND_API_KEY`. Email sending logic is typically found within API routes that trigger emails (e.g., `/api/invitations/route.ts`, `/api/invoices/[invoiceId]/send-email/route.ts`).

### 4.7. PDF Generation (`src/lib/pdf.ts`, `@react-pdf/renderer`)

*   **Purpose:** Generates PDF documents for invoices and quotes.
*   **`src/components/pdf/`:** Contains React components (`InvoicePDF.tsx`, `QuotePDF.tsx`) that define the structure and styling of the PDF documents using `@react-pdf/renderer`.
*   **`src/lib/pdf.ts`:** Contains a utility function `renderToBuffer` that takes a React PDF component and its props, and renders it to a buffer suitable for sending in an HTTP response.
*   **Usage:** API routes like `/api/invoices/[invoiceId]/pdf/route.ts` fetch the necessary data, pass it to the corresponding PDF component, render it using `renderToBuffer`, and return the PDF buffer in the response with appropriate headers.

### 4.8. Permissions (`src/lib/auth/permissions`)

*   **Purpose:** Defines roles and their associated permissions, provides utilities for checking access.
*   **`roles.ts`:** Defines `Role` types (`admin`, `accountant`, `staff`), the `UserSession` interface extending NextAuth's `Session`, helper functions (`hasRole`, `isAdmin`, `checkPermission`), and a `Permissions` object for structured access checks.
*   **`utils.ts`:** Contains the `PERMISSION_MATRIX` defining which permissions each role has, and functions like `getUserPermissions` and `hasPermission`.
*   **`server.ts`:** Contains server-side helper functions (`requireRoles`, `requirePermission`, `getSessionWithRole`, `getSessionWithPermission`) for enforcing authorization in API routes and Server Components/Actions, often resulting in redirects or forbidden responses.
*   **Integration:** Permissions are added to the user's session token in `src/lib/auth/options.ts` and checked in API routes and potentially guarded client components (`src/components/auth/PermissionGuard.tsx`, `src/components/auth/RoleGuard.tsx`).

### 4.9. Client Portal (`src/app/portal`)

*   **Purpose:** Provides a separate interface for clients to view their invoices and quotes.
*   **Authentication:** Uses a custom magic link flow independent of the main application's NextAuth setup. Managed by `src/lib/auth/client/utils.ts` and API routes in `/api/portal/auth`. A JWT is stored in the `client_token` cookie.
*   **Routes:**
    *   `/portal/login`: Public login page using `src/app/portal/login/login-form.tsx`.
    *   `/portal/verify`: Page to handle magic link token verification.
    *   `/portal/dashboard`: Main dashboard after login.
    *   `/portal/invoices`, `/portal/quotes`: Pages to list relevant documents.
    *   `/portal/layout.tsx`: Specific layout for the portal section.
*   **API:** Portal-specific API endpoints are under `/api/portal/`. `src/middleware.ts` handles authentication for these routes based on the `client_token`.

### 4.10. Recurring Transactions (`src/lib/cron`, `src/lib/jobs`)

*   **Purpose:** Automates the creation of recurring expenses and income based on schedules defined in the original records.
*   **Logic:**
    *   `src/lib/cron/recurring-items.ts`: Contains the core logic (`processRecurringInvoices`, `processRecurringExpenses`, `processRecurringIncome`, `processAllRecurringItems`) to find due recurring items, create new instances, and update the `nextDueDate` of the original items. Uses `date-fns` for date calculations.
    *   `src/lib/jobs/recurring-transactions.ts`: An alternative or potentially refactored version of the processing logic. Seems to focus more directly on `expenses` and `income` tables.
*   **Triggering:**
    *   **Manual:** `src/components/dashboard/RecurringTransactionsButton.tsx` allows admins to trigger the job via `POST /api/jobs/recurring-transactions`.
    *   **Automated:** `src/app/api/cron/process-recurring/route.ts` is designed to be called by an external scheduler (like Vercel Cron Jobs or a system cron). It uses an API key (`CRON_API_KEY`) for authentication and calls `processAllRecurringItems`.
*   **Configuration:** `src/lib/jobs/cron-config.ts` defines potential cron schedules and the API endpoint.

---

## 5. Common Workflows

### 5.1. Adding a New Authenticated Page

1.  Create a new directory under `src/app/(authenticated)/` (e.g., `src/app/(authenticated)/new-feature/`).
2.  Create a `page.tsx` file within the new directory.
3.  Implement the React component for the page, likely using client components (`'use client'`) if interactivity or hooks like `useState`, `useEffect` are needed.
4.  Fetch necessary data within the component using `useEffect` and `fetch` calls to relevant API endpoints, or use Server Components if fetching data server-side.
5.  Add a link to the new page in the sidebar navigation (`src/components/layout/Sidebar.tsx`).
6.  Ensure necessary permissions are checked if the page requires specific access levels (e.g., using `PermissionGuard` or server-side checks).

### 5.2. Adding a New API Endpoint

1.  Create a new directory structure under `src/app/api/` reflecting the resource (e.g., `src/app/api/new-resource/`).
2.  Create a `route.ts` file inside the directory.
3.  Define and export functions for the required HTTP methods (e.g., `export async function GET(request: NextRequest) { ... }`).
4.  Implement authentication checks using `getServerSession(authOptions)`.
5.  Validate request parameters or body using Zod schemas defined in `src/lib/validations/`.
6.  Implement business logic, including database interactions using `db` from `src/lib/db`. Use company-scoped helpers where appropriate.
7.  Return responses using `NextResponse.json()`.

### 5.3. Modifying the Database Schema

1.  Edit the table definitions or add new tables/enums in `src/lib/db/schema.ts`.
2.  Run `npm run generate` to create a new SQL migration file in the `drizzle/` directory.
3.  Review the generated SQL migration file for correctness.
4.  Run `npm run push` to apply the migration to your development database. *(Note: For production, use a more controlled migration process).*
5.  Update any related API routes, components, and validation schemas to reflect the schema changes.

### 5.4. Adding a Reusable UI Component

1.  Create a new `.tsx` file in `src/components/ui/` (for primitives) or `src/components/[feature]/` (for feature-specific components).
2.  Implement the component using React and Shadcn/ui primitives or other components.
3.  Use `cn` utility from `src/lib/utils.ts` for conditional class names.
4.  Export the component.
5.  Import and use the component where needed.

### 5.5. Implementing a New Feature (e.g., "Projects")

1.  **Schema:** Define the `projects` table and any related tables (e.g., `project_tasks`) in `src/lib/db/schema.ts`. Add relations.
2.  **Migrations:** Run `npm run generate` and `npm run push`.
3.  **Validation:** Create `src/lib/validations/project.ts` with Zod schemas for project data.
4.  **API:** Create API routes under `src/app/api/projects/` for CRUD operations (`route.ts`, `[projectId]/route.ts`). Implement handlers using session checks, validation, and DB interactions.
5.  **UI Page:** Create `src/app/(authenticated)/projects/page.tsx` for listing projects and `src/app/(authenticated)/projects/[projectId]/page.tsx` for viewing details.
6.  **UI Components:** Create components in `src/components/projects/` (e.g., `ProjectList.tsx`, `ProjectForm.tsx`).
7.  **Navigation:** Add "Projects" link to `src/components/layout/Sidebar.tsx`.
8.  **Permissions:** Update `src/lib/auth/permissions/utils.ts` (PERMISSION_MATRIX) to define project-related permissions and check them in API routes/pages.

---

## 6. API Documentation

All authenticated API endpoints require a valid NextAuth JWT session token unless otherwise specified. Portal APIs require a valid `client_token` cookie.

### 6.1. Authentication (`/api/auth`)

*   **`POST /api/auth/register`**: Creates a new company and an admin user.
    *   **Body:** `{ name, email, password, companyName }` (Validated by `registerSchema`).
    *   **Response:** `201 Created` with `{ message, userId }` or error (409 conflict, 400 validation, 500 server error).
*   **`POST /api/auth/signin`**: Handled by NextAuth.js.
*   **`GET /api/auth/signout`**: Handled by NextAuth.js.
*   **`POST /api/auth/clear-session`**: Clears NextAuth session cookies. Used during invitation acceptance.
    *   **Response:** `200 OK` with `{ success: true }`.

### 6.2. Clients (`/api/clients`)

*   **`GET /api/clients`**: Lists clients for the user's company.
    *   **Query Params:** `page`, `limit`, `sort` (field), `order` ('asc'|'desc'), `q` (search term).
    *   **Response:** `200 OK` with `{ data: Client[], meta: { total, page, limit, pageCount } }`.
*   **`POST /api/clients`**: Creates a new client.
    *   **Body:** `{ name, email?, phone?, address?, paymentTerms }` (Validated by `clientSchema`).
    *   **Response:** `201 Created` with the created `Client` object or error (409 conflict, 400 validation).
*   **`GET /api/clients/[clientId]`**: Gets details of a specific client.
    *   **Response:** `200 OK` with the `Client` object or `404 Not Found`.
*   **`PUT /api/clients/[clientId]`**: Updates a specific client.
    *   **Body:** `{ name, email?, phone?, address?, paymentTerms }` (Validated by `clientSchema`).
    *   **Response:** `200 OK` with the updated `Client` object or error (404, 409, 400).
*   **`DELETE /api/clients/[clientId]`**: Soft-deletes a specific client.
    *   **Response:** `200 OK` with `{ message: 'Client deleted successfully' }` or `404 Not Found`.

### 6.3. Invoices (`/api/invoices`)

*   **`GET /api/invoices`**: Lists invoices for the company, supports pagination, sorting, filtering by status, and search.
    *   **Query Params:** `page`, `limit`, `sortBy`, `sortOrder`, `status`, `search`.
    *   **Response:** `200 OK` with `{ data: FormattedInvoice[], total, page, limit, totalPages }`.
*   **`POST /api/invoices`**: Creates a new invoice.
    *   **Body:** `{ clientId, invoiceNumber, status, issueDate, dueDate, taxRate?, notes?, items: InvoiceItem[] }` (Validated by `invoiceSchema` from `lib/validations/invoice.ts`).
    *   **Response:** `201 Created` with the created `FormattedInvoice` object or error (400, 404, 500).
*   **`GET /api/invoices/[invoiceId]`**: Gets details of a specific invoice.
    *   **Response:** `200 OK` with the `FormattedInvoice` object or `404 Not Found`.
*   **`PUT /api/invoices/[invoiceId]`**: Updates a specific invoice.
    *   **Body:** Similar to POST body (Validated by `invoiceSchema`).
    *   **Response:** `200 OK` with the updated `FormattedInvoice` object or error (400, 404, 500).
*   **`DELETE /api/invoices/[invoiceId]`**: Soft-deletes an invoice.
    *   **Response:** `200 OK` with `{ message: 'Invoice deleted successfully' }` or `404 Not Found`.
*   **`GET /api/invoices/[invoiceId]/pdf`**: Generates and returns a PDF for the invoice.
    *   **Response:** `200 OK` with `Content-Type: application/pdf`.
*   **`POST /api/invoices/[invoiceId]/send-email`**: Sends the invoice email to the client. Updates status to 'sent' if draft.
    *   **Response:** `200 OK` with `{ message, data? }` or error (400, 404, 500).
*   **`POST /api/invoices/[invoiceId]/create-xendit-invoice`**: Creates a Xendit payment link for the invoice.
    *   **Response:** `200 OK` with `{ message, xenditInvoiceUrl, invoice }` or error (400, 404, 500).

*(Note: `FormattedInvoice` includes client and items details)*

### 6.4. Quotes (`/api/quotes`)

*   Similar structure to Invoices (GET list, POST create, GET details, PUT update, DELETE soft-delete).
*   Uses `quoteSchema` and `quoteItemSchema` from `lib/validations/quote.ts`.
*   **`GET /api/quotes/[quoteId]/pdf`**: Generates PDF.
*   **`POST /api/quotes/[quoteId]/send-email`**: Sends quote email. Updates status to 'sent' if draft.
*   **`PATCH /api/quotes/[quoteId]/status`**: Updates only the quote status.
    *   **Body:** `{ status: QuoteStatus }` (Validated by `quoteStatusUpdateSchema`).
    *   **Response:** `200 OK` with the updated `Quote` object.
*   **`POST /api/quotes/[quoteId]/convert-to-invoice`**: Converts an 'accepted' quote to a 'draft' invoice.
    *   **Response:** `200 OK` with `{ message, invoiceId }` or error (400, 404).

### 6.5. Expenses (`/api/expenses`, `/api/expense-categories`)

*   **`/api/expenses`**:
    *   `GET`: Lists expenses (paginated, filterable by status, category, date, searchable).
    *   `POST`: Creates a new expense (uses `expenseSchema`).
*   **`/api/expenses/[expenseId]`**:
    *   `GET`: Gets specific expense details.
    *   `PUT`: Updates an expense (uses `expenseSchema`).
    *   `DELETE`: Soft-deletes an expense.
*   **`/api/expenses/[expenseId]/status`**:
    *   `PUT`: Updates only the expense status (`approved`, `rejected`).
*   **`/api/expense-categories`**:
    *   `GET`: Lists all expense categories for the company.
    *   `POST`: Creates a new expense category (uses `expenseCategorySchema`).
*   **`/api/expense-categories/[categoryId]`**:
    *   `GET`: Gets specific category.
    *   `PUT`: Updates a category.
    *   `DELETE`: Soft-deletes a category (checks if unused).

### 6.6. Income (`/api/income`, `/api/income-categories`)

*   Similar structure to Expenses/Expense Categories.
*   Uses schemas from `lib/validations/income.ts`.
*   Endpoints handle CRUD for income entries and income categories.

### 6.7. Users & Invitations (`/api/users`, `/api/invitations`)

*   **`/api/users`**:
    *   `GET`: Lists active users in the company (requires `users.view` permission).
*   **`/api/users/[userId]`**:
    *   `DELETE`: Soft-deletes a user (requires `users.delete` permission). Cannot delete self.
*   **`/api/invitations`**:
    *   `GET`: Lists pending invitations (requires `users.invite` permission).
    *   `POST`: Creates and sends a new invitation (requires `users.invite` permission).
*   **`/api/invitations/[invitationId]`**:
    *   `DELETE`: Cancels a pending invitation (requires `users.invite` permission). Sends cancellation email.
*   **`/api/invitations/verify`**:
    *   `GET`: Public endpoint to verify an invitation token.
*   **`/api/invitations/accept`**:
    *   `POST`: Public endpoint to accept an invitation, create user account. Sends welcome email.

### 6.8. Vendors (`/api/vendors`)

*   **`/api/vendors`**:
    *   `GET`: Lists vendors (searchable).
    *   `POST`: Creates a new vendor.
*   **`/api/vendors/[vendorId]`**:
    *   `GET`: Gets specific vendor details.
    *   `PUT`: Updates a vendor.
    *   `DELETE`: Soft-deletes a vendor.

### 6.9. Reports (`/api/reports`)

*   **`/api/reports/profit-loss`**: GET Profit and Loss data (monthly breakdown or summary for a period).
*   **`/api/reports/invoice-summary`**: GET Invoice counts and totals by status.
*   **`/api/reports/expense-breakdown`**: GET Expense totals by category and month.
*   **`/api/reports/aging-receivables`**: GET Outstanding invoice amounts grouped by age.
*   **`/api/reports/revenue-overview`**: GET Monthly paid invoice revenue and status counts.
*   **`/api/reports/outstanding-invoices`**: GET Detailed list of outstanding invoices with aging info.
*   **`/api/reports/cash-flow`**: GET Cash flow summary and monthly breakdown.
*   **`/api/reports/transaction-metrics`**: GET Income/Expense totals, counts by type/category/account.

### 6.10. Webhooks (`/api/webhooks`)

*   **`/api/webhooks/xendit`**:
    *   `POST`: Handles incoming webhooks from Xendit (specifically `invoice.paid`). Verifies signature, updates invoice status, creates payment and transaction records.

### 6.11. Client Portal API (`/api/portal`)

*   **`/api/portal/auth/magic-link`**: POST endpoint to request a magic login link for a client email. Sends email via Resend.
*   **`/api/portal/auth/verify`**: POST endpoint to verify the magic link token, create a client session (JWT cookie).
*   **`/api/portal/auth/logout`**: POST endpoint to clear the client session cookie.
*   *(Other portal-specific data endpoints would require the `client_token` cookie for authentication)*

### 6.12. Jobs (`/api/jobs`)

*   **`/api/jobs/recurring-transactions`**:
    *   `POST`: Manually triggers the processing of recurring expenses and income. Requires admin role or API key.

### 6.13. Miscellaneous

*   **`/api/companies/current`**: GET details of the currently authenticated user's company.
*   **`/api/upload/receipt`**: POST endpoint to handle expense receipt file uploads. (Note: Current implementation has file writing commented out, likely needs adjustment for production deployment).

---

## 7. Areas for Further Documentation

*   **Testing Strategy:** Document how to write and run unit, integration, and end-to-end tests.
*   **Deployment:** Provide detailed steps for self-hosting (Docker setup, database setup, environment variables in production) and potentially Railway deployment specifics.
*   **Environment Variables:** Create a definitive list of all required `.env` variables with explanations.
*   **Permissions Deep Dive:** Document precisely which permissions are checked in each critical API endpoint or UI component.
*   **State Management:** If more complex global state management is introduced later, document its usage.
*   **Xendit & Resend Integration:** More details on error handling, retry logic, and specific configuration options used.
*   **Database Schema Diagram:** A visual representation of the database schema and relationships.
*   **Client Portal Details:** Document specific data endpoints used by the client portal beyond authentication.
*   **Recurring Transactions Job:** Details on scheduling the cron job externally (e.g., using Vercel Cron Jobs, system cron, or a third-party service).

---