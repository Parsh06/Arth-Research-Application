export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  validityDays: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedCagr: number;
  features: string[];
  minInvestment: number;
  stockLimit: number;
  isActive: boolean;
  category: string;
  description: string;
  isPopular?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'pending' | 'active' | 'expired';
  startDate: string;
  endDate: string;
  paymentId?: string;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface PortfolioTemplate {
  id: string;
  planId: string;
  name: string;
  stocks: {
    symbol: string;
    allocationPercent: number;
  }[];
}

export interface PortfolioStock {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  type: string;
}

export interface UserPortfolio {
  id: string;
  userId: string;
  userName: string;
  planId: string;
  status: 'pending' | 'active' | 'approved' | 'rejected';
  investedAmount?: number;
  currentValue?: number;
  expiresAt?: number;
  stocks: PortfolioStock[];
}
