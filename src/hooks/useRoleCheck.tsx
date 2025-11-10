import { useUserRole, AppRole } from './useUserRole';

// Define permissions for each role
const ROLE_HIERARCHY: Record<AppRole, number> = {
  admin: 4,
  staff: 3,
  viewer: 2,
  user: 1,
};

export const PERMISSIONS = {
  // Admin only
  MANAGE_USERS: ['admin'],
  MANAGE_ROLES: ['admin'],
  VIEW_SYSTEM_LOGS: ['admin'],
  MANAGE_SUBSCRIPTIONS: ['admin'],
  VIEW_ALL_INVOICES: ['admin'],
  
  // Admin and Staff
  CREATE_SALES: ['admin', 'staff'],
  EDIT_SALES: ['admin', 'staff'],
  DELETE_SALES: ['admin', 'staff'],
  CREATE_PURCHASES: ['admin', 'staff'],
  EDIT_PURCHASES: ['admin', 'staff'],
  DELETE_PURCHASES: ['admin', 'staff'],
  MANAGE_INVENTORY: ['admin', 'staff'],
  MANAGE_CUSTOMERS: ['admin', 'staff'],
  MANAGE_EXPENSES: ['admin', 'staff'],
  
  // Admin, Staff, and Viewer
  VIEW_DASHBOARD: ['admin', 'staff', 'viewer'],
  VIEW_REPORTS: ['admin', 'staff', 'viewer'],
  VIEW_SALES: ['admin', 'staff', 'viewer'],
  VIEW_PURCHASES: ['admin', 'staff', 'viewer'],
  VIEW_INVENTORY: ['admin', 'staff', 'viewer'],
  VIEW_CUSTOMERS: ['admin', 'staff', 'viewer'],
  VIEW_EXPENSES: ['admin', 'staff', 'viewer'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const useRoleCheck = () => {
  const { role, loading } = useUserRole();

  const hasPermission = (permission: Permission): boolean => {
    const allowedRoles = PERMISSIONS[permission] as readonly string[];
    return allowedRoles.includes(role);
  };

  const hasRole = (requiredRole: AppRole): boolean => {
    const currentLevel = ROLE_HIERARCHY[role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return currentLevel >= requiredLevel;
  };

  const canEdit = (): boolean => {
    return role === 'admin' || role === 'staff';
  };

  const isReadOnly = (): boolean => {
    return role === 'viewer';
  };

  return {
    role,
    loading,
    hasPermission,
    hasRole,
    canEdit,
    isReadOnly,
  };
};
