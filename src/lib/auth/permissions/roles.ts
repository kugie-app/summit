import { Session } from 'next-auth';

export type Role = 'admin' | 'accountant' | 'staff';

export interface UserSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
    companyId?: string;
    permissions?: Record<string, boolean>;
  };
}

/**
 * Check if the user has any of the specified roles
 */
export function hasRole(session: UserSession | null, roles: Role[]): boolean {
  if (!session?.user?.role) return false;
  return roles.includes(session.user.role);
}

/**
 * Check if user is an admin
 */
export function isAdmin(session: UserSession | null): boolean {
  return hasRole(session, ['admin']);
}

/**
 * Check if user is a staff member
 */
export function isStaff(session: UserSession | null): boolean {
  return hasRole(session, ['staff']);
}

/**
 * Check if user is an accountant
 */
export function isAccountant(session: UserSession | null): boolean {
  return hasRole(session, ['accountant']);
}

/**
 * Check if user is an admin or accountant (for financial permissions)
 */
export function hasFinancialAccess(session: UserSession | null): boolean {
  return hasRole(session, ['admin', 'accountant']);
}

/**
 * Check if the user belongs to the specified company
 */
export function isSameCompany(session: UserSession | null, companyId: string | number): boolean {
  if (!session?.user?.companyId) return false;
  return session.user.companyId === companyId.toString();
}

/**
 * Check if user has a specific permission
 */
export function checkPermission(session: UserSession | null, permission: string): boolean {
  if (!session?.user?.permissions) return false;
  return !!session.user.permissions[permission];
}

/**
 * Permissions map for different areas of the application
 */
export const Permissions = {
  // Company-wide permissions
  company: {
    manage: (session: UserSession | null) => checkPermission(session, 'company.manage'),
    view: (session: UserSession | null) => checkPermission(session, 'company.view'),
  },
  
  // User management
  users: {
    invite: (session: UserSession | null) => checkPermission(session, 'users.invite'),
    view: (session: UserSession | null) => checkPermission(session, 'users.view'),
    delete: (session: UserSession | null) => checkPermission(session, 'users.delete'),
    edit: (session: UserSession | null) => checkPermission(session, 'users.edit'),
  },
  
  // Client management
  clients: {
    create: (session: UserSession | null) => checkPermission(session, 'clients.create'),
    edit: (session: UserSession | null) => checkPermission(session, 'clients.edit'),
    delete: (session: UserSession | null) => checkPermission(session, 'clients.delete'),
    view: (session: UserSession | null) => checkPermission(session, 'clients.view'),
  },
  
  // Invoice management
  invoices: {
    create: (session: UserSession | null) => checkPermission(session, 'invoices.create'),
    edit: (session: UserSession | null) => checkPermission(session, 'invoices.edit'),
    delete: (session: UserSession | null) => checkPermission(session, 'invoices.delete'),
    view: (session: UserSession | null) => checkPermission(session, 'invoices.view'),
    markAsPaid: (session: UserSession | null) => checkPermission(session, 'invoices.markAsPaid'),
    void: (session: UserSession | null) => checkPermission(session, 'invoices.void'),
  },
  
  // Quote management
  quotes: {
    create: (session: UserSession | null) => checkPermission(session, 'quotes.create'),
    edit: (session: UserSession | null) => checkPermission(session, 'quotes.edit'),
    delete: (session: UserSession | null) => checkPermission(session, 'quotes.delete'),
    view: (session: UserSession | null) => checkPermission(session, 'quotes.view'),
    accept: (session: UserSession | null) => checkPermission(session, 'quotes.accept'),
  },
  
  // Financial management
  finance: {
    manageAccounts: (session: UserSession | null) => checkPermission(session, 'finance.manageAccounts'),
    recordPayments: (session: UserSession | null) => checkPermission(session, 'finance.recordPayments'),
    viewReports: (session: UserSession | null) => checkPermission(session, 'finance.viewReports'),
    manageExpenses: (session: UserSession | null) => checkPermission(session, 'finance.manageExpenses'),
  },
}; 