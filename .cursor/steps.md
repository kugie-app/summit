"You are an expert full-stack developer. Your task is to help me build a Business Internal Invoicing Application based on the provided requirements. We will proceed step-by-step through different phases. Please generate the necessary code, configurations, components, API endpoints, and database schemas as requested in each step. Pay close attention to the specified tech stack: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, ShadCN UI, Neon PostgreSQL, Drizzle ORM, React Email, and Resend. Ensure code quality, type safety, adherence to best practices, and include necessary comments."

---

### Phase 0: Project Setup & Foundations ✅ COMPLETED
All steps (1-7) are completed.

**(Feed these steps sequentially to Cursor AI)**

1. **Initialize Next.js Project:**
    
    - "Initialize a new Next.js 15 project named internal-invoicing-app using create-next-app. Ensure TypeScript, Tailwind CSS, and the App Router are selected during setup."
        
    - "Verify the basic project structure and run the development server (npm run dev or yarn dev) to ensure it works."
        
2. **Install Core Dependencies:**
    
    - "Install the following core dependencies:
        
        - ShadCN UI (npx shadcn-ui@latest init) - Configure it according to its documentation (accept defaults for globals.css, CSS variables, etc.).
            
        - Drizzle ORM and Neon Adapter (npm install drizzle-orm @neondatabase/serverless drizzle-kit pg)
            
        - React Email and Resend (npm install react-email @react-email/components resend)
            
        - Authentication Library (e.g., NextAuth.js: npm install next-auth)
            
        - Validation Library (e.g., Zod: npm install zod)
            
        - Icon Library (e.g., lucide-react: npm install lucide-react)"
            
3. **Configure Tailwind CSS v4 & ShadCN UI:**
    
    - "Ensure Tailwind CSS v4 is correctly configured in tailwind.config.ts. Follow ShadCN UI documentation to install a few basic components we'll need soon: button, input, label, card, dropdown-menu, dialog, form, table,sonner. For example: npx shadcn-ui@latest add button input label card dropdown-menu dialog form table sonner."
        
    - "Set up dark/light mode toggle functionality using ShadCN's recommended approach (useTheme from next-themes). Install next-themes (npm install next-themes)."
        
4. **Set up Database Connection (Neon):**
    
    - "Create a new project on [Neon](https://www.google.com/url?sa=E&q=https%3A%2F%2Fneon.tech%2F). Obtain the PostgreSQL connection string (specifically the DATABASE_URL for pooled connections)."
        
    - "Create a .env.local file in the project root. Add the DATABASE_URL variable with the connection string from Neon."
        
    - "Create a src/lib/db/index.ts file. Initialize the Drizzle client using @neondatabase/serverless and the DATABASE_URL from environment variables."
        
5. **Initialize Drizzle ORM:**
    
    - "Create a drizzle.config.ts file in the project root. Configure it for PostgreSQL, pointing to the schema file (we'll create it next) and the output directory for migrations (src/lib/db/migrations). Use the DATABASE_URL."
        
    - "Create an initial schema file at src/lib/db/schema.ts. Define a simple placeholder table (e.g., test) just to verify the setup."
        
    - "Add scripts to package.json for generating migrations (drizzle-kit generate:pg) and pushing schema changes (drizzle-kit push:pg)."
        
    - "Generate the initial migration: npm run <your-generate-script-name>. Verify the migration file is created in the specified output directory."
        
    - "Push the initial schema to Neon: npm run <your-push-script-name>. Verify the table exists in your Neon database console."
        
6. **Basic App Layout:**
    
    - "Create a basic layout in src/app/layout.tsx using ShadCN UI components. Include a persistent sidebar/navigation component (src/components/layout/Sidebar.tsx) and a header component (src/components/layout/Header.tsx). The main content area should render the children prop."
        
    - "Populate the Sidebar with placeholder links for future sections (Dashboard, Clients, Invoices, Expenses, etc.)."
        
    - "Include the ThemeProvider and Toaster component in the root layout."
        
7. **Basic Authentication Setup (NextAuth.js):**
    
    - "Set up NextAuth.js. Create the API route handler at src/app/api/auth/[...nextauth]/route.ts."
        
    - "Configure a basic CredentialsProvider for email/password login initially. We will enhance this later with roles."
        
    - "Define the User session and JWT structure in src/lib/auth/options.ts (or similar)."
        
    - "Add a users table to src/lib/db/schema.ts with fields for id, name, email (unique), password (hashed), role, companyId (nullable for now), createdAt, updatedAt. Add softDelete boolean field."
        
    - "Update Drizzle config and generate/push the migration for the users table."
        
    - "Implement basic sign-up and sign-in pages (src/app/auth/signin/page.tsx, src/app/auth/signup/page.tsx) using ShadCN Form components and Zod for validation. Hash passwords before saving."
        
    - "Wrap the root layout (src/app/layout.tsx) with the NextAuth SessionProvider."
        
    - "Protect a sample page (e.g., a new /dashboard page) to require authentication using NextAuth middleware (middleware.ts in the root or src directory)."
        
    - "Update the Header component to show user information and a sign-out button if logged in, or a sign-in button if not."
        

---

### Phase 1: Core Data Models & Client Management ✅ COMPLETED
All steps (1-4) are completed.

1. **Define Core Schemas:**
    
    - "Refine the users schema in src/lib/db/schema.ts. Define an enum for role (e.g., admin, staff, accountant)."
        
    - "Define the companies schema: id, name, address, createdAt, updatedAt, softDelete."
        
    - "Define the clients schema: id, companyId (foreign key to companies), name, email, phone, address, paymentTerms, createdAt, updatedAt, softDelete."
        
    - "Establish relationships: A user belongs to one company. A client belongs to one company. A company can have many users and many clients."
        
    - "Add appropriate indexes (e.g., on companyId in users and clients, on email in users)."
        
    - "Update drizzle.config.ts if needed. Generate and push migrations."
        
2. **Company Scoping Logic:**
    
    - "Update the sign-up process: When a user signs up, also create a new company record and associate the user with it (set their companyId). Alternatively, implement logic for inviting users to an existing company."
        
    - "Modify database query functions/helpers (create a src/lib/db/queries.ts or similar) to ensure that all data access (clients, invoices, etc.) is scoped to the logged-in user's companyId."
        
3. **Client CRUD API:**
    
    - "Create API Route Handlers in src/app/api/clients/route.ts (for POST, GET list) and src/app/api/clients/[clientId]/route.ts (for GET single, PUT, DELETE)."
        
    - "Implement authentication checks and company scoping in these API routes. Only users belonging to the correct company should access/modify clients."
        
    - "Use Zod for validating request bodies (POST, PUT)."
        
    - "Implement soft deletes for the DELETE operation (update the softDelete flag)."
        
    - "Implement proper error handling and return meaningful status codes."
        
    - "Add logging for API requests and potential errors."
        
4. **Client Management UI:**
    
    - "Create a page at src/app/(authenticated)/clients/page.tsx (assuming (authenticated) is a route group protected by middleware)."
        
    - "Use ShadCN Table component to display a list of clients for the logged-in user's company. Fetch data from the GET /api/clients endpoint."
        
    - "Implement pagination for the client list if anticipating large numbers."
        
    - "Add a 'Create Client' button that opens a ShadCN Dialog or navigates to a new page (/clients/new)."
        
    - "Create a form (src/components/forms/ClientForm.tsx) using ShadCN Form, Input, Textarea, etc., and Zod for frontend validation, for creating and editing clients."
        
    - "Implement client creation logic (POST to /api/clients)."
        
    - "Implement client editing logic (fetch client data for /clients/[clientId]/edit or within a Dialog, PUT to /api/clients/[clientId])."
        
    - "Implement client deletion logic (DELETE to /api/clients/[clientId], using a confirmation dialog)."
        
    - "Display client details on a dedicated page (/clients/[clientId]/page.tsx)."
        
    - "Use ShadCN sonner for user feedback on success/error."
        

---

### Phase 2: Invoice & Quote Management

1. **Define Invoice/Quote Schemas:**
    
    - "Define invoices schema: id, companyId, clientId, invoiceNumber, status (enum: draft, sent, paid, overdue), issueDate, dueDate, subtotal, taxAmount, totalAmount, notes, currency (add multi-currency support early), createdAt, updatedAt, softDelete."
        
    - "Define invoiceItems schema: id, invoiceId, description, quantity, unitPrice, total, createdAt, updatedAt."
        
    - "Define quotes schema (similar to invoices but may have different fields like expiryDate, status enum: draft, sent, accepted, rejected)."
        
    - "Define quoteItems schema (similar to invoiceItems)."
        
    - "Establish relationships: Invoice/Quote belongs to Company and Client. Invoice/Quote has many Items."
        
    - "Add indexes (e.g., on companyId, clientId, status)."
        
    - "Generate and push migrations."
        
2. **Invoice/Quote CRUD API:**
    
    - "Create API routes for Invoices (/api/invoices, /api/invoices/[invoiceId]) and Quotes (/api/quotes, /api/quotes/[quoteId])."
        
    - "Implement CRUD operations ensuring company scoping and authentication."
        
    - "Handle creation/updating/deletion of associated items (invoiceItems, quoteItems) within the main Invoice/Quote API calls (transactional updates if possible with Drizzle)."
        
    - "Implement logic for generating unique, sequential invoiceNumber/quoteNumber (scoped per company)."
        
    - "Validate input using Zod schemas."
        
    - "Implement status update logic (e.g., an endpoint /api/invoices/[invoiceId]/send to change status from draft to sent)."
        
3. **Invoice/Quote Management UI:**
    
    - "Create pages for listing Invoices (/invoices) and Quotes (/quotes). Use ShadCN Table with filtering/sorting options (by status, client, date)."
        
    - "Implement 'Create Invoice/Quote' functionality, likely navigating to a dedicated page (/invoices/new, /quotes/new)."
        
    - "Develop a form component (src/components/forms/InvoiceForm.tsx, QuoteForm.tsx) using ShadCN components."
        
        - Include fields for client selection (dropdown fetching from /api/clients), dates (use ShadCN DatePicker), currency selection.
            
        - Implement dynamic item entry (add/remove item rows), calculating subtotal, tax, and total automatically on the frontend.
            
        - Use Zod for form validation.
            
    - "Implement viewing/editing pages (/invoices/[invoiceId], /quotes/[quoteId]). Pre-fill the form for editing."
        
    - "Display status prominently using badges (ShadCN Badge)."
        
    - "Add buttons for actions like 'Mark as Sent', 'Edit', 'Delete' (soft delete)."
        
4. **Basic PDF Generation:**
    
    - "Choose a PDF generation library (e.g., @react-pdf/renderer for client-side or pdf-lib/puppeteer for server-side generation via an API endpoint)."
        
    - **If server-side (recommended for consistency):** Create an API route like /api/invoices/[invoiceId]/pdf. Fetch invoice data, render an HTML template (or use a dedicated PDF library structure), and return the PDF file."
        
    - **If client-side:** Use @react-pdf/renderer to create PDF components based on invoice data. Provide a download button on the invoice view page."
        
    - "Create a basic, professional-looking PDF template for invoices and quotes, including company logo (placeholder), client details, itemized list, totals, payment terms, notes."
        
5. **Email Functionality Setup (React Email & Resend):**
    
    - "Set up Resend: Sign up, get an API key, and verify your domain."
        
    - "Add the RESEND_API_KEY to your .env.local file."
        
    - "Create basic email templates using React Email (src/emails/InvoiceEmail.tsx, QuoteEmail.tsx). Include placeholders for dynamic data (client name, invoice number, amount, link to view)."
        
    - "Create an API endpoint (e.g., /api/invoices/[invoiceId]/send-email) that:
        
        - Fetches invoice data.
            
        - Generates the PDF (or fetches it if already generated).
            
        - Renders the React Email template to HTML.
            
        - Uses the Resend SDK to send the email with the PDF attached to the client's email address.
            
        - Updates the invoice status to 'sent'."
            
    - "Add a 'Send Email' button to the Invoice/Quote view UI (enabled for 'draft' status)."
        

---

### Phase 3: Expense & Income Tracking

1. **Define Expense/Income Schemas:**
    
    - "Define expenseCategories schema: id, companyId, name."
        
    - "Define expenses schema: id, companyId, categoryId, vendor, description, amount, currency, expenseDate, receiptUrl (for uploaded receipts), status (enum: pending, approved, rejected), recurring (enum: none, daily, weekly, monthly, yearly), nextDueDate (if recurring), createdAt, updatedAt, softDelete."
        
    - "Define incomeCategories schema: id, companyId, name."
        
    - "Define income schema: id, companyId, categoryId, clientId (optional), invoiceId (optional), source, description, amount, currency, incomeDate, recurring (enum), nextDueDate, createdAt, updatedAt, softDelete."
        
    - "Add relationships and indexes."
        
    - "Generate and push migrations."
        
2. **Expense/Income CRUD API:**
    
    - "Create API routes for Expenses (/api/expenses, /api/expenses/[expenseId]) and Income (/api/income, /api/income/[incomeId])."
        
    - "Create API routes for managing Categories (/api/expense-categories, /api/income-categories)."
        
    - "Implement CRUD operations with authentication and company scoping."
        
    - "For expense creation/update, handle file uploads for receipts. Use a service like Vercel Blob, AWS S3, or Cloudinary and store the URL in receiptUrl. Create an API endpoint specifically for uploads (e.g., /api/upload/receipt)."
        
    - "Implement logic for handling recurring expenses/income (to be processed later by a cron job)."
        
3. **Expense/Income Management UI:**
    
    - "Create pages for listing Expenses (/expenses) and Income (/income). Use ShadCN Table with filtering (by category, status, date range)."
        
    - "Implement forms (ExpenseForm.tsx, IncomeForm.tsx) for creating/editing entries."
        
        - Include category selection (dropdowns populated from category APIs).
            
        - Include date pickers, currency inputs.
            
        - For expenses, add a file input for receipt uploads. Show uploaded receipt links/previews.
            
        - Add fields for recurring settings.
            
    - "Display status for expenses."
        
    - "Implement basic approval workflow UI for expenses (e.g., buttons for 'Approve'/'Reject' visible to specific roles - requires role implementation from Phase 0)."
        

---

### Phase 4: Payment Processing & Account Management

1. **Define Payment/Account Schemas:**
    
    - "Define accounts schema: id, companyId, name (e.g., 'Business Checking'), type (enum: bank, credit_card, cash), currency, accountNumber (optional, store securely if needed), initialBalance, currentBalance, createdAt, updatedAt, softDelete."
        
    - "Define transactions schema: id, companyId, accountId, type (enum: debit, credit), description, amount, currency, transactionDate, categoryId (optional, link to expense/income categories), relatedInvoiceId (optional), relatedExpenseId (optional), relatedIncomeId (optional), reconciled (boolean), createdAt, updatedAt."
        
    - "Define payments schema: id, companyId, invoiceId, clientId, amount, currency, paymentDate, paymentMethod (enum: card, bank_transfer, cash, other), transactionId (optional, link to a transaction record), status (enum: pending, completed, failed), notes, createdAt, updatedAt."
        
    - "Establish relationships: Payment links to Invoice, Client, potentially Transaction. Transaction links to Account."
        
    - "Generate and push migrations."
        
2. **Account/Payment CRUD API:**
    
    - "Create API routes for Accounts (/api/accounts, /api/accounts/[accountId])."
        
    - "Create API routes for Payments (/api/payments, /api/payments/[paymentId]). Implement logic to update the related invoice status (paid or partially paid) when a payment is recorded."
        
    - "Create API routes for Transactions (/api/transactions, /api/transactions/[transactionId]). When creating a transaction related to an invoice payment, expense, or income, update the account balance accordingly."
        
3. **Payment/Account Management UI:**
    
    - "Create an 'Accounts' page (/accounts) listing all financial accounts with balances. Allow creating/editing accounts via forms."
        
    - "Create a 'Record Payment' feature (perhaps a button on the Invoice view page or a dedicated /payments/new page)."
        
        - Form should allow selecting the invoice, client (auto-filled from invoice), amount, date, payment method.
            
        - Submitting the form should hit the POST /api/payments endpoint.
            
    - "Display payments related to an invoice on the invoice view page."
        
    - "Create a 'Transactions' page (/accounts/[accountId]/transactions) listing transactions for a specific account. Include filtering and sorting."
        
    - "Implement a basic UI for account reconciliation: display transactions, allow users to mark them as 'reconciled' against bank statements (perhaps just a checkbox initially)."
        
4. **(Optional/Advanced) Payment Links:**
    
    - "Integrate with a payment processor like Stripe. Set up Stripe account, get API keys."
        
    - "Add Stripe SDK (npm install stripe)."
        
    - "Create API endpoints (/api/invoices/[invoiceId]/create-payment-link) to generate Stripe Checkout sessions or Payment Links for specific invoices."
        
    - "Store the payment link URL associated with the invoice."
        
    - "Set up webhooks (/api/webhooks/stripe) to listen for successful payments from Stripe. When a payment succeeds, update the payment record in your database and the corresponding invoice status."
        
    - "Display the payment link on the invoice view page or in the email sent to the client."
        

---

### Phase 5: Enhancements & Advanced Features

1. **Recurring Items Implementation:**
    
    - "Set up a cron job solution (e.g., Vercel Cron Jobs, node-cron if self-hosting, or a dedicated queue worker)."
        
    - "Create a job that runs periodically (e.g., daily)."
        
    - "The job should query for recurring invoices, expenses, and income items that are due (nextDueDate <= today)."
        
    - "For each due item, create a new instance (e.g., a new invoice based on the recurring template), and update the nextDueDate of the recurring item."
        
    - "Update APIs and UI to manage recurring settings properly."
        
2. **Reporting & Analytics:**
    
    - "Create dedicated API endpoints for reporting (e.g., /api/reports/profit-loss, /api/reports/expenses-by-category, /api/reports/income-by-client)."
        
    - "Use Drizzle's aggregation features (sum, groupBy, etc.) to calculate metrics based on date ranges and filters."
        
    - "Create a 'Dashboard' page (/dashboard) displaying key metrics (Total Overdue, Total Outstanding, Income vs. Expenses) using ShadCN Card components."
        
    - "Install a charting library (e.g., recharts, chart.js with React wrapper, or nivo)."
        
    - "Create a 'Reports' page (/reports) with interactive charts (e.g., bar chart for expenses by category, line chart for income over time). Add date range pickers and filters."
        
3. **Client Portal:**
    
    - "Create a separate route group (e.g., /portal)."
        
    - "Implement client authentication (could be separate logins or maybe magic links sent via email)."
        
    - "Develop API endpoints specifically for the portal, ensuring clients can only access their invoices/quotes."
        
    - "Build UI for clients to view their invoice list, view individual invoice details (PDFs), see payment history, and potentially make payments (if Stripe integration is done)."
        
4. **Invoice/Quote Templates:**
    
    - "Design a schema to store template settings (e.g., invoiceTemplates table with companyId, name, logoUrl, colorScheme, defaultNotes, isDefault)."
        
    - "Update Invoice/Quote creation UI to allow selecting a template."
        
    - "Modify the PDF generation logic to use the selected template's settings."
        
    - "Create a UI section for managing these templates."
        
5. **Role-Based Access Control (RBAC):**
    
    - "Refine the NextAuth.js setup. Use the role field stored in the users table."
        
    - "In the jwt and session callbacks, include the user's role."
        
    - "Implement checks in API routes and potentially middleware to restrict access based on roles (e.g., only 'admin' or 'accountant' can access reports, only 'admin' can manage users)."
        
    - "Conditionally render UI elements based on the user's role (e.g., hide 'Settings' link for 'staff')."
        

---

### Phase 6: Polish & Production Readiness

1. **Testing:**
    
    - "Write unit tests (using Vitest or Jest) for critical utility functions, calculations (tax, totals), and potentially API handler logic."
        
    - "Write integration tests (using Playwright or Cypress) for key user flows: Sign up/Sign in, Create Client, Create Invoice, Record Payment, Send Invoice Email."
        
    - "Set up testing scripts in package.json."
        
2. **Optimization & Performance:**
    
    - "Implement pagination thoroughly on all lists fetching potentially large datasets (clients, invoices, expenses, transactions)."
        
    - "Implement lazy loading for components/pages where appropriate using next/dynamic."
        
    - "Review database queries for efficiency. Ensure necessary indexes are in place."
        
    - "Analyze frontend bundle size and optimize imports."
        
    - "Implement Next.js caching strategies (Data Cache, Full Route Cache) where applicable."
        
3. **Security Hardening:**
    
    - "Ensure all API endpoints have proper authentication and authorization checks (including company scoping and RBAC)."
        
    - "Verify CSRF protection is active (usually handled by NextAuth.js)."
        
    - "Ensure all user input is validated (using Zod) on both frontend and backend."
        
    - "Sanitize any output that might contain user-generated content to prevent XSS."
        
    - "Implement rate limiting on sensitive API endpoints (e.g., login, password reset, maybe resource creation) using a library like upstash/ratelimit."
        
    - "Review dependencies for known vulnerabilities."
        
4. **Error Handling & Logging:**
    
    - "Implement a robust error handling strategy (e.g., global error boundaries in React, centralized API error handling middleware)."
        
    - "Set up a logging service (e.g., Sentry, Logtail, Axiom) to capture frontend and backend errors and logs in production."
        
    - "Log important events for auditing purposes (e.g., invoice creation/deletion, payment recording, user login)."
        
5. **CI/CD Pipeline:**
    
    - "Create a GitHub Actions workflow (or similar for GitLab/Bitbucket)."
        
    - "Configure the workflow to:
        
        - Trigger on pushes/PRs to main branches.
            
        - Install dependencies.
            
        - Run linters (ESLint) and type checks (TypeScript).
            
        - Run unit and integration tests.
            
        - Build the Next.js application.
            
        - (Optional) Deploy automatically to a hosting provider (e.g., Vercel, Netlify, AWS)."
            
6. **Documentation:**
    
    - "Generate API documentation (e.g., using Swagger/OpenAPI definitions generated from Zod schemas or annotations)."
        
    - "Write basic user guides for different roles (Admin, Staff, Accountant)."
        
    - "Document the system architecture, setup process, and environment variables needed."
        
    - "Ensure code is well-commented, especially complex parts."
        
7. **Data Migration & Backup:**
    
    - "Ensure all schema changes were handled via Drizzle migrations."
        
    - "Implement a backup strategy for the Neon database (Neon often provides point-in-time recovery, but understand the options)."
        
    - "Develop API endpoints and corresponding UI for data export (e.g., export clients, invoices, expenses to CSV/Excel format). Use a library like papaparse or xlsx."
        

---

**Final Cursor AI Instruction:**

"Review the entire application based on the original requirements. Check for code quality, consistency, performance, security, and usability. Refactor code where necessary and ensure all features are implemented correctly according to the steps we took."