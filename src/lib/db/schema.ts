import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum, uniqueIndex,
  decimal,
  date,
  varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Create a test table for verifying the setup
export const test = pgTable('test', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define role enum
export const roleEnum = pgEnum('role', ['admin', 'staff', 'accountant']);

// Define invoice status enum
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
]);

// Define quote status enum
export const quoteStatusEnum = pgEnum('quote_status', [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
]);

// Define companies table
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  defaultCurrency: varchar('default_currency', { length: 10 }).default('IDR').notNull(),
  logoUrl: text('logo_url'),
  bankAccount: text('bank_account'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  taxNumber: text('tax_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Define users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  password: text('password'),
  role: roleEnum('role').default('staff').notNull(),
  companyId: integer('company_id').references(() => companies.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex('email_idx').on(table.email),
  };
});

// Define clients table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  paymentTerms: integer('payment_terms').default(30), // Default to 30 days
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
}, (table) => {
  return {
    companyIdIdx: uniqueIndex('clients_company_id_idx').on(table.companyId, table.email),
  };
});

// Define invoices table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id),
  clientId: integer('client_id').notNull().references(() => clients.id),
  invoiceNumber: text('invoice_number').notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  currency: varchar('currency', { length: 10 }).default('IDR').notNull(),
  xenditInvoiceId: varchar('xendit_invoice_id', { length: 255 }),
  xenditInvoiceUrl: varchar('xendit_invoice_url', { length: 2048 }),
  recurring: varchar('recurring', { length: 20 }).default('none').notNull()
    .$type<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(),
  nextDueDate: date('next_due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  paidAt: timestamp('paid_at'),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Define invoice items table
export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define quotes table
export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id),
  clientId: integer('client_id').notNull().references(() => clients.id),
  quoteNumber: text('quote_number').notNull(),
  status: quoteStatusEnum('status').default('draft').notNull(),
  issueDate: date('issue_date').notNull(),
  expiryDate: date('expiry_date').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  softDelete: boolean('soft_delete').default(false).notNull(),
  convertedToInvoiceId: integer('converted_to_invoice_id').references(() => invoices.id),
});

// Define quote items table
export const quoteItems = pgTable('quote_items', {
  id: serial('id').primaryKey(),
  quoteId: integer('quote_id').notNull().references(() => quotes.id),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Expense Categories Table
export const expenseCategories = pgTable('expense_categories', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Define vendors table
export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  website: varchar('website', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Expenses Table
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  categoryId: integer('category_id')
    .references(() => expenseCategories.id),
  vendorId: integer('vendor_id')
    .references(() => vendors.id),
  vendor: varchar('vendor', { length: 255 }),
  description: text('description'),
  amount: varchar('amount', { length: 20 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('IDR').notNull(),
  expenseDate: date('expense_date').notNull(),
  receiptUrl: text('receipt_url'),
  status: varchar('status', { length: 20 })
    .default('pending')
    .notNull()
    .$type<'pending' | 'approved' | 'rejected'>(),
  recurring: varchar('recurring', { length: 20 })
    .default('none')
    .notNull()
    .$type<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(),
  nextDueDate: date('next_due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Income Categories Table
export const incomeCategories = pgTable('income_categories', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Income Table
export const income = pgTable('income', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  categoryId: integer('category_id')
    .references(() => incomeCategories.id),
  clientId: integer('client_id')
    .references(() => clients.id),
  invoiceId: integer('invoice_id')
    .references(() => invoices.id),
  source: varchar('source', { length: 255 }),
  description: text('description'),
  amount: varchar('amount', { length: 20 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('IDR').notNull(),
  incomeDate: date('income_date').notNull(),
  recurring: varchar('recurring', { length: 20 })
    .default('none')
    .notNull()
    .$type<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(),
  nextDueDate: date('next_due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Define account type enum
export const accountTypeEnum = pgEnum('account_type', ['bank', 'credit_card', 'cash']);

// Define transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['debit', 'credit']);

// Define payment method enum
export const paymentMethodEnum = pgEnum('payment_method', ['card', 'bank_transfer', 'cash', 'other']);

// Define payment status enum
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);

// Define API tokens table
export const apiTokens = pgTable('api_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  tokenPrefix: varchar('token_prefix', { length: 12 }).notNull().unique(), // e.g., skt_ + 8 chars
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { mode: 'date' }),
});

// Define client users table for portal access
export const clientUsers = pgTable('client_users', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => clients.id),
  email: text('email').notNull(),
  name: text('name'),
  password: text('password'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  tokenVersion: integer('token_version').default(0).notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex('client_users_email_idx').on(table.email),
    clientIdIdx: uniqueIndex('client_users_client_id_idx').on(table.clientId, table.email),
  };
});

// Define invitation status enum
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'cancelled'
]);

// Define client login tokens for magic link authentication
export const clientLoginTokens = pgTable('client_login_tokens', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => clients.id),
  email: text('email').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  usedAt: timestamp('used_at'),
}, (table) => {
  return {
    tokenIdx: uniqueIndex('client_login_tokens_token_idx').on(table.token),
  };
});

// Define company invitations table
export const companyInvitations = pgTable('company_invitations', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id),
  email: text('email').notNull(),
  name: text('name'),
  role: roleEnum('role').default('staff').notNull(),
  token: text('token').notNull(),
  status: invitationStatusEnum('status').default('pending').notNull(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  usedAt: timestamp('used_at'),
}, (table) => {
  return {
    tokenIdx: uniqueIndex('company_invitations_token_idx').on(table.token),
    emailCompanyIdx: uniqueIndex('company_invitations_email_company_idx').on(table.email, table.companyId),
  };
});

// Define accounts table
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  currency: varchar('currency', { length: 10 }).default('IDR').notNull(),
  accountNumber: varchar('account_number', { length: 255 }),
  initialBalance: decimal('initial_balance', { precision: 10, scale: 2 }).default('0').notNull(),
  currentBalance: decimal('current_balance', { precision: 10, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Define transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  type: transactionTypeEnum('type').notNull(),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('IDR').notNull(),
  transactionDate: date('transaction_date').notNull(),
  categoryId: integer('category_id'),
  relatedInvoiceId: integer('related_invoice_id').references(() => invoices.id),
  relatedExpenseId: integer('related_expense_id').references(() => expenses.id),
  relatedIncomeId: integer('related_income_id').references(() => income.id),
  reconciled: boolean('reconciled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Define payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  clientId: integer('client_id').notNull().references(() => clients.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('IDR').notNull(),
  paymentDate: date('payment_date').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  transactionId: integer('transaction_id').references(() => transactions.id),
  paymentProcessorReference: varchar('payment_processor_reference', { length: 255 }),
  status: paymentStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  softDelete: boolean('soft_delete').default(false).notNull(),
});

// Company relationships
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  invoices: many(invoices),
  quotes: many(quotes),
  expenseCategories: many(expenseCategories),
  expenses: many(expenses),
  incomeCategories: many(incomeCategories),
  income: many(income),
  accounts: many(accounts),
  transactions: many(transactions),
  payments: many(payments),
  invitations: many(companyInvitations),
  apiTokens: many(apiTokens),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  apiTokens: many(apiTokens),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  invoices: many(invoices),
  quotes: many(quotes),
  clientUsers: many(clientUsers),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  transactions: many(transactions),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

// Expense Categories relationships
export const expenseCategoriesRelations = relations(expenseCategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [expenseCategories.companyId],
    references: [companies.id],
  }),
  expenses: many(expenses),
}));

// Expense relationships
export const expensesRelations = relations(expenses, ({ one }) => ({
  company: one(companies, {
    fields: [expenses.companyId],
    references: [companies.id],
  }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  vendor: one(vendors, {
    fields: [expenses.vendorId],
    references: [vendors.id],
  }),
}));

// Income Categories relationships
export const incomeCategoriesRelations = relations(incomeCategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [incomeCategories.companyId],
    references: [companies.id],
  }),
  incomeItems: many(income),
}));

// Income relationships
export const incomeRelations = relations(income, ({ one }) => ({
  company: one(companies, {
    fields: [income.companyId],
    references: [companies.id],
  }),
  category: one(incomeCategories, {
    fields: [income.categoryId],
    references: [incomeCategories.id],
  }),
  client: one(clients, {
    fields: [income.clientId],
    references: [clients.id],
  }),
  invoice: one(invoices, {
    fields: [income.invoiceId],
    references: [invoices.id],
  }),
}));

// Quote relationships
export const quotesRelations = relations(quotes, ({ one, many }) => ({
  company: one(companies, {
    fields: [quotes.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
}));

// Account relationships
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [accounts.companyId],
    references: [companies.id],
  }),
  transactions: many(transactions),
}));

// Transaction relationships
export const transactionsRelations = relations(transactions, ({ one }) => ({
  company: one(companies, {
    fields: [transactions.companyId],
    references: [companies.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  invoice: one(invoices, {
    fields: [transactions.relatedInvoiceId],
    references: [invoices.id],
  }),
  expense: one(expenses, {
    fields: [transactions.relatedExpenseId],
    references: [expenses.id],
  }),
  incomeItem: one(income, {
    fields: [transactions.relatedIncomeId],
    references: [income.id],
  }),
}));

// Payment relationships
export const paymentsRelations = relations(payments, ({ one }) => ({
  company: one(companies, {
    fields: [payments.companyId],
    references: [companies.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
  transaction: one(transactions, {
    fields: [payments.transactionId],
    references: [transactions.id],
  }),
}));

// Define client users relations
export const clientUsersRelations = relations(clientUsers, ({ one }) => ({
  client: one(clients, {
    fields: [clientUsers.clientId],
    references: [clients.id],
  }),
}));

// Define company invitations relations
export const companyInvitationsRelations = relations(companyInvitations, ({ one }) => ({
  company: one(companies, {
    fields: [companyInvitations.companyId],
    references: [companies.id],
  }),
}));

// Define vendors relations
export const vendorsRelations = relations(vendors, ({ many }) => ({
  expenses: many(expenses),
}));

// Define API tokens relations
export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
  user: one(users, {
    fields: [apiTokens.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [apiTokens.companyId],
    references: [companies.id],
  }),
}));