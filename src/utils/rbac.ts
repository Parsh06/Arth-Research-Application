// src/utils/rbac.ts
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShieldCheck,
  Settings,
  FileText,
  TrendingUp,
  Headphones,
  Mail,
  type LucideIcon
} from 'lucide-react';

export type UserRole = 'super_admin' | 'admin' | 'research_admin' | 'support_admin' | 'user' | string;

export interface AdminNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: string[];
}

export const ALL_ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { 
    name: 'Terminal Overview', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'admin']
  },
  { 
    name: 'User Directory', 
    href: '/admin/users', 
    icon: Users,
    allowedRoles: ['super_admin'] // Super Admin only
  },
  { 
    name: 'Portfolio Approvals', 
    href: '/admin/approvals', 
    icon: ShieldCheck,
    allowedRoles: ['super_admin', 'admin']
  },
  { 
    name: 'Advisory Plans', 
    href: '/admin/subscriptions', 
    icon: CreditCard,
    allowedRoles: ['super_admin', 'admin']
  },
  { 
    name: 'Research Signals', 
    href: '/admin/content', 
    icon: TrendingUp,
    allowedRoles: ['super_admin', 'admin', 'research_admin']
  },
  { 
    name: 'Email Hub', 
    href: '/admin/emails', 
    icon: Mail,
    allowedRoles: ['super_admin', 'admin', 'research_admin']
  },
  { 
    name: 'Support Desk', 
    href: '/admin/support', 
    icon: Headphones,
    allowedRoles: ['super_admin', 'admin', 'support_admin']
  },
  { 
    name: 'CMS & Governance', 
    href: '/admin/cms', 
    icon: FileText,
    allowedRoles: ['super_admin', 'admin']
  },
  { 
    name: 'Platform Settings', 
    href: '/admin/settings', 
    icon: Settings,
    allowedRoles: ['super_admin', 'admin']
  },
];

/**
 * Returns human-readable terminal title based on user role.
 * Returns null if user is a standard client/user.
 */
export function getTerminalTitle(role?: string): string | null {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized === 'super_admin') {
    return 'Super Admin Terminal';
  }
  if (normalized === 'admin') {
    return 'Admin Terminal';
  }
  if (normalized === 'research_admin' || normalized === 'research') {
    return 'Research Admin Terminal';
  }
  if (normalized === 'support_admin') {
    return 'Support Admin Terminal';
  }
  return null;
}

/**
 * Returns default landing route in the admin terminal for a given role.
 */
export function getDefaultAdminRoute(role?: string): string {
  if (!role) return '/dashboard';
  const normalized = role.toLowerCase();
  if (normalized === 'research_admin' || normalized === 'research') {
    return '/admin/content';
  }
  if (normalized === 'support_admin') {
    return '/admin/support';
  }
  return '/admin/dashboard';
}

/**
 * Filter allowed navigation links based on user role.
 */
export function getNavItemsForRole(role?: string): AdminNavItem[] {
  if (!role) return [];
  const normalized = role.toLowerCase();
  return ALL_ADMIN_NAV_ITEMS.filter(item => item.allowedRoles.includes(normalized));
}

/**
 * Validates whether a given path is permitted for a specific role.
 */
export function isPathAllowedForRole(pathname: string, role?: string): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase();
  if (normalized === 'super_admin') return true;

  const navItems = getNavItemsForRole(role);
  return navItems.some(item => pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)));
}
