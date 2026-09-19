# Database Schema (Firestore) & Full System Data Flow Architecture

This document is the **single source of truth** for the Arth Research Quantitative Advisory database architecture. It details all Firestore collections, document structures, integer minor unit monetary representations, client and admin read/write page mappings, Firestore Security Rules enforcement matrix, and end-to-end data lifecycle rules.

---

## Architectural Principles

1. **Integer Minor Units for Currency (Paise)**:
   - All financial and monetary values (`basePriceMinor`, `taxMinor`, `gatewayFeeMinor`, `totalMinor`, `buyPriceMinor`, `totalInvestedMinor`) are strictly stored as **integer 64-bit paise** (1 INR = 100 paise).
   - Prevents floating-point rounding errors in tax calculations, invoices, and portfolio valuations.

2. **Firestore Security Rules (Client-Side Enforcement)**:
   - Every collection has explicit `allow` rules in `firestore.rules`. See the **Security Rules Matrix** section below.
   - Key rule: Users can never write `role`, `status`, `accessStatus`, or any financial field via the client SDK.
   - Subcollections (`portfolios/versions`, `portfolios/holdings`, `support_tickets/messages`) are scoped to the parent document owner — not globally visible to all authenticated users.

3. **Entitlement Consistency Strategy**:
   - `entitlements` is a **denormalized cache**. The canonical source of truth is `subscriptions`.
   - The single write path is `entitlementRepository.syncEntitlementsFromSubscription()`.
   - This function is called atomically after every subscription lifecycle event: payment, extension, cancellation, and expiry.
   - All other entitlement-provisioning code routes through this function.

4. **Immutable Regulatory Audit Trails (SEBI Compliance)**:
   - `auditLogs` documents are write-once. Firestore rules enforce `allow update: if false; allow delete: if false;`.
   - The `clearAllLogs()` method has been permanently removed from `auditRepository.ts`.
   - The Admin Dashboard shows a "🔒 SEBI Immutable" badge instead of a "Clear Logs" button.
   - If data retention purging is legally required, it must be executed via a privileged Firebase Admin SDK server function with explicit documented authorization.

5. **Financial Record Immutability (Orders & Subscriptions)**:
   - `orders` documents are **write-once from the client**. Only admins can update for reconciliation.
   - `subscriptions` documents cannot be updated by users. Only admins can extend or cancel.
   - This prevents any client from spoofing their own subscription status to `active`.

6. **Role-Based Access Control (RBAC)**:
   - Three roles: `user`, `admin` / `research_admin` / `super_admin`, `support`.
   - `isAdmin()` helper checks the `users/{uid}.role` field on every sensitive write.
   - `isSupportOrAdmin()` used for ticket/helpdesk access.
   - Users cannot self-promote: Firestore rules use `hasOnly(['displayName', 'phone', 'photoURL', 'updatedAt'])` on user self-update.

7. **Domain Segregation (Private & Compliance Data)**:
   - `users` — public profile (displayName, role, status).
   - `userPrivate/{uid}` — PII (phone, bank details, address). Admin read-only; user write.
   - `userCompliance/{uid}` — KYC, PAN, risk profile. Admin read-only; user write. Records never deleted.

8. **Portfolio Versioning (Audit History)**:
   - Each portfolio maintains a `portfolios/{id}/versions/{versionId}` subcollection.
   - Every status transition (submit → approve → resubmit → approve) creates a new immutable version document.
   - Version documents have `allow update, delete: if false` in Firestore rules.
   - The root `portfolios/{id}` document tracks `currentVersionId` for fast reads.

---

## Security Rules Matrix

| Collection | User Read | User Write | Admin Read | Admin Write | Notes |
|:---|:---|:---|:---|:---|:---|
| `users/{uid}` | Own doc only | Own doc, safe fields only¹ | All | All | ¹ `hasOnly(['displayName','phone','photoURL','updatedAt'])` |
| `userPrivate/{uid}` | Own doc only | Own doc only | Read only | ❌ | PII — admin cannot overwrite |
| `userCompliance/{uid}` | Own doc only | Own doc only (create/update) | Read only | ❌ | KYC — records never deleted |
| `plans` | ✅ Public | ❌ | ✅ | ✅ | All visitors may browse catalog |
| `instruments` | Auth only | ❌ | ✅ | ✅ | Protected from anonymous scraping |
| `research_content` | Entitlement-gated² | ❌ | ✅ | ✅ | ²Requires active `feature_research_signals` |
| `orders` | Own docs | Create only (status=created) | ✅ | ✅ | Users cannot update order status |
| `payments` | Own docs | Create only | ✅ | ✅ | Reconciliation via admin only |
| `subscriptions` | Own docs | Create only (status=active) | ✅ | ✅ | Users cannot flip status |
| `entitlements` | Own docs (UID-prefix³) | Limited update⁴ | ✅ | ✅ | ³ID validated as `{uid}_{feature}` |
| `portfolios` | Own docs | Create(pending) + update(pending)⁵ | ✅ | ✅ | ⁵Users can only resubmit with status=pending |
| `portfolios/versions` | Own portfolio | Create | ✅ | ✅ | Immutable: no update/delete |
| `portfolios/holdings` | Own portfolio | Own portfolio | ✅ | ✅ | |
| `notifications` | Own docs | Mark-read only⁶ | ✅ | ✅ | ⁶`hasOnly(['isRead','readAt'])` |
| `support_tickets` | Own docs | Create + update(reply) | ✅ (support+) | ✅ | |
| `support_tickets/messages` | Own ticket | Create only | ✅ (support+) | ✅ | Immutable: no update/delete |
| `cms_content` | ✅ Public | ❌ | ✅ | ✅ | |
| `auditLogs` | ❌ | ❌ | ✅ | Create only | **No update. No delete. Ever.** |

---

## Data Retention Policy

| Collection | Retention | Action |
|:---|:---|:---|
| `users` | Indefinite | GDPR right-to-erasure via Admin SDK purge function |
| `userPrivate` | 7 years (SEBI) | Anonymized after 7 years via cron job |
| `orders` | 7 years (GST/Income Tax) | Archive to Cold Storage bucket after 3 years |
| `payments` | 7 years | Archive after 3 years |
| `subscriptions` | 7 years | Archive after plan expiry + 7 years |
| `auditLogs` | 7 years (SEBI) | Immutable; no purging from client |
| `portfolios` | 7 years post-expiry | Admin-only archival; versions subcollection retained |
| `notifications` | 90 days | Auto-purged by cron |
| `support_tickets` | 3 years | Archive after resolution + 3 years |

---

## Complete Collection Catalog

| Collection Name | Purpose | Primary Key (Document ID) | Key Consumer Pages |
| :--- | :--- | :--- | :--- |
| **`users`** | Identity, authentication profiles, KYC status, and security revocation flags | Firebase Auth UID (`user.uid`) | `LoginPage`, `UserLayout`, `ProfilePage`, `AdminUsers`, `AdminDashboard` |
| **`userPrivate`** | Sensitive PII: phone, address, bank details (domain-segregated from public profile) | Firebase Auth UID (`user.uid`) | `ProfilePage` (write), `AdminUsers` (read-only) |
| **`userCompliance`** | SEBI compliance data: PAN, KYC status, risk profiling | Firebase Auth UID (`user.uid`) | `ProfilePage` (write), `AdminUsers` (read-only) |
| **`plans`** | Quantitative strategy tiers, pricing, stock limits, and algorithmic parameters | Auto-generated Firestore ID | `PlansPage`, `CheckoutPage`, `AdminSubscriptions`, `AdminDashboard` |
| **`orders`** | Razorpay payment records, statutory tax breakdowns, and invoices | Auto-generated Firestore ID | `CheckoutPage`, `HistoryPage`, `AdminSubscriptions`, `AdminDashboard` |
| **`payments`** | Razorpay gateway capture events, HMAC signatures, refund records | Auto-generated Firestore ID | `CheckoutPage` (create), `AdminSubscriptions` (read) |
| **`subscriptions`** | Active advisory mandates, start/expiration dates, and validity terms | Auto-generated Firestore ID | `CheckoutPage`, `UserLayout`, `PlansPage`, `HistoryPage`, `AdminUsers` |
| **`entitlements`** | User-level capability flags cache (active plan IDs, signal access, terminal limits) | `{userId}_{featureKey}` compound key | `UserLayout`, `DashboardPage`, `WatchlistPage` |
| **`portfolios`** | Executed stock holdings baskets, valuation metrics, and analyst audit states | Auto-generated Firestore ID | `PortfolioPage`, `PortfolioPendingPage`, `PortfolioRejectedPage`, `InvestmentEntryPage`, `AdminApprovals`, `AdminReviewPortfolio`, `AdminUserPortfolio` |
| **`portfolios/{id}/versions`** | Immutable version snapshots of each portfolio state transition | Auto-generated Firestore ID | `AdminReviewPortfolio` (read) |
| **`portfolios/{id}/holdings`** | Individual stock positions per portfolio version | Auto-generated Firestore ID | `PortfolioPage`, `InvestmentEntryPage` |
| **`instruments`** | Master stock universe, NSE/BSE tickers, ISINs, and sector classifications | NSE Symbol / Ticker (e.g. `RELIANCE`) | `InvestmentEntryPage`, `AdminStockSearch`, `WatchlistPage` |
| **`research_content`** | Quantitative research reports, alpha model signals, and monthly factsheets | Auto-generated Firestore ID | `DashboardPage`, `WatchlistPage`, `AdminContentHub` |
| **`support_tickets`** | Institutional helpdesk tickets and analyst responses | Auto-generated Firestore ID | `SupportPage`, `AdminSupport` |
| **`notifications`** | Real-time user inbox alerts (approvals, rebalances, invoices, tickets) | Auto-generated Firestore ID | `NotificationsPage`, `TopNavBar` |
| **`auditLogs`** | SEBI compliance audit trail for administrative and financial actions | Auto-generated Firestore ID | `AdminSettings`, `AdminDashboard` |
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
* **Security Note:** Users can self-update only `displayName`, `phone`, `photoURL`, `updatedAt`. Firestore rules reject any attempt to modify `role`, `status`, `accessStatus`, or `revokedBy`.

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
  phone?: string;                            // Contact phone number (moved to userPrivate for new users)
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  lastLoginAt?: string;                      // ISO timestamp
  createdAt: string;                         // ISO timestamp
  updatedAt?: string;                        // ISO timestamp
}
```

---

### 1a. Collection: `userPrivate`
Stores sensitive PII separate from the public user profile for domain segregation.

* **Document ID:** Firebase Auth UID (`user.uid`)
* **Client Pages:** [ProfilePage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/ProfilePage.tsx)
* **Admin Pages:** [AdminUsers.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminUsers.tsx) — **read-only**
* **Security Note:** Admins can READ but cannot WRITE to `userPrivate`. This prevents admin impersonation of bank/contact data.

```typescript
interface UserPrivateDocument {
  phone?: string;
  alternateEmail?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    pinCode: string;
  };
  updatedAt: string;
}
```

---

### 1b. Collection: `userCompliance`
SEBI-regulated KYC and risk profiling data. Never deleted.

* **Document ID:** Firebase Auth UID (`user.uid`)
* **Client Pages:** [ProfilePage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/ProfilePage.tsx)
* **Admin Pages:** [AdminUsers.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminUsers.tsx) — **read-only**

```typescript
interface UserComplianceDocument {
  pan?: string;                              // Tax identifier (PAN) for SEBI compliance
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  kycVerifiedAt?: string;                    // ISO timestamp
  riskProfile?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  riskProfileUpdatedAt?: string;
  updatedAt: string;
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
* **Security Note:** Client can only `create` with `status: 'created'`. Only admin can update (for reconciliation). Orders are never deleted.

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
* **Security Note:** Users cannot update subscription documents. Only admin can (extend/cancel). This prevents status spoofing.

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
  warningEmailSentAt?: string;               // ISO timestamp — prevents duplicate 7-day warning
  expiredNoticeSentAt?: string;              // ISO timestamp — prevents duplicate expiry notice
  createdAt: string;                         // ISO timestamp
  updatedAt: string;                         // ISO timestamp
}
```

---

### 5. Collection: `entitlements`
User-level cached security capabilities, unlocking quantitative features across navigation layouts.

* **Document ID:** `{userId}_{featureKey}` compound key (e.g. `abc123_feature_research_signals`)
* **Client Pages:**
  * **Read:** [UserLayout.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/layouts/UserLayout.tsx), [DashboardPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/DashboardPage.tsx), [WatchlistPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/WatchlistPage.tsx)
  * **Write:** Updated exclusively via `entitlementRepository.syncEntitlementsFromSubscription()` on any subscription lifecycle event.
* **Security Note:** Document ID prefix is validated against the authenticated UID. Users cannot create entitlements for other users. Admins can write any entitlement.

```typescript
interface EntitlementDocument {
  id: string;                                // Compound key: "{userId}_{featureKey}"
  userId: string;                            // Firebase Auth UID
  planId: string;                            // Ref -> plans.id
  featureKey: string;                        // e.g. "feature_research_signals", "access_plan_{planId}"
  isActive: boolean;                         // false when plan cancelled or expired
  expiresAt: number;                         // Unix epoch milliseconds
}

// Standard feature keys provisioned on every subscription:
const FeatureKeys = {
  PORTFOLIO_ANALYTICS: 'feature_portfolio_analytics',
  RESEARCH_SIGNALS: 'feature_research_signals',
  CUSTOM_WATCHLIST: 'feature_custom_watchlist',
  PRIORITY_SUPPORT: 'feature_priority_support',
  FACTOR_RADAR: 'feature_factor_radar'
  // + dynamic: `access_plan_{planId}`
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
  * **Write:**
    * [AdminReviewPortfolio.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminReviewPortfolio.tsx) (Issues approval or requests revisions with remarks)
* **Security Note:** Users can only update their own portfolio to `status: 'pending'` (resubmission). They cannot flip to `active` or `approved`. Admins perform all status transitions.

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
  currentVersionId?: string;                 // Points to latest version in versions subcollection
  totalInvestmentMinor: number;              // Total deployed capital in paise
  stockCount: number;                        // Number of holdings
  expiresAt?: number;                        // Unix epoch ms, aligned with subscription expiry
  submittedAt: string;                       // ISO timestamp of client submission
  approvedAt?: string;                       // ISO timestamp of analyst approval
  approvedBy?: string;                       // Analyst UID/Name
  rejectedAt?: string;                       // ISO timestamp of rejection
  rejectedBy?: string;                       // Analyst UID/Name
  rejectionReason?: string;                  // Rejection / revision feedback
  createdAt: string;                         // ISO timestamp
  updatedAt: string;                         // ISO timestamp
}
```

#### Subcollection: `portfolios/{id}/versions`
Immutable version snapshots for complete audit history. No update or delete allowed.

```typescript
interface PortfolioVersionDocument {
  id: string;
  portfolioId: string;
  versionNumber: number;                     // Monotonically increasing (1, 2, 3...)
  status: 'pending' | 'active' | 'rejected';
  source: 'user_submitted' | 'admin_approved' | 'admin_correction' | 'rebalanced';
  previousVersionId?: string;               // Chain to prior version
  totalInvestmentMinor: number;
  stockCount: number;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  changeReason?: string;
  createdAt: string;
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
  updatedAt: string;                         // ISO timestamp
}
```

---

### 8. Collection: `research_content`
Stores institutional quantitative alpha signals, fundamental notes, and rebalance dispatches.

* **Document ID:** Auto-generated Firestore ID
* **Security Note:** Read access is entitlement-gated — requires active `feature_research_signals` entitlement. This is enforced both in Firestore Security Rules and at the application layer.
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
* **Security Note:** `messages` subcollection entries are immutable once created (no update/delete). Users can only access their own ticket's messages.

```typescript
interface SupportTicketDocument {
  id: string;                                // Auto-generated Firestore ID (e.g. "TCK-88219")
  userId: string;                            // Ref -> users.uid
  userEmail: string;
  userName: string;
  subject: string;                           // Ticket subject line
  category: 'BILLING' | 'PORTFOLIO' | 'TECHNICAL' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedAnalystId?: string;
  assignedAnalystName?: string;
  createdAt: string;                         // ISO timestamp
  updatedAt: string;                         // ISO timestamp
  resolvedAt?: string;                       // ISO timestamp
}

// Subcollection: support_tickets/{id}/messages
interface TicketMessageDocument {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'USER' | 'ADMIN';
  content: string;
  timestamp: string;
  attachments?: { filename: string; url: string }[];
}
```

---

### 10. Collection: `notifications`
In-app investor telemetry and action alerts.

* **Document ID:** Auto-generated Firestore ID
* **Client Pages:**
  * **Read:** [NotificationsPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/NotificationsPage.tsx), [TopNavBar.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/components/TopNavBar.tsx) (Badge counter)
  * **Write:** [NotificationsPage.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/NotificationsPage.tsx) (Mark as read only — `isRead`, `readAt` fields)
* **Security Note:** Users can only update `isRead` and `readAt` fields. Cannot modify `type`, `message`, or `userId`. Notifications are created and deleted only by admin/system.

```typescript
interface NotificationDocument {
  id: string;
  userId: string;                            // Ref -> users.uid
  title: string;                             // Short alert title
  message: string;                           // Detailed notification description
  type: 'INFO' | 'ALERT' | 'SUCCESS' | 'WARNING';
  link?: string;                             // Navigation route (e.g. "/portfolio")
  isRead: boolean;
  readAt?: string;                           // ISO timestamp of when user read it
  createdAt: string;                         // ISO timestamp
}
```

---

### 11. Collection: `auditLogs`
Immutable compliance and security audit logs for SEBI inspections and risk oversight.

* **Document ID:** Auto-generated Firestore ID
* **Admin Pages:**
  * **Read:** [AdminSettings.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminSettings.tsx), [AdminDashboard.tsx](file:///c:/Users/PARSH%20JAIN/OneDrive/Desktop/Arth%20Projects%20Company/ArthResearchApplication/src/pages/admin/AdminDashboard.tsx)
* **System Triggers:** Written automatically by `auditRepository.ts` on approvals, rejections, user revocations, and mandate updates.
* **Security Note:** Firestore rules enforce `allow update: if false; allow delete: if false;`. The "Clear Logs" UI button has been removed. The `clearAllLogs()` method has been permanently removed from `auditRepository.ts`.

```typescript
interface AuditLogDocument {
  id: string;
  // Who performed the action
  adminId: string;                           // Administrator or System UID
  adminEmail: string;
  // What was done
  action: string;                            // e.g. "PORTFOLIO_APPROVED", "USER_ACCESS_REVOKED"
  // What was affected
  entityType: 'user' | 'portfolio' | 'plan' | 'order' | 'subscription' | 'entitlement' | 'cms' | 'support_ticket' | 'system';
  entityId: string;                          // Target document ID
  // Optional context
  details?: Record<string, unknown>;         // Relevant metadata snapshot
  // Client forensics
  ipAddress?: string;                        // Client IP address
  userAgent?: string;                        // Browser User-Agent
  // Immutable server timestamp
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
[userPrivate] (stores phone, address — domain-segregated PII)
[userCompliance] (stores PAN, KYC status, risk profile)
       │
       ▼ (Browses Strategy Catalog on /plans)
[plans] (fetches active plans with basePriceMinor, taxMinor, gatewayFeeMinor)
       │
       ▼ (Purchases Strategy on /checkout via Razorpay)
[orders] (persists settled payment, HMAC signature, 3% gateway surcharge, generates Tax Invoice PDF)
[payments] (records Razorpay capture event and gateway signature)
       │
       ▼ (Dispatches Tax Invoice PDF Attachment & Activates Mandate)
[subscriptions] (creates active subscription with expiresAt = now + validityDays)
[entitlements] (synced via entitlementRepository.syncEntitlementsFromSubscription())
       │
       ▼ (Client Configures Initial Stocks on /setup-portfolio)
[portfolios] (created with status: 'pending', currentVersionId → versions/{v1})
[portfolios/{id}/holdings] (individual stock positions written atomically)
[portfolios/{id}/versions] (v1 snapshot written immutably)
       │
       ▼ (Analyst Reviews Execution Entries on /admin/approvals & /admin/review-portfolio)
       ├── Approved ──> [portfolios] (status: 'active', new versions/{v2} snapshot)
       │              ──> [entitlements] (synced with expiresAt from subscription)
       │              ──> [auditLogs] (APPROVE_PORTFOLIO entry — immutable)
       │              ──> Client /portfolio TERMINAL UNLOCKED
       │
       └── Revisions ─> [portfolios] (status: 'revision_requested')
                       ──> [auditLogs] (REJECT_PORTFOLIO entry — immutable)
                       ──> Client directed to /portfolio-rejected
```
