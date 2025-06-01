import {
    sqliteTable,
    text,
    integer,
    uniqueIndex,
    real as decimal,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Create a test table for verifying the setup
export const test = sqliteTable('test', {
  id: integer('id').primaryKey({autoIncrement:true}),
  name: text('name').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
});

// Define role enum
export const roleEnum = text('role').notNull().$type<'admin'| 'staff' | 'accountant'>();

// Define invoice status enum
export const invoiceStatusEnum = text('status').notNull().$type<'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>();

// Define quote status enum

export const quoteStatusEnum = text('quote_status').notNull().$type<'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'>();

// Define companies table
export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({autoIncrement:true}),
  name: text('name').notNull(),
  address: text('address'),
  defaultCurrency: text('default_currency', { length: 10 }).default('IDR').notNull(),
  logoUrl: text('logo_url'),
  bankAccount: text('bank_account'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  taxNumber: text('tax_number'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
});

// Define users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({autoIncrement:true}),
  name: text('name'),
  email: text('email').notNull(),
  password: text('password'),
  role: roleEnum.default('staff').notNull(),
  companyId: integer('company_id').references(() => companies.id),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex('email_idx').on(table.email),
  };
});

// Define clients table
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  paymentTerms: integer('payment_terms').default(30), // Default to 30 days
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
}, (table) => {
  return {
    companyIdIdx: uniqueIndex('clients_company_id_idx').on(table.companyId, table.email),
  };
});

// Define invoices table
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id').notNull().references(() => companies.id),
  clientId: integer('client_id').notNull().references(() => clients.id),
  invoiceNumber: text('invoice_number').notNull(),
  status: invoiceStatusEnum.default('draft').notNull(),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date').notNull(),
  subtotal: decimal('subtotal').notNull(),
  tax: decimal('tax').default(0),
  taxRate: decimal('tax_rate').default(0),
  total: decimal('total').notNull(),
  notes: text('notes'),
  currency: text('currency', { length: 10 }).default('IDR').notNull(),
  xenditInvoiceId: text('xendit_invoice_id', { length: 255 }),
  xenditInvoiceUrl: text('xendit_invoice_url', { length: 2048 }),
  recurring: text('recurring', { length: 20 }).default('none').notNull()
    .$type<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(),
  nextDueDate: text('next_due_date'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  paidAt: text('paid_at'),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
});

// Define invoice items table
export const invoiceItems = sqliteTable('invoice_items', {
  id: integer('id').primaryKey({autoIncrement:true}),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  description: text('description').notNull(),
  quantity: decimal('quantity').notNull(),
  unitPrice: decimal('unit_price').notNull(),
  amount: decimal('amount').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
});

// Define quotes table
export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id').notNull().references(() => companies.id),
  clientId: integer('client_id').notNull().references(() => clients.id),
  quoteNumber: text('quote_number').notNull(),
  status: quoteStatusEnum.default('draft').notNull(),
  issueDate: text('issue_date').notNull(),
  expiryDate: text('expiry_date').notNull(),
  subtotal: decimal('subtotal' ).notNull(),
  tax: decimal('tax').default(0),
  taxRate: decimal('tax_rate').default(0),
  total: decimal('total').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  acceptedAt: text('accepted_at'),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
  convertedToInvoiceId: integer('converted_to_invoice_id').references(() => invoices.id),
});

// Define quote items table
export const quoteItems = sqliteTable('quote_items', {
  id: integer('id').primaryKey({autoIncrement:true}),
  quoteId: integer('quote_id').notNull().references(() => quotes.id),
  description: text('description').notNull(),
  quantity: decimal('quantity').notNull(),
  unitPrice: decimal('unit_price').notNull(),
  amount: decimal('amount').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
});

// Expense Categories Table
export const expenseCategories = sqliteTable('expense_categories', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  name: text('name', { length: 100 }).notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
});

// Define vendors table
export const vendors = sqliteTable('vendors', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  name: text('name', { length: 255 }).notNull(),
  contactName: text('contact_name', { length: 255 }),
  email: text('email', { length: 255 }),
  phone: text('phone', { length: 50 }),
  address: text('address'),
  website: text('website', { length: 255 }),
  notes: text('notes'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
});

// Expenses Table
export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  categoryId: integer('category_id')
    .references(() => expenseCategories.id),
  vendorId: integer('vendor_id')
    .references(() => vendors.id),
  vendor: text('vendor', { length: 255 }),
  description: text('description'),
  amount: text('amount', { length: 20 }).notNull(),
  currency: text('currency', { length: 10 }).default('IDR').notNull(),
  expenseDate: text('expense_date').notNull(),
  receiptUrl: text('receipt_url'),
  status: text('status', { length: 20 })
    .default('pending')
    .notNull()
    .$type<'pending' | 'approved' | 'rejected'>(),
  recurring: text('recurring', { length: 20 })
    .default('none')
    .notNull()
    .$type<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(),
  nextDueDate: text('next_due_date'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
});

// Income Categories Table
export const incomeCategories = sqliteTable('income_categories', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  name: text('name', { length: 100 }).notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
});

// Income Table
export const income = sqliteTable('income', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  categoryId: integer('category_id')
    .references(() => incomeCategories.id),
  clientId: integer('client_id')
    .references(() => clients.id),
  invoiceId: integer('invoice_id')
    .references(() => invoices.id),
  source: text('source', { length: 255 }),
  description: text('description'),
  amount: text('amount', { length: 20 }).notNull(),
  currency: text('currency', { length: 10 }).default('IDR').notNull(),
  incomeDate: text('income_date').notNull(),
  recurring: text('recurring', { length: 20 })
    .default('none')
    .notNull()
    .$type<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(),
  nextDueDate: text('next_due_date'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
});

// Define account type enum
export const accountTypeEnum = text('type').notNull()
  .$type<'bank' | 'credit_card' | 'cash'>();

// Define transaction type enum
export const transactionTypeEnum = text('type').notNull()
  .$type<'debit' | 'credit'>();

// Define payment method enum
export const paymentMethodEnum = text('payment_method').notNull()
  .$type<'card' | 'bank_transfer' | 'cash' | 'other'>();

// Define payment status enum
export const paymentStatusEnum = text('status').notNull()
  .$type<'pending' | 'completed' | 'failed'>()

// Define API tokens table
export const apiTokens = sqliteTable('api_tokens', {
  id: integer('id').primaryKey({autoIncrement:true}),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name', { length: 255 }).notNull(),
  tokenPrefix: text('token_prefix', { length: 12 }).notNull().unique(), // e.g., skt_ + 8 chars
  tokenHash: text('token_hash', { length: 255 }).notNull(),
  expiresAt: text('expires_at'),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  revokedAt: text('revoked_at'),
});

// Define client users table for portal access
export const clientUsers = sqliteTable('client_users', {
  id: integer('id').primaryKey({autoIncrement:true}),
  clientId: integer('client_id').notNull().references(() => clients.id),
  email: text('email').notNull(),
  name: text('name'),
  password: text('password'),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  tokenVersion: integer('token_version').default(0).notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex('client_users_email_idx').on(table.email),
    clientIdIdx: uniqueIndex('client_users_client_id_idx').on(table.clientId, table.email),
  };
});

// Define invitation status enum
export const invitationStatusEnum = text('status').notNull()
  .$type<'pending' | 'accepted' | 'expired' | 'cancelled'>()
  .default('pending');

// Define client login tokens for magic link authentication
export const clientLoginTokens = sqliteTable('client_login_tokens', {
  id: integer('id').primaryKey({autoIncrement:true}),
  clientId: integer('client_id').notNull().references(() => clients.id),
  email: text('email').notNull(),
  token: text('token').notNull(),
  expires: text('expires').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  usedAt: text('used_at'),
}, (table) => {
  return {
    tokenIdx: uniqueIndex('client_login_tokens_token_idx').on(table.token),
  };
});

// Define company invitations table
export const companyInvitations = sqliteTable('company_invitations', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id').notNull().references(() => companies.id),
  email: text('email').notNull(),
  name: text('name'),
  role: roleEnum.default('staff').notNull(),
  token: text('token').notNull(),
  status: invitationStatusEnum.notNull(),
  expires: text('expires').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  usedAt: text('used_at'),
}, (table) => {
  return {
    tokenIdx: uniqueIndex('company_invitations_token_idx').on(table.token),
    emailCompanyIdx: uniqueIndex('company_invitations_email_company_idx').on(table.email, table.companyId),
  };
});

// Define accounts table
export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id').notNull().references(() => companies.id),
  name: text('name', { length: 255 }).notNull(),
  type: accountTypeEnum.notNull(),
  currency: text('currency', { length: 10 }).default('IDR').notNull(),
  accountNumber: text('account_number', { length: 255 }),
  initialBalance: decimal('initial_balance').default(0).notNull(),
  currentBalance: decimal('current_balance').default(0).notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
});

// Define transactions table
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id').notNull().references(() => companies.id),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  type: transactionTypeEnum.notNull(),
  description: text('description').notNull(),
  amount: decimal('amount').notNull(),
  currency: text('currency', { length: 10 }).default('IDR').notNull(),
  transactionDate: text('transaction_date').notNull(),
  categoryId: integer('category_id'),
  relatedInvoiceId: integer('related_invoice_id').references(() => invoices.id),
  relatedExpenseId: integer('related_expense_id').references(() => expenses.id),
  relatedIncomeId: integer('related_income_id').references(() => income.id),
  reconciled: integer('reconciled').default(0).notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
});

// Define payments table
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({autoIncrement:true}),
  companyId: integer('company_id').notNull().references(() => companies.id),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  clientId: integer('client_id').notNull().references(() => clients.id),
  amount: decimal('amount').notNull(),
  currency: text('currency').default('IDR').notNull(),
  paymentDate: text('payment_date').notNull(),
  paymentMethod: paymentMethodEnum.notNull(),
  transactionId: integer('transaction_id').references(() => transactions.id),
  paymentProcessorReference: text('payment_processor_reference', { length: 255 }),
  status: paymentStatusEnum.default('pending').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
  softDelete: integer('soft_delete', {mode: 'boolean'}).default(false).notNull(),
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