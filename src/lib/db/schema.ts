import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  boolean,
  integer,
  pgEnum,
  uuid,
  uniqueIndex
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

// Define relationships
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  clients: many(clients),
}));

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one }) => ({
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
}));