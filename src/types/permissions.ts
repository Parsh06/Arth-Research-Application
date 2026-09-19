// src/types/permissions.ts

export const Permission = {
  USER_READ_SELF: 'USER_READ_SELF',
  USER_UPDATE_SELF: 'USER_UPDATE_SELF',

  PORTFOLIO_READ_SELF: 'PORTFOLIO_READ_SELF',
  PORTFOLIO_CREATE: 'PORTFOLIO_CREATE',
  PORTFOLIO_SUBMIT: 'PORTFOLIO_SUBMIT',
  PORTFOLIO_REVIEW: 'PORTFOLIO_REVIEW',
  PORTFOLIO_APPROVE: 'PORTFOLIO_APPROVE',
  PORTFOLIO_REJECT: 'PORTFOLIO_REJECT',
  PORTFOLIO_EDIT: 'PORTFOLIO_EDIT',

  SUBSCRIPTION_VIEW: 'SUBSCRIPTION_VIEW',
  SUBSCRIPTION_EXTEND: 'SUBSCRIPTION_EXTEND',

  PAYMENT_VIEW: 'PAYMENT_VIEW',
  REFUND_APPROVE: 'REFUND_APPROVE',

  KYC_VIEW: 'KYC_VIEW',
  KYC_VERIFY: 'KYC_VERIFY',

  SUPPORT_READ: 'SUPPORT_READ',
  SUPPORT_REPLY: 'SUPPORT_REPLY',

  CMS_EDIT: 'CMS_EDIT',
  CMS_PUBLISH: 'CMS_PUBLISH',

  RESEARCH_EDIT: 'RESEARCH_EDIT',
  RESEARCH_PUBLISH: 'RESEARCH_PUBLISH',

  ADMIN_ROLE_MANAGE: 'ADMIN_ROLE_MANAGE',
  AUDIT_READ: 'AUDIT_READ',
  SECURITY_EVENT_READ: 'SECURITY_EVENT_READ',
  DATA_EXPORT: 'DATA_EXPORT'
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

export const RolePermissions: Record<string, Permission[]> = {
  user: [
    Permission.USER_READ_SELF,
    Permission.USER_UPDATE_SELF,
    Permission.PORTFOLIO_READ_SELF,
    Permission.PORTFOLIO_CREATE,
    Permission.PORTFOLIO_SUBMIT,
    Permission.SUPPORT_READ
  ],
  support: [
    Permission.SUPPORT_READ,
    Permission.SUPPORT_REPLY,
    Permission.PORTFOLIO_REVIEW
  ],
  finance: [
    Permission.SUBSCRIPTION_VIEW,
    Permission.PAYMENT_VIEW,
    Permission.REFUND_APPROVE,
    Permission.AUDIT_READ
  ],
  research_admin: [
    Permission.PORTFOLIO_REVIEW,
    Permission.PORTFOLIO_APPROVE,
    Permission.PORTFOLIO_REJECT,
    Permission.PORTFOLIO_EDIT,
    Permission.RESEARCH_EDIT,
    Permission.RESEARCH_PUBLISH,
    Permission.CMS_EDIT
  ],
  admin: [
    Permission.PORTFOLIO_REVIEW,
    Permission.PORTFOLIO_APPROVE,
    Permission.PORTFOLIO_REJECT,
    Permission.PORTFOLIO_EDIT,
    Permission.SUBSCRIPTION_VIEW,
    Permission.SUBSCRIPTION_EXTEND,
    Permission.PAYMENT_VIEW,
    Permission.SUPPORT_READ,
    Permission.SUPPORT_REPLY,
    Permission.CMS_EDIT,
    Permission.CMS_PUBLISH,
    Permission.RESEARCH_EDIT,
    Permission.RESEARCH_PUBLISH,
    Permission.AUDIT_READ
  ],
  super_admin: Object.values(Permission)
};

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  if (role === 'super_admin') return true;
  const permissions = RolePermissions[role] || [];
  return permissions.includes(permission);
}
