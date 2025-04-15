"You are an expert full-stack developer. Your task is to help me build a Business Internal Invoicing Application based on the provided requirements. We will proceed step-by-step through different phases. Please generate the necessary code, configurations, components, API endpoints, and database schemas as requested in each step. Pay close attention to the specified tech stack: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, ShadCN UI, Neon PostgreSQL, Drizzle ORM, React Email, and Resend. **We will use Xendit for payment processing.** Ensure code quality, type safety, adherence to best practices, and include necessary comments."

---

### Phase 0: Project Setup & Foundations
**(Feed these steps sequentially to Cursor AI)**

1.  **Initialize Next.js Project:**
    *   "Initialize a new Next.js 15 project named `internal-invoicing-app` using `create-next-app`. Ensure TypeScript, Tailwind CSS, and the App Router are selected during setup."
    *   "Verify the basic project structure and run the development server (`npm run dev` or `yarn dev`) to ensure it works."

2.  **Install Core Dependencies:**
    *   "Install the following core dependencies:
        *   ShadCN UI (`npx shadcn-ui@latest init`) - Configure it according to its documentation (accept defaults for globals.css, CSS variables, etc.).
        *   Drizzle ORM and Neon Adapter (`npm install drizzle-orm @neondatabase/serverless drizzle-kit pg`)
        *   React Email and Resend (`npm install react-email @react-email/components resend`)
        *   Authentication Library (e.g., NextAuth.js: `npm install next-auth`)
        *   Validation Library (e.g., Zod: `npm install zod`)
        *   Icon Library (e.g., `lucide-react`: `npm install lucide-react`)"

3.  **Configure Tailwind CSS v4 & ShadCN UI:**
    *   "Ensure Tailwind CSS v4 is correctly configured in `tailwind.config.ts`. Follow ShadCN UI documentation to install a few basic components we'll need soon: `button`, `input`, `label`, `card`, `dropdown-menu`, `dialog`, `form`, `table`, `sonner`. For example: `npx shadcn-ui@latest add button input label card dropdown-menu dialog form table sonner`."
    *   "Set up dark/light mode toggle functionality using ShadCN's recommended approach (`useTheme` from `next-themes`). Install `next-themes` (`npm install next-themes`)."

4.  **Set up Database Connection (Neon):**
    *   "Create a new project on [Neon](https://neon.tech/). Obtain the PostgreSQL connection string (specifically the `DATABASE_URL` for pooled connections)."
    *   "Create a `.env.local` file in the project root. Add the `DATABASE_URL` variable with the connection string from Neon."
    *   "Create a `src/lib/db/index.ts` file. Initialize the Drizzle client using `@neondatabase/serverless` and the `DATABASE_URL` from environment variables."

5.  **Initialize Drizzle ORM:**
    *   "Create a `drizzle.config.ts` file in the project root. Configure it for PostgreSQL, pointing to the schema file (we'll create it next) and the output directory for migrations (`src/lib/db/migrations`). Use the `DATABASE_URL`."
    *   "Create an initial schema file at `src/lib/db/schema.ts`. Define a simple placeholder table (e.g., `test`) just to verify the setup."
    *   "Add scripts to `package.json` for generating migrations (`drizzle-kit generate:pg`) and pushing schema changes (`drizzle-kit push:pg`)."
    *   "Generate the initial migration: `npm run <your-generate-script-name>`. Verify the migration file is created in the specified output directory."
    *   "Push the initial schema to Neon: `npm run <your-push-script-name>`. Verify the table exists in your Neon database console."

6.  **Basic App Layout:**
    *   "Create a basic layout in `src/app/layout.tsx` using ShadCN UI components. Include a persistent sidebar/navigation component (`src/components/layout/Sidebar.tsx`) and a header component (`src/components/layout/Header.tsx`). The main content area should render the `children` prop."
    *   "Populate the Sidebar with placeholder links for future sections (Dashboard, Clients, Invoices, Expenses, etc.)."
    *   "Include the `ThemeProvider` and `Toaster` component in the root layout."

7.  **Basic Authentication Setup (NextAuth.js):**
    *   "Set up NextAuth.js. Create the API route handler at `src/app/api/auth/[...nextauth]/route.ts`."
    *   "Configure a basic `CredentialsProvider` for email/password login initially. We will enhance this later with roles."
    *   "Define the User session and JWT structure in `src/lib/auth/options.ts` (or similar)."
    *   "Add a `users` table to `src/lib/db/schema.ts` with fields for `id`, `name`, `email` (unique), `password` (hashed), `role`, `companyId` (nullable for now), `createdAt`, `updatedAt`. Add `softDelete` boolean field."
    *   "Update Drizzle config and generate/push the migration for the `users` table."
    *   "Implement basic sign-up and sign-in pages (`src/app/auth/signin/page.tsx`, `src/app/auth/signup/page.tsx`) using ShadCN `Form` components and Zod for validation. Hash passwords before saving."
    *   "Wrap the root layout (`src/app/layout.tsx`) with the NextAuth `SessionProvider`."
    *   "Protect a sample page (e.g., a new `/dashboard` page) to require authentication using NextAuth middleware (`middleware.ts` in the root or `src` directory)."
    *   "Update the Header component to show user information and a sign-out button if logged in, or a sign-in button if not."

---

### Phase 1: Core Data Models & Client Management

1.  **Define Core Schemas:**
    *   "Refine the `users` schema in `src/lib/db/schema.ts`. Define an enum for `role` (e.g., `admin`, `staff`, `accountant`)."
    *   "Define the `companies` schema: `id`, `name`, `address`, `createdAt`, `updatedAt`, `softDelete`."
    *   "Define the `clients` schema: `id`, `companyId` (foreign key to `companies`), `name`, `email`, `phone`, `address`, `paymentTerms`, `createdAt`, `updatedAt`, `softDelete`."
    *   "Establish relationships: A `user` belongs to one `company`. A `client` belongs to one `company`. A `company` can have many `users` and many `clients`."
    *   "Add appropriate indexes (e.g., on `companyId` in `users` and `clients`, on `email` in `users`)."
    *   "Update `drizzle.config.ts` if needed. Generate and push migrations."

2.  **Company Scoping Logic:**
    *   "Update the sign-up process: When a user signs up, also create a new `company` record and associate the user with it (set their `companyId`). Alternatively, implement logic for inviting users to an existing company (See Phase 5)."
    *   "Modify database query functions/helpers (create a `src/lib/db/queries.ts` or similar) to ensure that all data access (clients, invoices, etc.) is scoped to the logged-in user's `companyId`."

3.  **Client CRUD API:**
    *   "Create API Route Handlers in `src/app/api/clients/route.ts` (for POST, GET list) and `src/app/api/clients/[clientId]/route.ts` (for GET single, PUT, DELETE)."
    *   "Implement authentication checks and company scoping in these API routes. Only users belonging to the correct company should access/modify clients."
    *   "Use Zod for validating request bodies (POST, PUT)."
    *   "Implement soft deletes for the DELETE operation (update the `softDelete` flag)."
    *   "Implement proper error handling and return meaningful status codes."
    *   "Add logging for API requests and potential errors."

4.  **Client Management UI:**
    *   "Create a page at `src/app/(authenticated)/clients/page.tsx` (assuming `(authenticated)` is a route group protected by middleware)."
    *   "Use ShadCN `Table` component to display a list of clients for the logged-in user's company. Fetch data from the `GET /api/clients` endpoint."
    *   "Implement pagination for the client list if anticipating large numbers."
    *   "Add a 'Create Client' button that opens a ShadCN `Dialog` or navigates to a new page (`/clients/new`)."
    *   "Create a form (`src/components/forms/ClientForm.tsx`) using ShadCN `Form`, `Input`, `Textarea`, etc., and Zod for frontend validation, for creating and editing clients."
    *   "Implement client creation logic (POST to `/api/clients`)."
    *   "Implement client editing logic (fetch client data for `/clients/[clientId]/edit` or within a Dialog, PUT to `/api/clients/[clientId]`)."
    *   "Implement client deletion logic (DELETE to `/api/clients/[clientId]`, using a confirmation dialog)."
    *   "Display client details on a dedicated page (`/clients/[clientId]/page.tsx`)."
    *   "Use ShadCN `sonner` for user feedback on success/error."

---

### Phase 2: Invoice & Quote Management

1.  **Define Invoice/Quote Schemas:**
    *   "Define `invoices` schema: `id`, `companyId`, `clientId`, `invoiceNumber`, `status` (enum: `draft`, `sent`, `paid`, `overdue`, `void`), `issueDate`, `dueDate`, `subtotal`, `taxAmount`, `totalAmount`, `notes`, `currency` (add multi-currency support early), `createdAt`, `updatedAt`, `softDelete`, `xenditInvoiceId` (varchar, nullable, unique index), `xenditInvoiceUrl` (varchar, nullable)."
    *   "Define `invoiceItems` schema: `id`, `invoiceId`, `description`, `quantity`, `unitPrice`, `total`, `createdAt`, `updatedAt`."
    *   "Define `quotes` schema (similar to `invoices` but may have different fields like `expiryDate`, status enum: `draft`, `sent`, `accepted`, `rejected`). Remove Xendit fields unless quotes also need payment links."
    *   "Define `quoteItems` schema (similar to `invoiceItems`)."
    *   "Establish relationships: Invoice/Quote belongs to Company and Client. Invoice/Quote has many Items."
    *   "Add indexes (e.g., on `companyId`, `clientId`, `status` for invoices/quotes; unique on `xenditInvoiceId`)."
    *   "Generate and push migrations."

2.  **Invoice/Quote CRUD API:**
    *   "Create API routes for Invoices (`/api/invoices`, `/api/invoices/[invoiceId]`) and Quotes (`/api/quotes`, `/api/quotes/[quoteId]`)."
    *   "Implement CRUD operations ensuring company scoping and authentication."
    *   "Handle creation/updating/deletion of associated items (`invoiceItems`, `quoteItems`) within the main Invoice/Quote API calls (transactional updates if possible with Drizzle)."
    *   "Implement logic for generating unique, sequential `invoiceNumber`/`quoteNumber` (scoped per company)."
    *   "Validate input using Zod schemas."
    *   "Implement status update logic (e.g., an endpoint `/api/invoices/[invoiceId]/send` to change status from `draft` to `sent`). Implement logic to void invoices."

3.  **Invoice/Quote Management UI:**
    *   "Create pages for listing Invoices (`/invoices`) and Quotes (`/quotes`). Use ShadCN `Table` with filtering/sorting options (by status, client, date)."
    *   "Implement 'Create Invoice/Quote' functionality, likely navigating to a dedicated page (`/invoices/new`, `/quotes/new`)."
    *   "Develop a form component (`src/components/forms/InvoiceForm.tsx`, `QuoteForm.tsx`) using ShadCN components."
        *   "Include fields for client selection (dropdown fetching from `/api/clients`), dates (use ShadCN `DatePicker`), currency selection."
        *   "Implement dynamic item entry (add/remove item rows), calculating subtotal, tax, and total automatically on the frontend."
        *   "Use Zod for form validation."
    *   "Implement viewing/editing pages (`/invoices/[invoiceId]`, `/quotes/[quoteId]`). Pre-fill the form for editing."
    *   "Display status prominently using badges (ShadCN `Badge`)."
    *   "Add buttons for actions like 'Mark as Sent', 'Edit', 'Delete' (soft delete), 'Void'."

4.  **Basic PDF Generation:**
    *   "Choose a PDF generation library (e.g., `@react-pdf/renderer` for client-side or `pdf-lib`/`puppeteer` for server-side generation via an API endpoint)."
    *   "**If server-side (recommended for consistency):** Create an API route like `/api/invoices/[invoiceId]/pdf`. Fetch invoice data, render an HTML template (or use a dedicated PDF library structure), and return the PDF file."
    *   "**If client-side:** Use `@react-pdf/renderer` to create PDF components based on invoice data. Provide a download button on the invoice view page."
    *   "Create a basic, professional-looking PDF template for invoices and quotes, including company logo (placeholder), client details, itemized list, totals, payment terms, notes."

5.  **Email Functionality Setup (React Email & Resend):**
    *   "Set up Resend: Sign up, get an API key, and verify your domain."
    *   "Add the `RESEND_API_KEY` to your `.env.local` file."
    *   "Create basic email templates using React Email (`src/emails/InvoiceEmail.tsx`, `QuoteEmail.tsx`). Include placeholders for dynamic data (client name, invoice number, amount, link to view)."
    *   "Create an API endpoint (e.g., `/api/invoices/[invoiceId]/send-email`) that:
        *   Fetches invoice data.
        *   Generates the PDF (or fetches it if already generated).
        *   Renders the React Email template to HTML.
        *   Uses the Resend SDK to send the email with the PDF attached to the client's email address.
        *   Updates the invoice status to 'sent'."
    *   "Add a 'Send Email' button to the Invoice/Quote view UI (enabled for 'draft' status)."

---

### Phase 3: Expense & Income Tracking

1.  **Define Expense/Income Schemas:**
    *   "Define `expenseCategories` schema: `id`, `companyId`, `name`."
    *   "Define `expenses` schema: `id`, `companyId`, `categoryId`, `vendor`, `description`, `amount`, `currency`, `expenseDate`, `receiptUrl` (for uploaded receipts), `status` (enum: `pending`, `approved`, `rejected`), `recurring` (enum: `none`, `daily`, `weekly`, `monthly`, `yearly`), `nextDueDate` (if recurring), `createdAt`, `updatedAt`, `softDelete`."
    *   "Define `incomeCategories` schema: `id`, `companyId`, `name`."
    *   "Define `income` schema: `id`, `companyId`, `categoryId`, `clientId` (optional), `invoiceId` (optional), `source`, `description`, `amount`, `currency`, `incomeDate`, `recurring` (enum), `nextDueDate`, `createdAt`, `updatedAt`, `softDelete`."
    *   "Add relationships and indexes."
    *   "Generate and push migrations."

2.  **Expense/Income CRUD API:**
    *   "Create API routes for Expenses (`/api/expenses`, `/api/expenses/[expenseId]`) and Income (`/api/income`, `/api/income/[incomeId]`)."
    *   "Create API routes for managing Categories (`/api/expense-categories`, `/api/income-categories`)."
    *   "Implement CRUD operations with authentication and company scoping."
    *   "For expense creation/update, handle file uploads for receipts. Use a service like Vercel Blob, AWS S3, or Cloudinary and store the URL in `receiptUrl`. Create an API endpoint specifically for uploads (e.g., `/api/upload/receipt`)."
    *   "Implement logic for handling recurring expenses/income (to be processed later by a cron job)."

3.  **Expense/Income Management UI:**
    *   "Create pages for listing Expenses (`/expenses`) and Income (`/income`). Use ShadCN `Table` with filtering (by category, status, date range)."
    *   "Implement forms (`ExpenseForm.tsx`, `IncomeForm.tsx`) for creating/editing entries."
        *   "Include category selection (dropdowns populated from category APIs)."
        *   "Include date pickers, currency inputs."
        *   "For expenses, add a file input for receipt uploads. Show uploaded receipt links/previews."
        *   "Add fields for recurring settings."
    *   "Display status for expenses."
    *   "Implement basic approval workflow UI for expenses (e.g., buttons for 'Approve'/'Reject' visible to specific roles - requires role implementation from Phase 0/5)."

---

### Phase 4: Payment Processing & Account Management

1.  **Define Payment/Account Schemas:**
    *   "Define `accounts` schema: `id`, `companyId`, `name` (e.g., 'Business Checking'), `type` (enum: `bank`, `credit_card`, `cash`), `currency`, `accountNumber` (optional, store securely if needed), `initialBalance`, `currentBalance`, `createdAt`, `updatedAt`, `softDelete`."
    *   "Define `transactions` schema: `id`, `companyId`, `accountId`, `type` (enum: `debit`, `credit`), `description`, `amount`, `currency`, `transactionDate`, `categoryId` (optional, link to expense/income categories), `relatedInvoiceId` (optional), `relatedExpenseId` (optional), `relatedIncomeId` (optional), `reconciled` (boolean), `createdAt`, `updatedAt`."
    *   "Define `payments` schema: `id`, `companyId`, `invoiceId`, `clientId`, `amount`, `currency`, `paymentDate`, `paymentMethod` (enum: `xendit`, `bank_transfer`, `cash`, `other`), `transactionId` (optional, link to a transaction record), `paymentProcessorReference` (e.g., Xendit payment ID, nullable), `status` (enum: `pending`, `completed`, `failed`), `notes`, `createdAt`, `updatedAt`."
    *   "Establish relationships: Payment links to Invoice, Client, potentially Transaction. Transaction links to Account."
    *   "Generate and push migrations."

2.  **Account/Payment CRUD API:**
    *   "Create API routes for Accounts (`/api/accounts`, `/api/accounts/[accountId]`)."
    *   "Create API routes for Payments (`/api/payments`, `/api/payments/[paymentId]`). Implement logic to update the related invoice status (`paid` or partially paid) when a payment is recorded *manually* (e.g., cash, bank transfer)."
    *   "Create API routes for Transactions (`/api/transactions`, `/api/transactions/[transactionId]`). When creating a transaction related to an invoice payment, expense, or income, update the account balance accordingly."

3.  **Payment/Account Management UI:**
    *   "Create an 'Accounts' page (`/accounts`) listing all financial accounts with balances. Allow creating/editing accounts via forms."
    *   "Create a 'Record Manual Payment' feature (perhaps a button on the Invoice view page or a dedicated `/payments/new` page)."
        *   "Form should allow selecting the invoice, client (auto-filled from invoice), amount, date, payment method (excluding 'xendit' perhaps)."
        *   "Submitting the form should hit the `POST /api/payments` endpoint."
    *   "Display payments related to an invoice on the invoice view page."
    *   "Create a 'Transactions' page (`/accounts/[accountId]/transactions`) listing transactions for a specific account. Include filtering and sorting."
    *   "Implement a basic UI for account reconciliation: display transactions, allow users to mark them as 'reconciled' against bank statements (perhaps just a checkbox initially)."

4.  **(Optional/Advanced) Payment Integration (Xendit):**
    *   "Integrate with Xendit: Set up a Xendit account ([https://www.xendit.co/](https://www.xendit.co/)), obtain your API Keys (Secret Key)."
    *   "Add `XENDIT_SECRET_KEY` to your `.env.local` file. Also, generate and add a `XENDIT_CALLBACK_VERIFICATION_TOKEN` to `.env.local` (you'll set this in the Xendit dashboard later)."
    *   "Install the Xendit Node.js SDK: `npm install xendit-node`."
    *   "Create an API endpoint (e.g., `/api/invoices/[invoiceId]/create-xendit-invoice`) that:
        *   Checks if the user is authenticated and the invoice belongs to their company.
        *   Fetches invoice and client details.
        *   Initializes the Xendit client (`const x = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY });`).
        *   Uses the `Invoice` API (`x.Invoice.createInvoice({...})`) to create a payment request.
        *   **Crucially, set the `external_id` parameter to your internal `invoiceId` or `invoiceNumber` for easy reconciliation.**
        *   Include `amount`, `currency`, `payer_email` (from client), `description` (e.g., "Payment for Invoice #...").
        *   Set `success_redirect_url` and `failure_redirect_url` pointing back to appropriate pages in your application (e.g., `/invoices/[invoiceId]?payment=success`).
        *   Optionally set `invoice_duration` (how long the link is valid).
        *   On successful creation by Xendit:
            *   Store the returned Xendit `id` in the `invoices.xenditInvoiceId` field.
            *   Store the returned `invoice_url` in the `invoices.xenditInvoiceUrl` field.
            *   Update the invoice status if needed (e.g., if it transitions from `draft` upon link creation).
            *   Return the `invoice_url` to the frontend."
    *   "Set up a Xendit Callback (Webhook) endpoint: `/api/webhooks/xendit`.
        *   Configure this URL in your Xendit Dashboard under Settings > Callbacks. Set the Verification Token to match `XENDIT_CALLBACK_VERIFICATION_TOKEN`.
        *   Implement the API route handler:
            *   Verify the incoming request's signature using the `x-callback-token` header and your stored verification token. Respond with 401/403 if verification fails.
            *   Parse the JSON payload from Xendit. Expect events like `invoice.paid`.
            *   Extract the `external_id` from the payload to identify your internal invoice.
            *   Extract payment details (amount paid, payment ID, payment channel, timestamp).
            *   **Logic:**
                *   Find the corresponding invoice using `external_id`.
                *   Check if a payment record for this specific Xendit transaction already exists (use Xendit's payment ID or invoice ID stored in `paymentProcessorReference`). If yes, potentially ignore or log as duplicate.
                *   Create a new record in your `payments` table: set `paymentMethod` to `'xendit'`, store Xendit's payment/invoice ID in `paymentProcessorReference`, set `status` to `'completed'`, record `amount` and `paymentDate`.
                *   Update the corresponding invoice status to `'paid'` (or check if partially paid based on total amount).
                *   (Optional) Create a corresponding entry in the `transactions` table linked to an appropriate account.
            *   Respond to Xendit with a 200 OK status code upon successful processing."
    *   "In the Invoice View UI (`/invoices/[invoiceId]`):
        *   If the invoice has an `xenditInvoiceUrl`, display a 'Pay Now' button linking to it.
        *   Alternatively, add a 'Generate Payment Link' button (if one doesn't exist) that calls the `/api/invoices/[invoiceId]/create-xendit-invoice` endpoint."
    *   "Update the email template (`InvoiceEmail.tsx`) to optionally include the Xendit payment link (`xenditInvoiceUrl`) if it exists."

---

### Phase 5: Enhancements & Advanced Features

1.  **Recurring Items Implementation:**
    *   "Set up a cron job solution (e.g., Vercel Cron Jobs, `node-cron` if self-hosting, or a dedicated queue worker)."
    *   "Create a job that runs periodically (e.g., daily)."
    *   "The job should query for recurring invoices, expenses, and income items that are due (`nextDueDate <= today`)."
    *   "For each due item, create a new instance (e.g., a new invoice based on the recurring template), and update the `nextDueDate` of the recurring item based on its frequency."
    *   "Update relevant APIs and UI to manage recurring settings properly (e.g., forms should include frequency dropdown, `nextDueDate` input)."

2.  **Reporting & Analytics:**
    *   "Create dedicated API endpoints for reporting (e.g., `/api/reports/profit-loss`, `/api/reports/expenses-by-category`, `/api/reports/income-by-client`, `/api/reports/invoice-summary`)."
    *   "Use Drizzle's aggregation features (`sum`, `count`, `groupBy`, date functions, etc.) to calculate metrics based on date ranges and company scope."
    *   "Create a 'Dashboard' page (`/dashboard`) displaying key metrics (Total Overdue, Total Outstanding, Recent Payments, Income vs. Expenses snapshot) using ShadCN `Card` components. Fetch data from specialized dashboard API endpoints."
    *   "Install a charting library (e.g., `recharts`, `chart.js` with React wrapper, or `nivo`)."
    *   "Create a 'Reports' page (`/reports`) with interactive charts (e.g., bar chart for expenses by category, line chart for income over time, accounts receivable aging). Add date range pickers (`DateRangePicker` from ShadCN) and filters (e.g., client dropdown)."

3.  **Client Portal (Optional but Recommended):**
    *   "Create a separate route group (e.g., `/portal`)."
    *   "Implement client authentication. Consider:
        *   Separate client user accounts (`clientUsers` table linked to `clients`).
        *   Magic links sent to the client's primary email.
        *   **Important:** Ensure robust separation between internal user sessions and client portal sessions."
    *   "Develop API endpoints specifically for the portal (e.g., `/api/portal/invoices`, `/api/portal/invoices/[invoiceId]`). Ensure these endpoints strictly enforce that clients can *only* access data related to *their* client record (`clientId`)."
    *   "Build UI for clients to:
        *   View their list of invoices and quotes.
        *   See status (sent, paid, overdue).
        *   View/download invoice/quote PDFs.
        *   See payment history for an invoice.
        *   **(If Xendit integration is done) Make payments directly via the displayed Xendit Invoice URL (`xenditInvoiceUrl` fetched for their specific invoice).**"

4.  **Invoice/Quote Templates:**
    *   "Design schemas to store template settings:
        *   `companySettings` table (or extend existing `companies`): Add fields like `defaultInvoiceTemplateId`, `defaultQuoteTemplateId`, `logoUrl`, `defaultPaymentTerms`, `defaultNotes`.
        *   `documentTemplates` table: `id`, `companyId`, `name`, `type` (enum: `invoice`, `quote`), `colorScheme` (hex), `fontFamily`, `customCss` (optional, textarea), `isDefault` (boolean), `createdAt`, `updatedAt`.
    *   "Update Invoice/Quote creation UI to allow selecting a template (dropdown populated from `/api/document-templates?type=invoice`). Default to the company's default."
    *   "Modify the PDF generation logic (server-side API route) to fetch the selected template's settings (`logoUrl`, `colorScheme`, etc.) and apply them during rendering."
    *   "Create a UI section (e.g., `/settings/templates`) for managing these templates (CRUD operations)."

5.  **Role-Based Access Control (RBAC) - Refinement:**
    *   "Refine the NextAuth.js setup. Ensure the `role` (and `companyId`) from the `users` table is consistently included in the session token (`jwt` and `session` callbacks in `src/lib/auth/options.ts`)."
    *   "Implement helper functions or middleware logic to check roles easily (e.g., `hasRole(session, ['admin', 'accountant'])`)."
    *   "Apply role checks granularly in API routes:
        *   Example: Only `admin` can manage users or company settings.
        *   Example: `admin` and `accountant` can view reports or manage financial accounts.
        *   Example: `staff` might only be able to manage clients/invoices they are assigned to (requires adding an `assignedUserId` field to relevant tables, more complex) or all within the company based on initial setup."
    *   "Conditionally render UI elements based on the user's role using the session data on the client-side or server components. Hide buttons, navigation links, or entire sections if the user lacks permission."

6.  **User Invitation System:**
    *   "**Schema:** Define a `companyInvitations` table in `src/lib/db/schema.ts`:
        *   `id`: `uuid().primaryKey().defaultRandom()`
        *   `companyId`: Foreign key referencing `companies.id` (non-nullable).
        *   `invitedByUserId`: Foreign key referencing `users.id` (non-nullable).
        *   `email`: `varchar('email', { length: 255 }).notNull()` (email of the invitee).
        *   `role`: Enum matching user roles (e.g., `staff`, `accountant`).
        *   `token`: `varchar('token', { length: 255 }).notNull().unique()` (secure random token).
        *   `status`: Enum (`pending`, `accepted`, `expired`, `revoked`). Default `pending`.
        *   `expiresAt`: `timestamp('expires_at', { withTimezone: true }).notNull()`.
        *   `createdAt`, `updatedAt`.
        *   Add necessary indexes (`companyId`, `token`, `email`).
        *   Generate and push migrations."
    *   "**API - Invitation Management:**
        *   `POST /api/invitations`: (Admin/Authorized Role Only) - Check authorization, check if email exists in company, generate token, set expiry, save record, send invitation email via Resend.
        *   `GET /api/invitations`: (Admin/Authorized Role Only) - Return list of pending/active invitations for the user's company.
        *   `DELETE /api/invitations/[invitationId]`: (Admin/Authorized Role Only) - Mark invitation as `revoked`."
    *   "**API - Invitation Acceptance:**
        *   `GET /api/invitations/verify?token={token}`: (Public) - Verify token validity (`pending`, not expired), return `email`, `companyName`, `role`.
        *   `POST /api/invitations/accept`: (Public) - Input: `token`, `name`, `password`. Verify token, check user existence, create/update user, set `companyId` & `role`, update invitation status. Return success/failure."
    *   "**UI - Admin:**
        *   Add "Users" section under Settings (`/settings/users`).
        *   Display company users (`GET /api/users`).
        *   "Invite User" form/dialog (`email`, `role`). Calls `POST /api/invitations`.
        *   Display "Pending Invitations" table (`GET /api/invitations`) with "Revoke" buttons."
    *   "**UI - Invitee:**
        *   Create page `src/app/accept-invitation/page.tsx`.
        *   Read `token` from URL. Call `/api/invitations/verify` on load.
        *   Display invite info. Show sign-up form (Name, Password).
        *   On submit, call `POST /api/invitations/accept`. Redirect on success."
    *   "**Email Template:**
        *   Create `src/emails/CompanyInvitationEmail.tsx` using React Email. Include `inviterName`, `companyName`, `role`, `acceptLink`. Call Resend from `POST /api/invitations`."

---

### Phase 6: Polish & Production Readiness

1.  **Testing:**
    *   "Write unit tests (using Vitest or Jest) for critical utility functions, calculations (tax, totals), and potentially API handler logic (including Xendit interactions mock/stub)."
    *   "Write integration tests (using Playwright or Cypress) for key user flows: Sign up/Sign in, Create Client, Create Invoice, Generate Xendit Link, Record Manual Payment, Send Invoice Email, Accept Invitation."
    *   "Set up testing scripts in `package.json`."

2.  **Optimization & Performance:**
    *   "Implement pagination thoroughly on all lists fetching potentially large datasets (clients, invoices, expenses, transactions, users)."
    *   "Implement lazy loading for components/pages where appropriate using `next/dynamic`."
    *   "Review database queries for efficiency. Ensure necessary indexes are in place."
    *   "Analyze frontend bundle size and optimize imports."
    *   "Implement Next.js caching strategies (Data Cache, Full Route Cache) where applicable."

3.  **Security Hardening:**
    *   "Ensure all API endpoints have proper authentication and authorization checks (including company scoping and RBAC)."
    *   "Verify CSRF protection is active (usually handled by NextAuth.js)."
    *   "Ensure all user input is validated (using Zod) on both frontend and backend."
    *   "Sanitize any output that might contain user-generated content to prevent XSS."
    *   "Implement rate limiting on sensitive API endpoints (e.g., login, password reset, invitation accept, Xendit link generation) using a library like `@upstash/ratelimit`."
    *   "Review dependencies for known vulnerabilities (`npm audit`)."
    *   **"Ensure Xendit Secret Key and Callback Verification Token are securely stored and never exposed client-side.**"
    *   **"Always verify Xendit callback signatures.**"

4.  **Error Handling & Logging:**
    *   "Implement a robust error handling strategy (e.g., global error boundaries in React, centralized API error handling middleware)."
    *   "Set up a logging service (e.g., Sentry, Logtail, Axiom) to capture frontend and backend errors and logs in production. Pay attention to errors during Xendit API calls and callback processing."
    *   "Log important events for auditing purposes (e.g., invoice creation/deletion, payment recording (manual & Xendit), user login, invitation sent/accepted)."

5.  **CI/CD Pipeline:**
    *   "Create a GitHub Actions workflow (or similar for GitLab/Bitbucket)."
    *   "Configure the workflow to: Trigger on pushes/PRs, Install dependencies, Run linters/type checks, Run tests, Build application, (Optional) Deploy."

6.  **Documentation:**
    *   "Generate API documentation (e.g., using Swagger/OpenAPI)."
    *   "Write basic user guides for different roles."
    *   "Document the system architecture, setup process, environment variables (including `XENDIT_SECRET_KEY`, `XENDIT_CALLBACK_VERIFICATION_TOKEN`), and Xendit Callback setup."
    *   "Ensure code is well-commented."

7.  **Data Migration & Backup:**
    *   "Ensure all schema changes were handled via Drizzle migrations."
    *   "Implement a backup strategy for the Neon database."
    *   "Develop API endpoints and corresponding UI for data export (e.g., export clients, invoices, expenses, payments to CSV/Excel format)."

---

**Final Cursor AI Instruction:**

"Review the entire application based on the original requirements and the modifications made for Xendit integration. Check for code quality, consistency, performance, security (especially around payment processing and API keys), and usability. Refactor code where necessary and ensure all features are implemented correctly according to the steps we took."

---