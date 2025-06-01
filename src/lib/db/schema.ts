import * as sqliteSchema from './schema/sqlite'
import * as pgSchema from './schema/pg'

const isSQLite =
  process.env.DB_DIALECT === 'sqlite' ||
  process.env.DATABASE_URL?.startsWith('sqlite') ||
  !process.env.DATABASE_URL;

const schema = isSQLite ? sqliteSchema : pgSchema;

// Create a test table for verifying the setup
export const test = schema.test;
// Define role enum
export const roleEnum = schema.roleEnum

// Define invoice status enum
export const invoiceStatusEnum = schema.invoiceStatusEnum;

// Define quote status enum
export const quoteStatusEnum = schema.quoteStatusEnum

// Define companies table
export const companies = schema.companies;

// Define users table
export const users = schema.users;

// Define clients table
export const clients = schema.clients;

// Define invoices table
export const invoices = schema.invoices;

// Define invoice items table
export const invoiceItems = schema.invoiceItems;

// Define quotes table
export const quotes = schema.quotes;
// Define quote items table
export const quoteItems = schema.quoteItems;

// Expense Categories Table
export const expenseCategories = schema.expenseCategories;

// Define vendors table
export const vendors = schema.vendors;

// Expenses Table
export const expenses = schema.expenses;

// Income Categories Table
export const incomeCategories = schema.incomeCategories;

// Income Table
export const income = schema.income;
// Define account type enum
export const accountTypeEnum = schema.accountTypeEnum;
// Define transaction type enum
export const transactionTypeEnum = schema.transactionTypeEnum;

// Define payment method enum
export const paymentMethodEnum = schema.paymentMethodEnum;
// Define payment status enum
export const paymentStatusEnum = schema.paymentStatusEnum;

// Define API tokens table
export const apiTokens = schema.apiTokens;

// Define client users table for portal access
export const clientUsers = schema.clientUsers;

// Define invitation status enum
export const invitationStatusEnum = schema.invitationStatusEnum;

// Define client login tokens for magic link authentication
export const clientLoginTokens = schema.clientLoginTokens;

// Define company invitations table
export const companyInvitations = schema.companyInvitations;

// Define accounts table
export const accounts = schema.accounts;

// Define transactions table
export const transactions = schema.transactions;

// Define payments table
export const payments = schema.payments;

// Company relationships
export const companiesRelations = schema.companiesRelations;

export const usersRelations = schema.usersRelations

export const clientsRelations = schema.clientsRelations;

export const invoicesRelations = schema.invoicesRelations

export const invoiceItemsRelations = schema.invoiceItemsRelations;

// Expense Categories relationships
export const expenseCategoriesRelations = schema.expenseCategoriesRelations;
// Expense relationships
export const expensesRelations = schema.expensesRelations;

// Income Categories relationships
export const incomeCategoriesRelations = schema.incomeCategoriesRelations;
// Income relationships
export const incomeRelations = schema.incomeRelations;

// Quote relationships
export const quotesRelations = schema.quotesRelations;

export const quoteItemsRelations = schema.quoteItemsRelations;

// Account relationships
export const accountsRelations = schema.accountsRelations;

// Transaction relationships
export const transactionsRelations = schema.transactionsRelations;

// Payment relationships
export const paymentsRelations = schema.paymentsRelations;

// Define client users relations
export const clientUsersRelations = schema.clientUsersRelations;

// Define company invitations relations
export const companyInvitationsRelations = schema.companyInvitationsRelations;

// Define vendors relations
export const vendorsRelations = schema.vendorsRelations;

// Define API tokens relations
export const apiTokensRelations = schema.apiTokensRelations;