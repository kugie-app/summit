Okay, here is the detailed project structure in Markdown format based on the provided file map and contents.

```markdown
# Summit - Project Structure

This document outlines the file and directory structure of the Summit invoicing application.

## Project Root (`/`)

```
/
├── .gitignore             # Specifies intentionally untracked files that Git should ignore.
├── components.json        # Configuration for shadcn/ui components.
├── drizzle.config.ts      # Configuration for Drizzle Kit (ORM migration tool).
├── drizzle/               # Drizzle ORM migration files and metadata.
├── eslint.config.mjs      # ESLint configuration (using ESM format).
├── next.config.ts         # Next.js configuration file.
├── package.json           # Project dependencies and scripts.
├── postcss.config.mjs     # PostCSS configuration (used with Tailwind CSS).
├── README.md              # Project overview and setup instructions.
├── src/                   # Main application source code.
└── tsconfig.tsbuildinfo   # TypeScript build cache file (auto-generated).
```

---

## `/drizzle` - Database Migrations

Contains files related to database schema migrations managed by Drizzle ORM.

```
/drizzle
├── meta/                  # Metadata about the migration history.
│   ├── _journal.json      # Journal file tracking applied migrations.
│   └── *.snapshot.json    # JSON snapshots of the database schema at each migration point.
└── *.sql                  # SQL files containing the actual migration scripts (schema changes).
```

---

## `/src` - Source Code

The core application code resides here.

```
/src
├── app/                   # Next.js App Router directory. Contains routing, pages, and API handlers.
├── components/            # Reusable UI components.
├── emails/                # React components for rendering email templates.
├── lib/                   # Core libraries, utilities, database logic, and external service integrations.
├── middleware.ts          # Next.js middleware for request handling (e.g., authentication).
└── types/                 # TypeScript type definitions (implicitly includes next-auth.d.ts).
```

### `/src/app` - Application Router & API

Defines the application's routes, UI pages, and API endpoints.

```
/src/app
├── (authenticated)/       # Route Group for pages requiring user authentication.
│   ├── clients/           # Client management pages.
│   │   ├── [clientId]/    # Dynamic route for individual client details.
│   │   │   └── page.tsx   # Page component for viewing a specific client.
│   │   └── page.tsx       # Page component for listing/managing clients.
│   ├── company/           # Company profile management page.
│   │   └── page.tsx       # Page component for company settings.
│   ├── dashboard/         # Main dashboard page after login.
│   │   └── page.tsx       # Page component for the main dashboard.
│   ├── expense-categories/ # Expense category management page.
│   │   └── page.tsx       # Page component for expense categories.
│   ├── expenses/          # Expense management pages.
│   │   ├── [expenseId]/   # Dynamic route for individual expenses.
│   │   │   └── edit/      # Editing an existing expense.
│   │   │       └── page.tsx # Page component for editing an expense.
│   │   ├── new/           # Creating a new expense.
│   │   │   └── page.tsx   # Page component for adding a new expense.
│   │   └── page.tsx       # Page component for listing/managing expenses.
│   ├── income/            # Income management pages.
│   │   ├── [incomeId]/    # Dynamic route for individual income records.
│   │   │   └── edit/      # Editing an existing income record.
│   │   │       └── page.tsx # Page component for editing income.
│   │   ├── new/           # Creating a new income record.
│   │   │   └── page.tsx   # Page component for adding new income.
│   │   └── page.tsx       # Page component for listing/managing income.
│   ├── income-categories/ # Income category management page.
│   │   └── page.tsx       # Page component for income categories.
│   ├── invoices/          # Invoice management pages.
│   │   ├── [invoiceId]/   # Dynamic route for individual invoices.
│   │   │   ├── edit/      # Editing an existing invoice.
│   │   │   │   └── page.tsx # Page component for editing an invoice.
│   │   │   ├── print/     # Invoice printing preview page.
│   │   │   │   └── page.tsx # Page component for printing an invoice.
│   │   │   └── page.tsx   # Page component for viewing a specific invoice.
│   │   ├── new/           # Creating a new invoice.
│   │   │   └── page.tsx   # Page component for creating a new invoice.
│   │   └── page.tsx       # Page component for listing/managing invoices.
│   ├── quotes/            # Quote management pages.
│   │   ├── [quoteId]/     # Dynamic route for individual quotes.
│   │   │   └── page.tsx   # Page component for viewing a specific quote.
│   │   ├── new/           # Creating a new quote.
│   │   │   └── page.tsx   # Page component for creating a new quote.
│   │   └── page.tsx       # Page component for listing/managing quotes.
│   ├── recurring-transactions/ # Page for managing recurring items.
│   │   └── page.tsx       # Page component for recurring transactions.
│   ├── reports/           # Reports page.
│   │   └── page.tsx       # Page component for viewing reports.
│   ├── settings/          # Application and user settings page.
│   │   └── page.tsx       # Page component for settings.
│   └── vendors/           # Vendor management page.
│       └── page.tsx       # Page component for listing/managing vendors.
├── api/                   # API Route Handlers.
│   ├── accounts/          # API endpoints for managing financial accounts.
│   │   ├── [accountId]/   # Endpoints for a specific account.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific account.
│   │   └── route.ts       # Handler for GET (list), POST (create) accounts.
│   ├── auth/              # Authentication related API endpoints.
│   │   ├── [...nextauth]/ # Catch-all route for NextAuth.js core functionality.
│   │   │   └── route.ts   # NextAuth.js main handler.
│   │   ├── clear-session/ # Endpoint to clear the NextAuth session.
│   │   │   └── route.ts   # Handler for clearing session cookies.
│   │   └── register/      # Endpoint for user registration.
│   │       └── route.ts   # Handler for user sign-up.
│   ├── clients/           # API endpoints for managing clients.
│   │   ├── [clientId]/    # Endpoints for a specific client.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific client.
│   │   └── route.ts       # Handler for GET (list), POST (create) clients.
│   ├── companies/         # API endpoints for company information.
│   │   └── current/       # Endpoint for the currently authenticated user's company.
│   │       └── route.ts   # Handler to GET current company details.
│   ├── cron/              # Endpoints intended to be called by external cron services.
│   │   └── process-recurring/ # Endpoint to trigger recurring item processing.
│   │       └── route.ts   # Handler for processing recurring jobs.
│   ├── download/          # Endpoints for file downloads.
│   │   └── receipt/       # Endpoint for downloading expense receipts.
│   │       └── route.ts   # Handler to get presigned URL for receipt download.
│   ├── expense-categories/ # API endpoints for expense categories.
│   │   ├── [categoryId]/  # Endpoints for a specific category.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific category.
│   │   └── route.ts       # Handler for GET (list), POST (create) categories.
│   ├── expenses/          # API endpoints for expenses.
│   │   ├── [expenseId]/   # Endpoints for a specific expense.
│   │   │   ├── status/    # Endpoint to update expense status.
│   │   │   │   └── route.ts # Handler to PATCH expense status.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific expense.
│   │   └── route.ts       # Handler for GET (list), POST (create) expenses.
│   ├── income/            # API endpoints for income records.
│   │   ├── [incomeId]/    # Endpoints for a specific income record.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific income record.
│   │   └── route.ts       # Handler for GET (list), POST (create) income records.
│   ├── income-categories/ # API endpoints for income categories.
│   │   ├── [categoryId]/  # Endpoints for a specific category.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific category.
│   │   └── route.ts       # Handler for GET (list), POST (create) categories.
│   ├── invitations/       # API endpoints for user invitations.
│   │   ├── [invitationId]/ # Endpoints for a specific invitation.
│   │   │   └── route.ts   # Handler for DELETE (cancel) an invitation.
│   │   ├── accept/        # Endpoint for accepting an invitation.
│   │   │   └── route.ts   # Handler to POST accepted invitation details.
│   │   ├── verify/        # Endpoint to verify an invitation token.
│   │   │   └── route.ts   # Handler to GET verification status.
│   │   └── route.ts       # Handler for GET (list), POST (create) invitations.
│   ├── invoices/          # API endpoints for invoices.
│   │   ├── [invoiceId]/   # Endpoints for a specific invoice.
│   │   │   ├── create-xendit-invoice/ # Endpoint to create Xendit payment link.
│   │   │   │   └── route.ts # Handler to POST request for Xendit invoice.
│   │   │   ├── pdf/       # Endpoint to generate PDF for an invoice.
│   │   │   │   └── route.ts # Handler to GET invoice PDF.
│   │   │   ├── send-email/ # Endpoint to send invoice via email.
│   │   │   │   └── route.ts # Handler to POST email sending request.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific invoice.
│   │   └── route.ts       # Handler for GET (list), POST (create) invoices.
│   ├── jobs/              # Endpoints related to background jobs.
│   │   └── recurring-transactions/ # Endpoint to manually trigger recurring jobs.
│   │       └── route.ts   # Handler to POST trigger request.
│   ├── portal/            # API endpoints specific to the client portal.
│   │   └── auth/          # Client portal authentication endpoints.
│   │       ├── logout/    # Endpoint for client logout.
│   │       │   └── route.ts # Handler to POST logout request.
│   │       ├── magic-link/ # Endpoint to request a magic login link.
│   │       │   └── route.ts # Handler to POST email for magic link.
│   │       └── verify/    # Endpoint to verify a magic link token.
│   │           └── route.ts # Handler to POST token for verification.
│   ├── quotes/            # API endpoints for quotes.
│   │   ├── [quoteId]/     # Endpoints for a specific quote.
│   │   │   ├── convert-to-invoice/ # Endpoint to convert quote to invoice.
│   │   │   │   └── route.ts # Handler to POST conversion request.
│   │   │   ├── pdf/       # Endpoint to generate PDF for a quote.
│   │   │   │   └── route.ts # Handler to GET quote PDF.
│   │   │   ├── send-email/ # Endpoint to send quote via email.
│   │   │   │   └── route.ts # Handler to POST email sending request.
│   │   │   ├── status/    # Endpoint to update quote status.
│   │   │   │   └── route.ts # Handler to PATCH quote status.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific quote.
│   │   └── route.ts       # Handler for GET (list), POST (create) quotes.
│   ├── reports/           # API endpoints for generating reports.
│   │   ├── aging-receivables/ # Endpoint for aging receivables report.
│   │   │   └── route.ts   # Handler to GET aging receivables data.
│   │   ├── cash-flow/     # Endpoint for cash flow report.
│   │   │   └── route.ts   # Handler to GET cash flow data.
│   │   ├── expense-breakdown/ # Endpoint for expense breakdown report.
│   │   │   └── route.ts   # Handler to GET expense breakdown data.
│   │   ├── income-vs-expenses/ # Endpoint for income vs expenses report.
│   │   │   └── route.ts   # Handler to GET income vs expenses data.
│   │   ├── invoice-summary/ # Endpoint for invoice summary report.
│   │   │   └── route.ts   # Handler to GET invoice summary data.
│   │   ├── outstanding-invoices/ # Endpoint for outstanding invoices report.
│   │   │   └── route.ts   # Handler to GET outstanding invoices data.
│   │   ├── profit-loss/   # Endpoint for profit & loss report.
│   │   │   └── route.ts   # Handler to GET profit & loss data.
│   │   ├── revenue-overview/ # Endpoint for revenue overview report.
│   │   │   └── route.ts   # Handler to GET revenue overview data.
│   │   └── transaction-metrics/ # Endpoint for transaction metrics report.
│   │       └── route.ts   # Handler to GET transaction metrics data.
│   ├── transactions/      # API endpoints for financial transactions.
│   │   ├── [transactionId]/ # Endpoints for a specific transaction.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific transaction.
│   │   └── route.ts       # Handler for GET (list), POST (create) transactions.
│   ├── upload/            # Endpoints for file uploads.
│   │   └── receipt/       # Endpoint for uploading expense receipts.
│   │       └── route.ts   # Handler to POST receipt file.
│   ├── users/             # API endpoints for user management.
│   │   ├── [userId]/      # Endpoints for a specific user.
│   │   │   └── route.ts   # Handler for DELETE on a specific user.
│   │   └── route.ts       # Handler for GET (list) users.
│   ├── vendors/           # API endpoints for vendors.
│   │   ├── [vendorId]/    # Endpoints for a specific vendor.
│   │   │   └── route.ts   # Handler for GET, PUT, DELETE on a specific vendor.
│   │   └── route.ts       # Handler for GET (list), POST (create) vendors.
│   └── webhooks/          # Endpoints for receiving webhooks from external services.
│       └── xendit/        # Webhook endpoint for Xendit payment gateway.
│           └── route.ts   # Handler to POST Xendit webhook events.
├── auth/                  # Public authentication pages.
│   ├── signin/            # Sign-in page.
│   │   └── page.tsx       # Page component for user sign-in.
│   └── signup/            # Sign-up page.
│       └── page.tsx       # Page component for user registration.
├── portal/                # Client portal section.
│   ├── dashboard/         # Client portal dashboard.
│   │   └── page.tsx       # Page component for client dashboard.
│   ├── invoices/          # Client portal invoices page.
│   │   └── page.tsx       # Page component listing client invoices.
│   ├── login/             # Client portal login page.
│   │   ├── login-form.tsx # Reusable login form component for the portal.
│   │   └── page.tsx       # Page component for client login.
│   ├── quotes/            # Client portal quotes page.
│   │   └── page.tsx       # Page component listing client quotes.
│   ├── verify/            # Page for verifying magic link token.
│   │   └── page.tsx       # Page component handling token verification.
│   └── layout.tsx         # Layout specific to the client portal.
├── accept-invitation/     # Page for accepting a company invitation.
│   └── page.tsx           # Page component for the invitation acceptance form.
├── access-denied/         # Page shown when a user lacks permissions.
│   └── page.tsx           # Page component for the access denied message.
├── globals.css            # Global CSS styles, including Tailwind directives.
├── layout.tsx             # Root layout component for the entire application.
└── page.tsx               # Root page component (likely redirects to dashboard).
```

### `/src/components` - UI Components

Contains reusable React components used throughout the application.

```
/src/components
├── auth/                  # Components related to authentication/authorization.
│   ├── PermissionGuard.tsx # Client component to conditionally render based on permissions.
│   └── RoleGuard.tsx      # Client component to conditionally render based on user roles.
├── clients/               # Components specific to client management.
│   ├── ClientDialog.tsx   # Dialog component for adding/editing clients.
│   ├── ClientForm.tsx     # Form component for client data.
│   └── ClientsTable.tsx   # Table component for displaying clients.
├── dashboard/             # Components specific to the main dashboard.
│   ├── AgingReceivablesChart.tsx # Chart for aging receivables visualization.
│   ├── ProfitLossChart.tsx # Chart for profit & loss visualization.
│   ├── RecurringTransactionsButton.tsx # Button to trigger recurring jobs.
│   └── StatCard.tsx       # Reusable card for displaying key statistics.
├── expenses/              # Components specific to expense management.
│   ├── ExpenseCategoriesPage.tsx # Component rendering the expense categories page content.
│   ├── ExpenseForm.tsx    # Form component for expense data.
│   └── ExpensesPage.tsx   # Component rendering the main expenses page content.
├── income/                # Components specific to income management.
│   ├── IncomeCategoriesPage.tsx # Component rendering the income categories page content.
│   ├── IncomeForm.tsx     # Form component for income data.
│   └── IncomePage.tsx     # Component rendering the main income page content.
├── invoices/              # Components specific to invoice management.
│   ├── InvoiceForm.tsx    # Form component for creating/editing invoices.
│   ├── InvoiceItemForm.tsx # Form component for individual invoice line items.
│   ├── InvoiceList.tsx    # Component displaying a list/table of invoices.
│   └── InvoicePDF.tsx     # (Duplicate/Old?) PDF component for invoices (see /pdf).
├── layout/                # Components used for the main application layout.
│   ├── Header.tsx         # Top navigation header component.
│   └── Sidebar.tsx        # Sidebar navigation component.
├── pdf/                   # Components specifically for generating PDFs.
│   ├── InvoicePDF.tsx     # React-pdf component for rendering Invoice PDFs.
│   └── QuotePDF.tsx       # React-pdf component for rendering Quote PDFs.
├── quotes/                # Components specific to quote management.
│   ├── QuoteForm.tsx      # Form component for creating/editing quotes.
│   ├── QuoteItemForm.tsx  # Form component for individual quote line items.
│   ├── QuoteList.tsx      # Component displaying a list/table of quotes.
│   └── QuotePDF.tsx       # (Duplicate/Old?) PDF component for quotes (see /pdf).
├── ui/                    # Base UI components from shadcn/ui.
│   ├── alert-dialog.tsx   # Alert dialog component.
│   ├── alert.tsx          # Alert component.
│   ├── badge.tsx          # Badge component.
│   ├── button.tsx         # Button component.
│   ├── calendar.tsx       # Calendar component.
│   ├── card.tsx           # Card component.
│   ├── dialog.tsx         # Dialog component.
│   ├── dropdown-menu.tsx  # Dropdown menu component.
│   ├── form.tsx           # Form component wrappers (integrates react-hook-form).
│   ├── input.tsx          # Input component.
│   ├── label.tsx          # Label component.
│   ├── popover.tsx        # Popover component.
│   ├── radio-group.tsx    # Radio group component.
│   ├── select.tsx         # Select dropdown component.
│   ├── separator.tsx      # Separator line component.
│   ├── sonner.tsx         # Sonner toast notification component wrapper.
│   ├── switch.tsx         # Switch toggle component.
│   ├── table.tsx          # Table components (Header, Body, Row, Cell, etc.).
│   ├── tabs.tsx           # Tabs component.
│   └── textarea.tsx       # Textarea component.
├── vendors/               # Components specific to vendor management.
│   ├── VendorForm.tsx     # Form component for vendor data.
│   └── VendorsList.tsx    # Component displaying a list/table of vendors.
├── NextAuthProvider.tsx   # Provider component for NextAuth session context.
└── ThemeProvider.tsx      # Provider component for managing light/dark themes.
```

### `/src/emails` - Email Templates

Contains React components used by Resend to render email content.

```
/src/emails
├── InvitationEmail.tsx    # Email template for inviting new users.
├── InvoiceEmail.tsx       # Email template for sending invoices.
├── MagicLinkEmail.tsx     # Email template for client portal magic link login.
└── QuoteEmail.tsx         # Email template for sending quotes.
```

### `/src/lib` - Libraries and Utilities

Contains core logic, utilities, database interactions, external service integrations, and validation schemas.

```
/src/lib
├── auth/                  # Authentication and authorization logic.
│   ├── client/            # Client-side specific authentication utilities.
│   │   └── utils.ts       # Utils for client-side auth (JWT handling, session checks).
│   ├── permissions/       # Role-based access control (RBAC) logic.
│   │   ├── roles.ts       # Defines user roles and associated helper functions.
│   │   ├── server.ts      # Server-side permission/role checking utilities.
│   │   └── utils.ts       # Utility functions for permissions (e.g., getting permissions by role).
│   └── options.ts         # NextAuth.js configuration options.
├── cron/                  # Logic related to cron jobs.
│   └── recurring-items.ts # Functions to process recurring invoices, expenses, income.
├── db/                    # Database related files.
│   ├── migrations/        # Drizzle ORM generated migration files.
│   │   ├── meta/          # Migration metadata (_journal.json, snapshots).
│   │   └── *.sql          # SQL migration scripts.
│   ├── queries/           # Custom or complex database query logic.
│   │   └── company-scoped.ts # Utility functions for ensuring queries are company-scoped.
│   ├── index.ts           # Drizzle ORM client initialization.
│   └── schema.ts          # Drizzle ORM database schema definitions (tables, enums, relations).
├── jobs/                  # Definitions for background or scheduled jobs.
│   ├── cron-config.ts     # Configuration constants for cron jobs.
│   └── recurring-transactions.ts # Logic for the recurring transactions job.
├── reports/               # Logic for generating various financial reports.
│   ├── cash-flow.ts       # Functions for generating cash flow reports.
│   ├── invoice-reports.ts # Functions for generating invoice-related reports (summary, aging).
│   └── profit-loss.ts     # Functions for generating profit and loss reports.
├── validations/           # Zod schemas for validating data across the application.
│   ├── account.ts         # Validation schema for financial accounts.
│   ├── client.ts          # Validation schema for clients.
│   ├── expense.ts         # Validation schema for expenses and categories.
│   ├── income.ts          # Validation schema for income and categories.
│   ├── invoice.ts         # Validation schema for invoices and items.
│   ├── payment.ts         # Validation schema for payments.
│   ├── quote.ts           # Validation schema for quotes and items.
│   └── transaction.ts     # Validation schema for financial transactions.
├── xendit/                # Integration logic for Xendit payment gateway.
│   └── index.ts           # Xendit client initialization and helper functions.
├── minio.ts               # MinIO client setup and file operation helpers.
├── pdf.ts                 # Utility functions for PDF generation using @react-pdf/renderer.
└── utils.ts               # General utility functions (e.g., `cn` for classnames, formatting).
```

### `/src/middleware.ts`

Handles incoming requests before they reach page or API routes. Primarily used for route protection and authentication checks based on user session or client token.

### `/src/types`

(Implicitly includes `next-auth.d.ts`) Contains global or shared TypeScript type definitions, such as extending the NextAuth Session type.
```