// src/types/models.ts

export const Role = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  SUPPORT_ADMIN: 'support_admin',
  FINANCE: 'finance',
  RESEARCH_ADMIN: 'research_admin'
} as const;

export type Role = typeof Role[keyof typeof Role];

export const SubscriptionStatus = {
  NONE: 'none',
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
} as const;

export type SubscriptionStatus = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

export const PortfolioStatus = {
  NOT_CREATED: 'not_created',
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
} as const;

export type PortfolioStatus = typeof PortfolioStatus[keyof typeof PortfolioStatus];

export interface User {
  uid: string;
  email: string;
  phone?: string;
  displayName: string;
  photoURL?: string;
  role: Role | string;
  status: 'active' | 'suspended' | 'revoked';
  revocationReason?: string;
  revokedAt?: string;
  revokedBy?: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  createdAt: string;
  lastLogin?: string;
  lastSeen?: string;
  country?: string;
  state?: string;
  city?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  referralCode?: string;
  referredBy?: string;
  notificationSettings?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  profileCompleted?: boolean;
  kycCompleted?: boolean;
  riskProfile?: 'Low' | 'Medium' | 'High';
  investmentExperience?: string;
  occupation?: string;
  panNumber?: string;
  dob?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  validityDays: number;
  features: string[];
  category: string;
  riskLevel: string;
  expectedCagr: number;
  minInvestment: number;
  stockLimit: number;
  isActive: boolean;
  isPopular: boolean;
  recommendedStocks?: string[];
  holdings?: any[];
}

export interface Payment {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed';
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  paymentId?: string;
  pricePaid: number;
  validityDays: number;
  status: SubscriptionStatus | string;
  purchaseDate: string;
  expiresAt: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioHolding {
  id?: string;
  portfolioId?: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  investment: number;
  currentPrice?: number;
  currentValue?: number;
  pnl?: number;
  allocation?: number;
  createdAt?: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: PortfolioStatus | string;
  totalInvestment: number;
  stockCount: number;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  expiresAt?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMaster {
  symbol: string;
  companyName: string;
  isin?: string;
  sector: string;
  industry?: string;
  marketCap?: number;
  logo?: string;
  exchange: 'NSE' | 'BSE' | 'BOTH';
}

export interface MarketPrice {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  lastUpdated: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  ip?: string;
  device?: string;
  browser?: string;
  time: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminReply?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  discountType: 'amount' | 'percentage';
  expiry: string;
  usageLimit: number;
  timesUsed: number;
  active: boolean;
}
