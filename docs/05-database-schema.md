# Database Schema (Firestore) & Full System Data Flow Architecture

This document is the **single source of truth** for the Arth Research Quantitative Advisory database architecture. It details all Firestore collections, document structures, integer minor unit monetary representations, client and admin read/write page mappings, and end-to-end data lifecycle rules.

---

## Architectural Principles

1. **Integer Minor Units for Currency (Paise)**:
   - All financial and monetary values (`basePriceMinor`, `taxMinor`, `gatewayFeeMinor`, `totalMinor`, `buyPriceMinor`, `totalInvestedMinor`) are strictly stored as **integer 64-bit paise** (1 INR = 100 paise).
   - Prevents floating-point rounding errors in tax calculations, invoices, and portfolio valuations.
2. **Access & Security Segmentation**:
   - Client access to live quantitative strategy terminals is strictly guarded by `accessStatus === 'active'`, active `subscription` validity, and an analyst-approved `portfolio` (`status: 'ACTIVE' | 'APPROVED'`).
3. **Immutable Regulatory Audit Trails**:
   - All critical analyst reviews, rebalance instructions, user suspensions, and payment orders log immutable timestamps in Firestore for SEBI compliance.

---

## Complete Collection Catalog

| Collection Name | Purpose | Primary Key (Document ID) | Key Consumer Pages |
| :--- | :--- | :--- | :--- |
| **`users`** | Identity, authentication profiles, KYC status, and security revocation flags | Firebase Auth UID (`user.uid`) | `LoginPage`, `UserLayout`, `ProfilePage`, `AdminUsers`, `AdminDashboard` |
| **`plans`** | Quantitative strategy tiers, pricing, stock limits, and algorithmic parameters | Auto-generated Firestore ID | `PlansPage`, `CheckoutPage`, `AdminSubscriptions`, `AdminDashboard` |
| **`orders`** | Razorpay payment records, statutory tax breakdowns, and invoices | Auto-generated Firestore ID | `CheckoutPage`, `HistoryPage`, `AdminSubscriptions`, `AdminDashboard` |
| **`subscriptions`** | Active advisory mandates, start/expiration dates, and validity terms | Auto-generated Firestore ID | `CheckoutPage`, `UserLayout`, `PlansPage`, `HistoryPage`, `AdminUsers` |
| **`entitlements`** | User-level capability flags (active plan IDs, signal access, terminal limits) | Firebase Auth UID (`user.uid`) | `UserLayout`, `DashboardPage`, `WatchlistPage` |
| **`portfolios`** | Executed stock holdings baskets, valuation metrics, and analyst audit states | Auto-generated Firestore ID | `PortfolioPage`, `PortfolioPendingPage`, `PortfolioRejectedPage`, `InvestmentEntryPage`, `AdminApprovals`, `AdminReviewPortfolio`, `AdminUserPortfolio` |
| **`instruments`** | Master stock universe, NSE/BSE tickers, ISINs, and sector classifications | NSE Symbol / Ticker (e.g. `RELIANCE`) | `InvestmentEntryPage`, `AdminStockSearch`, `WatchlistPage` |
| **`research_content`** | Quantitative research reports, alpha model signals, and monthly factsheets | Auto-generated Firestore ID | `DashboardPage`, `WatchlistPage`, `AdminContentHub` |
| **`support_tickets`** | Institutional helpdesk tickets, messages, and analyst responses | Auto-generated Firestore ID | `SupportPage`, `AdminSupport` |
| **`notifications`** | Real-time user inbox alerts (approvals, rebalances, invoices, tickets) | Auto-generated Firestore ID | `NotificationsPage`, `TopNavBar` |
| **`audit_logs`** | SEBI compliance audit trail for administrative and financial actions | Auto-generated Firestore ID | `AdminSettings`, `AdminDashboard` |
| **`cms_content`** | Dynamic public web copy, hero statistics, and disclosures | Page Identifier (e.g. `landingPage`, `welcomePage`) | `LandingPage`, `WelcomePage`, `PlansPage`, `AdminCMS` |

---

## Detailed Collection Schemas & Page Mappings

---

### 1. Collection: `users`
Stores user profile information, role-based access control, and regulatory account status.

* **Document ID:** Firebase Auth UID (`user.uid`)
* **Client Pages:**
  * **Read:** [UserLayout.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/layouts/UserLayout.tsx), [ProfilePage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/ProfilePage.tsx), [authStore.ts](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/stores/authStore.ts)
  * **Write:** [authStore.ts](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/stores/authStore.ts) (creates on first login), [ProfilePage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/ProfilePage.tsx)
* **Admin Pages:**
  * **Read:** [AdminUsers.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminUsers.tsx), [AdminDashboard.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminDashboard.tsx), [AdminApprovals.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminApprovals.tsx)
  * **Write:** [AdminUsers.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminUsers.tsx) (Revoke access with mandatory supervisor reason, reinstate access, change roles)

```typescript
interface UserDocument {
  uid: string;                               // Firebase Auth UID
  email: string;                             // Authenticated investor email
  displayName: string;                       // Investor full name
  role: 'admin' | 'user';                    // 'admin' grants access to /admin routes
  accessStatus: 'active' | 'revoked';        // If 'revoked', user is routed to /access-revoked
  revocationReason?: string;                 // Mandatory supervisor explanation for revocation
  revokedAt?: string;                        // ISO timestamp of revocation
  revokedBy?: string;                        // UID/Name of administrator who revoked access
  phone?: string;                            // Contact phone number
  pan?: string;                              // Tax identifier (PAN) for SEBI compliance
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  riskProfile?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  lastLoginAt?: string;                      // ISO timestamp
  createdAt: string;                         // ISO timestamp
  updatedAt?: string;                        // ISO timestamp
}
```

---

### 2. Collection: `plans`
Defines available quantitative research subscription tiers and algorithmic portfolio constraints.

* **Document ID:** Auto-generated Firestore ID
* **Client Pages:**
  * **Read:** [PlansPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/PlansPage.tsx), [CheckoutPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/CheckoutPage.tsx), [InvestmentEntryPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/InvestmentEntryPage.tsx)
* **Admin Pages:**
  * **Read:** [AdminSubscriptions.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminSubscriptions.tsx), [AdminDashboard.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminDashboard.tsx)
  * **Write:** [AdminSubscriptions.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminSubscriptions.tsx) (Create plan, Edit parameters, Archive/Activate, Delete)

```typescript
interface PlanDocument {
  id: string;                                // Auto-generated Firestore ID
  name: string;                              // e.g. "Wealth Multiplier Pro"
  description: string;                       // Algorithmic strategy description
  category: 'EQUITY' | 'FNO' | 'COMMODITY' | 'HYBRID';
  tier: 'BASIC' | 'PRO' | 'INSTITUTIONAL';
  basePriceMinor: number;                    // Base fee in paise (e.g. 499900 = ₹4,999.00)
  taxMinor: number;                          // Calculated 18% GST in paise (e.g. 89982 = ₹899.82)
  gatewayFeeMinor: number;                   // Calculated 3% convenience surcharge in paise (e.g. 17696 = ₹176.96)
  totalMinor: number;                        // Total client payable in paise (e.g. 607578 = ₹6,075.78)
  validityDays: number;                      // Mandate duration in days (e.g. 30, 90, 365)
  features: string[];                        // Array of feature bullet points
  stockLimit: number;                        // Max allowed stock positions (e.g. 10)
  minInvestmentMinor: number;                // Recommended min capital in paise
  maxInvestmentMinor?: number;               // Max capital allocation cap in paise
  targetCagr: number;                        // Backtested target CAGR percentage (e.g. 28.5)
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  isActive: boolean;                         // True if available on public catalog
  isPopular: boolean;                        // Highlight badge flag
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  sortOrder: number;                         // UI display order
  createdAt: string;                         // ISO timestamp
  updatedAt: string;                         // ISO timestamp
}
```

---

### 3. Collection: `orders`
Stores completed financial transactions, Razorpay settlement signatures, statutory tax splits, and invoices.

* **Document ID:** Auto-generated Firestore ID
* **Client Pages:**
  * **Read:** [HistoryPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/HistoryPage.tsx) (Billing history, Invoice downloads), [CheckoutPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/CheckoutPage.tsx)
  * **Write:** [CheckoutPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/CheckoutPage.tsx) (Created upon successful HMAC payment verification)
* **Admin Pages:**
  * **Read:** [AdminSubscriptions.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminSubscriptions.tsx) (Financial ledger & metrics), [AdminDashboard.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminDashboard.tsx)

```typescript
interface OrderDocument {
  id: string;                                // Auto-generated Firestore ID
  userId: string;                            // Ref -> users.uid
  planId: string;                            // Ref -> plans.id
  planName: string;                          // Snapshot of plan name
  razorpayOrderId: string;                   // Razorpay order ID (order_...)
  razorpayPaymentId: string;                 // Razorpay payment ID (pay_...)
  razorpaySignature: string;                 // Cryptographic HMAC SHA256 signature
  basePriceMinor: number;                    // Base taxable amount in paise
  discountMinor: number;                     // Applied promotional voucher discount in paise
  couponCode?: string;                       // Voucher code if applied
  taxMinor: number;                          // 18% GST in paise (9% CGST + 9% SGST)
  gatewayFeeMinor: number;                   // 3% Payment Gateway Surcharge in paise
  totalMinor: number;                        // Net settled amount in paise
  currency: 'INR';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  invoiceNumber: string;                     // e.g. "INV-ARTH-2026-004921"
  paymentDate: string;                       // Formatted payment date
  createdAt: string;                         // ISO timestamp
  updatedAt: string;                         // ISO timestamp
}
```

---

### 4. Collection: `subscriptions`
Tracks live investor advisory mandates, operational validity windows, and renewal statuses.

* **Document ID:** Auto-generated Firestore ID
* **Client Pages:**
  * **Read:** [UserLayout.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/layouts/UserLayout.tsx), [PlansPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/PlansPage.tsx), [HistoryPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/HistoryPage.tsx)
  * **Write:** [CheckoutPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/CheckoutPage.tsx) (Created immediately on order completion)
* **Admin Pages:**
  * **Read:** [AdminSubscriptions.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminSubscriptions.tsx), [AdminUsers.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminUsers.tsx), [AdminDashboard.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminDashboard.tsx)
  * **Write:** [AdminSubscriptions.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminSubscriptions.tsx) (Extend validity, Cancel mandate)

```typescript
interface SubscriptionDocument {
  id: string;                                // Auto-generated Firestore ID
  userId: string;                            // Ref -> users.uid
  userEmail: string;                         // Investor email
  userName: string;                          // Investor name
  planId: string;                            // Ref -> plans.id
  planName: string;                          // Strategy name
  orderId: string;                           // Ref -> orders.id
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startedAt: string;                         // ISO timestamp
  expiresAt: string;                         // ISO timestamp (calculated as startedAt + validityDays)
  validityDays: number;                      // Duration in days
  autoRenew: boolean;                        // Default false
  createdAt: string;                         // ISO timestamp
  updatedAt: string;                         // ISO timestamp
}
```

---

### 5. Collection: `entitlements`
User-level cached security capabilities, unlocking quantitative features across navigation layouts.

* **Document ID:** Firebase Auth UID (`user.uid`)
* **Client Pages:**
  * **Read:** [UserLayout.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/layouts/UserLayout.tsx), [DashboardPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/DashboardPage.tsx), [WatchlistPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/WatchlistPage.tsx)
  * **Write:** Updated by `subscriptionRepository.ts` whenever subscriptions activate or expire.

```typescript
interface EntitlementDocument {
  userId: string;                            // Firebase Auth UID
  activePlanIds: string[];                   // Array of currently active plan IDs
  maxPortfolioCount: number;                 // Allowed active portfolios
  hasResearchAccess: boolean;                // Flag for accessing quantitative reports
  hasLiveSignalsAccess: boolean;             // Flag for viewing alpha signals
  updatedAt: string;                         // ISO timestamp
}
```

---

### 6. Collection: `portfolios`
The core quantitative engine data. Stores client-executed stock positions, weights, and lead analyst clearance statuses.

* **Document ID:** Auto-generated Firestore ID
* **Client Pages:**
  * **Read:**
    * [PortfolioPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/PortfolioPage.tsx) (Locked unless `status === 'APPROVED' | 'ACTIVE'`)
    * [PortfolioPendingPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/PortfolioPendingPage.tsx) (Displayed when `status === 'PENDING'`)
    * [PortfolioRejectedPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/PortfolioRejectedPage.tsx) (Displayed when `status === 'REJECTED' | 'REVISION_REQUESTED'`)
    * [DashboardPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/DashboardPage.tsx)
  * **Write:**
    * [InvestmentEntryPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/InvestmentEntryPage.tsx) (Creates initial portfolio or resubmits revised holdings with `status: 'PENDING'`)
* **Admin Pages:**
  * **Read:**
    * [AdminApprovals.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminApprovals.tsx) (Real-time pending clearance queue)
    * [AdminReviewPortfolio.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminReviewPortfolio.tsx) (Analyst audit desk)
    * [AdminUserPortfolio.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminUserPortfolio.tsx)
    * [AdminDashboard.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminDashboard.tsx)
  * **Write:**
    * [AdminReviewPortfolio.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminReviewPortfolio.tsx) (Issues approval or requests revisions with remarks)
    * [AdminApprovals.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminApprovals.tsx) (Direct approval / reject)

```typescript
interface HoldingItem {
  symbol: string;                            // NSE Stock Ticker (e.g. "TCS")
  quantity: number;                          // Executed share count
  buyPriceMinor: number;                     // Average purchase price in paise
  buyDate?: string;                          // Execution date
  assetClass?: string;                       // e.g. "EQUITY"
  sector?: string;                           // e.g. "Information Technology"
  weight?: number;                           // Portfolio percentage weight (e.g. 20.0)
}

interface PortfolioDocument {
  id: string;                                // Auto-generated Firestore ID
  userId: string;                            // Ref -> users.uid
  userEmail: string;                         // Investor email
  userName: string;                          // Investor name
  planId: string;                            // Ref -> plans.id
  planName: string;                          // Mandate strategy name
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'REVISION_REQUESTED';
  holdings: HoldingItem[];                   // Executed positions array
  totalInvestedMinor: number;                // Total deployed capital in paise
  currentValueMinor?: number;                // Valuation in paise
  unrealizedPnLMinor?: number;               // Unrealized profit/loss in paise
  unrealizedPnLPercent?: number;             // Percentage gain/loss
  submittedAt: string;                       // ISO timestamp of client submission
  reviewedAt?: string;                       // ISO timestamp of analyst review
  reviewedBy?: string;                       // Analyst UID/Name
  analystRemarks?: string;                   // Notes from analyst on clearance
  rejectionReason?: string;                  // Rejection / revision feedback
  actionItems?: string[];                    // Specific fixes requested from user
  expiresAt?: string;                        // ISO timestamp aligned with subscription expiry
  createdAt: string;                         // ISO timestamp
  updatedAt: string;                         // ISO timestamp
}
```

---

### 7. Collection: `instruments`
Master security directory for fast, offline-capable symbol search and autocomplete.

* **Document ID:** NSE Symbol / Ticker (e.g. `RELIANCE`)
* **Client Pages:**
  * **Read:** [InvestmentEntryPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/InvestmentEntryPage.tsx), [WatchlistPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/WatchlistPage.tsx)
* **Admin Pages:**
  * **Read & Search:** [AdminStockSearch.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/components/admin/AdminStockSearch.tsx)

```typescript
interface InstrumentDocument {
  symbol: string;                            // Primary Key (e.g. "INFY")
  name: string;                              // e.g. "Infosys Limited"
  isin: string;                              // International Securities ID (e.g. "INE009A01021")
  sector: string;                            // e.g. "IT Services"
  assetClass: 'EQUITY' | 'ETF' | 'INDEX';
  exchange: 'NSE' | 'BSE';
  lotSize: number;                           // Standard 1 for equity
  isActive: boolean;
  lastPriceMinor?: number;                   // Last close price in paise
  updatedAt: string;                         // ISO timestamp
}
```

---

### 8. Collection: `research_content`
Stores institutional quantitative alpha signals, fundamental notes, and rebalance dispatches.

* **Document ID:** Auto-generated Firestore ID
* **Client Pages:**
  * **Read:** [DashboardPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/DashboardPage.tsx), [WatchlistPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/WatchlistPage.tsx)
* **Admin Pages:**
  * **Read & Write:** [AdminContentHub.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminContentHub.tsx) (Publish research reports, alpha signals, factsheets)

```typescript
interface ResearchContentDocument {
  id: string;                                // Auto-generated Firestore ID
  title: string;                             // e.g. "Q2 Momentum Rebalance Dispatch"
  ticker?: string;                           // e.g. "ICICIBANK"
  companyName?: string;                      // e.g. "ICICI Bank Limited"
  category: 'REPORT' | 'SIGNAL' | 'FACTSHEET' | 'MACRO';
  action?: 'BUY' | 'ACCUMULATE' | 'HOLD' | 'TRIM' | 'EXIT';
  targetPriceMinor?: number;                 // Target price in paise
  stopLossMinor?: number;                    // Stop loss price in paise
  cmpMinor?: number;                         // Current market price at signal generation
  timeHorizon?: string;                      // e.g. "6–9 Months"
  riskReward?: string;                       // e.g. "1:3.5"
  thesis: string;                            // Full analytical rationale
  pdfUrl?: string;                           // Downloadable research PDF attachment
  targetPlanIds: string[];                   // Strategy IDs entitled to view this research
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  publishedAt: string;                       // ISO timestamp
  publishedBy: string;                       // Analyst UID/Name
  createdAt: string;                         // ISO timestamp
}
```

---

### 9. Collection: `support_tickets`
Two-way institutional communication channel between investors and research/billing analysts.

* **Document ID:** Auto-generated Firestore ID
* **Client Pages:**
  * **Read & Write:** [SupportPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/SupportPage.tsx) (Create ticket, reply to analyst threads)
* **Admin Pages:**
  * **Read & Write:** [AdminSupport.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminSupport.tsx) (Manage queue, post replies, resolve tickets)

```typescript
interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'USER' | 'ADMIN';
  content: string;
  timestamp: string;
  attachments?: { filename: string; url: string }[];
}

interface SupportTicketDocument {
  id: string;                                // Auto-generated Firestore ID (e.g. "TCK-88219")
  userId: string;                            // Ref -> users.uid
  userEmail: string;
  userName: string;
  subject: string;                           // Ticket subject line
  category: 'BILLING' | 'PORTFOLIO' | 'TECHNICAL' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  messages: TicketMessage[];                 // Chronological conversation thread
  assignedAnalystId?: string;
  assignedAnalystName?: string;
  createdAt: string;                         // ISO timestamp
  updatedAt: string;                         // ISO timestamp
  resolvedAt?: string;                       // ISO timestamp
}
```

---

### 10. Collection: `notifications`
In-app investor telemetry and action alerts.

* **Document ID:** Auto-generated Firestore ID
* **Client Pages:**
  * **Read:** [NotificationsPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/NotificationsPage.tsx), [TopNavBar.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/components/TopNavBar.tsx) (Badge counter)
  * **Write:** [NotificationsPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/NotificationsPage.tsx) (Mark as read / delete)

```typescript
interface NotificationDocument {
  id: string;
  userId: string;                            // Ref -> users.uid
  title: string;                             // Short alert title
  message: string;                           // Detailed notification description
  type: 'INFO' | 'ALERT' | 'SUCCESS' | 'WARNING';
  link?: string;                             // Navigation route (e.g. "/portfolio")
  isRead: boolean;
  createdAt: string;                         // ISO timestamp
}
```

---

### 11. Collection: `audit_logs`
Immutable compliance and security audit logs for SEBI inspections and risk oversight.

* **Document ID:** Auto-generated Firestore ID
* **Admin Pages:**
  * **Read:** [AdminSettings.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminSettings.tsx), [AdminDashboard.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminDashboard.tsx)
* **System Triggers:** Written automatically by `auditRepository.ts` on approvals, rejections, user revocations, and mandate updates.

```typescript
interface AuditLogDocument {
  id: string;
  userId: string;                            // Administrator or System UID
  userEmail: string;
  action: string;                            // e.g. "PORTFOLIO_APPROVED", "USER_ACCESS_REVOKED"
  entityType: 'PORTFOLIO' | 'SUBSCRIPTION' | 'USER' | 'ORDER' | 'SYSTEM';
  entityId: string;                          // Target document ID
  details: Record<string, any>;              // Relevant metadata snapshot
  ipAddress?: string;                        // Client IP address
  userAgent?: string;                        // Browser User-Agent
  timestamp: string;                         // ISO timestamp
}
```

---

### 12. Collection: `cms_content`
Dynamic marketing copy, compliance disclosures, and hero statistics editable from the Admin CMS without code deployments.

* **Document ID:** Page/Section Key (`landingPage`, `welcomePage`, `plansPage`, `supportPage`)
* **Client Pages:**
  * **Read:** [LandingPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/LandingPage.tsx), [WelcomePage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/WelcomePage.tsx), [PlansPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/PlansPage.tsx)
* **Admin Pages:**
  * **Read & Write:** [AdminCMS.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminCMS.tsx)

```typescript
// Document ID: 'landingPage'
interface LandingPageCMSDocument {
  heroTitle: string;
  heroSubtitle: string;
  statsAum: string;                          // e.g. "₹450 Cr+"
  statsWinRate: string;                      // e.g. "76.4%"
  aboutTitle: string;
  aboutText: string;
  updatedAt: string;
}

// Document ID: 'welcomePage'
interface WelcomePageCMSDocument {
  title: string;
  subtitle: string;
  buttonText: string;
  updatedAt: string;
}
```

---

## Complete Data Flow Lifecycle

```
[1. User Registration]
       │
       ▼ (Google Auth / Email Login)
[users] (stores uid, email, role: 'user', accessStatus: 'active')
       │
       ▼ (Browses Strategy Catalog on /plans)
[plans] (fetches active plans with basePriceMinor, taxMinor, gatewayFeeMinor)
       │
       ▼ (Purchases Strategy on /checkout via Razorpay)
[orders] (persists settled payment, HMAC signature, 3% gateway surcharge, generates Tax Invoice PDF)
       │
       ▼ (Dispatches Tax Invoice PDF Attachment & Activates Mandate)
[subscriptions] (creates active subscription with expiresAt = now + validityDays)
[entitlements] (updates user entitlements cache)
       │
       ▼ (Client Configures Initial Stocks on /setup-portfolio)
[portfolios] (created with status: 'PENDING', holdings: [...])
       │
       ▼ (Analyst Reviews Execution Entries on /admin/approvals & /admin/review-portfolio)
       ├── Approved ──> [portfolios] (status: 'APPROVED' | 'ACTIVE') ──> Client /portfolio TERMINAL UNLOCKED
       └── Revisions ─> [portfolios] (status: 'REVISION_REQUESTED') ──> Client directed to /portfolio-rejected
```
