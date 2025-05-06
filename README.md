![og-image-summit](https://github.com/user-attachments/assets/33ed60b2-606b-4b80-8526-9315517b4f92)
<h1 align="center">Summit</h1>

<p align="center">
    Open Source Invoicing & Finance App. Created by Kugie
</p>

<p align="center">
    <img src="https://img.shields.io/github/contributors/kugie-app/summit"/>
    <img src="https://img.shields.io/github/actions/workflow/status/kugie-app/summit/main-build.yml"/>
    <img src="https://img.shields.io/github/license/kugie-app/summit"/>
    <img src="https://img.shields.io/github/stars/kugie-app/summit"/>
</p>
**Summit** is a modern, self-hostable invoicing and financial management application designed for freelancers, small businesses, and agencies. Built with Next.js, Drizzle ORM, and Tailwind CSS, it provides the essential tools to manage your finances efficiently.

---

**Maintained by [Kugie.app](https://www.kugie.app)**

This open-source project is proudly maintained by the team at [Kugie.app](https://www.kugie.app). We believe in the power of open source and welcome contributions from the community!

Whether you want to fix a bug, add a feature, or improve documentation, feel free to:

*   Fork the repository and create a Pull Request.
*   Open an issue to discuss bugs or new features.
*   [Contact us](https://www.kugie.app/contact) to talk about the project!

---

## ✨ Key Features

![summit og](https://github.com/user-attachments/assets/3bf5edd5-db8c-4195-8e03-38110e2b7e3d)


*   **📄 Invoicing:** Create, manage, and track professional invoices.
    *   Generate PDF invoices.
    *   Send invoices directly via email.
    *   Track invoice statuses (Draft, Sent, Paid, Overdue, Cancelled).
    *   Online payment integration (Xendit).
*   **📝 Quoting:** Create and manage quotes for clients.
    *   Generate PDF quotes.
    *   Send quotes directly via email.
    *   Track quote statuses (Draft, Sent, Accepted, Rejected, Expired).
    *   Convert accepted quotes directly into invoices.
*   **💸 Expense Tracking:** Record and categorize business expenses.
    *   Upload and attach receipts (via Minio/S3).
    *   Manage expense categories.
*   **💰 Income Tracking:** Record and categorize income sources.
    *   Link income to specific invoices or clients.
    *   Manage income categories.
*   **👥 Client Management:** Keep track of your clients' information.
*   **🏪 Vendor Management:** Manage information about your suppliers and vendors.
*   **🔄 Recurring Transactions:** Set up recurring invoices, expenses, and income on daily, weekly, monthly, or yearly schedules. Automated processing via cron job endpoint.
*   **📊 Dashboard:** Get a quick overview of your financial health (Outstanding/Overdue Invoices, Profit & Loss).
*   **📈 Reporting:** Generate insightful financial reports:
    *   Profit & Loss Statement
    *   Invoice Summary
    *   Aging Receivables
    *   Expense Breakdown
    *   (More planned!)
*   **🚪 Client Portal:** A dedicated portal for clients to view their invoices and quotes (authentication via magic link).
*   **👥 Team Management:** Invite team members with different roles (Admin, Accountant, Staff) and permissions.
*   **⚙️ Settings:** Configure company details, manage categories, and team members.
*   **🔒 Authentication:** Secure user authentication using NextAuth.js.
*   **📱 Modern Tech Stack:** Built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, and PostgreSQL.

## 🚀 Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS with shadcn/ui
*   **Database:** PostgreSQL
*   **ORM:** Drizzle ORM
*   **Authentication:** NextAuth.js
*   **Email:** Resend
*   **Payments:** Xendit
*   **File Storage:** Minio (or any S3-compatible storage)
*   **Validation:** Zod
*   **Forms:** React Hook Form

## 🏁 Getting Started

Follow these steps to get the Summit application running locally.

### Prerequisites

*   Node.js (v18 or later recommended)
*   pnpm (or npm/yarn)
*   PostgreSQL Database
*   Minio Server (or other S3-compatible storage)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kugie-app/summit.git
    cd summit
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the `.env.example` file to `.env` and fill in the required values.
    ```bash
    cp .env.example .env
    ```
    See the [Environment Variables](#-environment-variables) section below for details.

4.  **Set up the database:**
    Make sure your PostgreSQL server is running and the connection string in your `.env` file is correct. Then, run the database migrations:
    ```bash
    pnpm db:push
    ```
    *Note: `db:push` is suitable for development. For production, use `drizzle-kit generate` and apply migrations manually or via a migration tool.*

5.  **Run the development server:**
    ```bash
    pnpm dev
    ```

6.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000).

### 🔑 Environment Variables

Create a `.env` file in the root of the project and add the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" # Your PostgreSQL connection string

# Authentication (NextAuth.js)
# Generate a secret: openssl rand -base64 32
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000" # Use your production URL in deployment

# Client Portal Authentication Secret (Used for client portal JWTs)
# Generate a strong secret
CLIENT_AUTH_SECRET="YOUR_STRONG_CLIENT_PORTAL_SECRET"

# Email (Resend)
RESEND_API_KEY="YOUR_RESEND_API_KEY"
RESEND_FROM_EMAIL="you@yourdomain.com" # Email address verified with Resend

# Payment Gateway (Xendit)
XENDIT_SECRET_KEY="YOUR_XENDIT_SECRET_KEY"
XENDIT_CALLBACK_VERIFICATION_TOKEN="YOUR_XENDIT_CALLBACK_TOKEN" # Set this in Xendit dashboard

# File Storage (Minio/S3)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="summit"

# Cron Job Security
# A secret key to authenticate requests to the cron job endpoint
CRON_API_KEY="YOUR_SECURE_CRON_API_KEY"

# Application URL (Used for generating links in emails etc.)
NEXT_PUBLIC_APP_URL="http://localhost:3000" # Use your production URL in deployment
```

### 💾 Database Setup

This project uses Drizzle ORM with PostgreSQL.

1.  **Ensure PostgreSQL is running.**
2.  **Set your `DATABASE_URL` in the `.env` file.**
3.  **Apply migrations (development):**
    ```bash
    pnpm db:push
    ```
4.  **Generate new migrations (when schema changes):**
    ```bash
    pnpm db:generate
    ```
    Then apply the generated migration script to your database.

## 🤝 Contributing

Contributions are welcome! We appreciate any help, from bug fixes and feature enhancements to documentation improvements.

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

You can also reach out to the maintainers at [Kugie.app](https://www.kugie.app/contact).

## 📄 License

This project is licensed under the [MIT LICENSE](LICENSE)
