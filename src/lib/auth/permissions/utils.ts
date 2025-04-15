import { Role } from './roles';

/**
 * Define permission structure based on roles
 */
type PermissionMatrix = {
  [key in Role]: Record<string, boolean>;
};

/**
 * Permission matrix that defines the default permissions for each role
 */
const PERMISSION_MATRIX: PermissionMatrix = {
  admin: {
    // Company management
    'company.view': true,
    'company.manage': true,
    
    // User management
    'users.view': true,
    'users.invite': true,
    'users.edit': true,
    'users.delete': true,
    
    // Client management
    'clients.view': true,
    'clients.create': true,
    'clients.edit': true,
    'clients.delete': true,
    
    // Invoice management
    'invoices.view': true,
    'invoices.create': true,
    'invoices.edit': true,
    'invoices.delete': true,
    'invoices.markAsPaid': true,
    'invoices.void': true,
    
    // Quote management
    'quotes.view': true,
    'quotes.create': true,
    'quotes.edit': true,
    'quotes.delete': true,
    'quotes.accept': true,
    
    // Financial management
    'finance.manageAccounts': true,
    'finance.recordPayments': true,
    'finance.viewReports': true,
    'finance.manageExpenses': true,
  },
  
  accountant: {
    // Company management
    'company.view': true,
    'company.manage': false,
    
    // User management
    'users.view': false,
    'users.invite': false,
    'users.edit': false,
    'users.delete': false,
    
    // Client management
    'clients.view': true,
    'clients.create': false,
    'clients.edit': false,
    'clients.delete': false,
    
    // Invoice management
    'invoices.view': true,
    'invoices.create': false,
    'invoices.edit': false,
    'invoices.delete': false,
    'invoices.markAsPaid': true,
    'invoices.void': true,
    
    // Quote management
    'quotes.view': true,
    'quotes.create': false,
    'quotes.edit': false,
    'quotes.delete': false,
    'quotes.accept': true,
    
    // Financial management
    'finance.manageAccounts': true,
    'finance.recordPayments': true,
    'finance.viewReports': true,
    'finance.manageExpenses': true,
  },
  
  staff: {
    // Company management
    'company.view': true,
    'company.manage': false,
    
    // User management
    'users.view': false,
    'users.invite': false,
    'users.edit': false,
    'users.delete': false,
    
    // Client management
    'clients.view': true,
    'clients.create': true,
    'clients.edit': true,
    'clients.delete': false,
    
    // Invoice management
    'invoices.view': true,
    'invoices.create': true,
    'invoices.edit': true,
    'invoices.delete': false,
    'invoices.markAsPaid': false,
    'invoices.void': false,
    
    // Quote management
    'quotes.view': true,
    'quotes.create': true,
    'quotes.edit': true,
    'quotes.delete': false,
    'quotes.accept': false,
    
    // Financial management
    'finance.manageAccounts': false,
    'finance.recordPayments': false,
    'finance.viewReports': false,
    'finance.manageExpenses': false,
  },
};

/**
 * Get the permissions for a specific role
 */
export function getUserPermissions(role: Role): Record<string, boolean> {
  return PERMISSION_MATRIX[role] || {};
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  permissions: Record<string, boolean> | undefined,
  permission: string
): boolean {
  if (!permissions) return false;
  return !!permissions[permission];
} 