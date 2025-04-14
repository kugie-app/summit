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
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
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
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  softDelete: boolean('soft_delete').default(false).notNull(),
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

// Expenses Table
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  categoryId: integer('category_id')
    .references(() => expenseCategories.id),
  vendor: varchar('vendor', { length: 255 }),
  description: text('description'),
  amount: varchar('amount', { length: 20 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
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
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
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
}));

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  invoices: many(invoices),
  quotes: many(quotes),
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