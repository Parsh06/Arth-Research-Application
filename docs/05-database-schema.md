# Database Schema (Firestore) & Data Flow Architecture

This document serves as the single source of truth for the Arth Research Application database schema, detailing exactly how data is structured, stored, and retrieved in Firebase Firestore.

## 1. Collection: `users`
Stores user profile information and authentication linkage.

*   **Document ID:** Firebase Auth UID (`user.uid`)
*   **Creation Trigger:** Created automatically during Google Login in `authStore.ts` if the UID doesn't exist.
*   **Retrieval:** Fetched by `authStore.ts` on initialization and `AdminUsers.tsx` for the admin panel.

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user'; // 'admin' grants access to /admin routes
  createdAt: string; // ISO String
}
```

## 2. Collection: `plans`
Stores the available subscription tiers (Wealth Multiplier Pro, Momentum Alpha, etc.).

*   **Document ID:** Auto-generated Firebase ID
*   **Creation Trigger:** Admin dashboard (future) or seeded via `dataStore.seedMockData()`
*   **Retrieval:** Fetched globally by `dataStore.fetchPlans()` and used in `PlansPage.tsx`.

```typescript
interface Plan {
  id: string; 
  name: string;
  description: string;
  price: number;
  validityDays: number; // e.g. 30 (Used to calculate portfolio expiration)
  features: string[];
  category: string; // 'equity', 'fno', 'hybrid'
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedCagr: number;
  minInvestment: number;
  stockLimit: number;
  isActive: boolean;
  isPopular: boolean;
}
```

## 3. Collection: `portfolios`
The core engine data. Stores the user's submitted stocks, their selected plan, and their approval/expiration status.

*   **Document ID:** Auto-generated Firebase ID
*   **Creation Trigger:** User submits from `InvestmentEntryPage.tsx`.
*   **Update Trigger:** Admin approves/rejects via `AdminApprovals.tsx` (modifies `status`, sets `expiresAt`). User renews plan (appends to existing document).
*   **Retrieval:** Fetched by `dataStore.fetchUserPortfolio(userId)` and strictly guarded in `PortfolioPage.tsx`.

```typescript
interface Portfolio {
  id: string;
  userId: string; // Ref to User UID
  userName: string;
  planId: string; // Ref to Plan ID
  status: 'pending' | 'active' | 'rejected'; // If !== 'active', UI locks out
  expiresAt?: number; // Milliseconds timestamp. If Date.now() > expiresAt, UI locks out
  stocks: { 
    symbol: string; 
    quantity: number; 
    avgPrice?: number; // Fetched from mock/real API eventually
    currentPrice?: number;
    type?: string;
  }[];
  createdAt: string; // ISO String
  updatedAt?: string; // Set during renewal
}
```

## 4. Collection: `settings` (Admin CMS)
Stores all dynamic textual content for the application to prevent hard-coding.

*   **Document ID:** Specific page names (e.g., `landingPage`, `welcomePage`, `plansPage`)
*   **Creation Trigger:** Seeded by `dataStore.fetchSiteContent()` if missing.
*   **Update Trigger:** Updated via `AdminCMS.tsx` when the admin modifies text.
*   **Retrieval:** Fetched globally on app load via `dataStore.fetchSiteContent()` and stored in Zustand `siteContent` state.

```typescript
// Document ID: 'landingPage'
interface LandingPageSettings {
  heroTitle: string;
  heroSubtitle: string;
  statsAum: string;
  statsWinRate: string;
  aboutTitle: string;
  aboutText: string;
}

// Document ID: 'welcomePage'
interface WelcomePageSettings {
  title: string;
  subtitle: string;
  buttonText: string;
}

// Document ID: 'plansPage'
interface PlansPageSettings {
  title: string;
  subtitle: string;
}
```

## Data Lifecycle & Expiration Flow
1.  **Submission:** User checks out -> directed to `/setup-portfolio` -> submits stocks -> document created in `portfolios` with `status: 'pending'`.
2.  **Approval:** Admin goes to `/admin/approvals` -> clicks Approve -> system fetches the Plan's `validityDays` -> updates the Portfolio with `status: 'active'` and calculates `expiresAt`.
3.  **Viewing:** User logs in -> `dataStore` fetches portfolio -> `PortfolioPage` checks if `status === 'active'` AND `Date.now() < expiresAt`. If yes, they see data. If no, they are locked out.
4.  **Renewal:** Expired user goes to `/plans`, checks out -> system directs to `/setup-portfolio` -> system detects existing portfolio -> user modifies stocks -> system updates the document (does not duplicate) and resets status to `pending`.
5.  **Admin Override:** Admin can click "Extend 30 Days" in the dashboard, which simply adds 30 days of milliseconds to `expiresAt` and sets `status` to `active`.
