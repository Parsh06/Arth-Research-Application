# Arth Research Application
# Production-Grade Architecture, Data, Security & Implementation Blueprint

> **Document purpose:** This document upgrades the existing Arth Research Application specification from a strong product/UI blueprint into a production-grade architecture for a financial/research platform. It defines how data is modeled, stored, accessed, validated, secured, audited, backed up, recovered, and exposed to users and administrators.
>
> **Source basis:** The current project uses React 19 + TypeScript + Vite + Tailwind CSS + Zustand + Firebase Authentication + Cloud Firestore, with user onboarding, subscriptions, portfolio ingestion, portfolio approval, research/content, support, notifications, CMS, and an admin terminal. The original specification describes normalized Firestore collections for users, plans, portfolios/holdings, subscriptions, settings, and audit logs, plus client repositories/stores and route-level guards. This document preserves that product scope while strengthening the persistence, authority, security, integrity, and operational architecture.

---

## 0. Executive Decision

The current Arth application is a good product foundation, but it should **not** be treated as production-ready merely because the UI, routes, repositories, and Firestore collections exist.

The production architecture should follow this principle:

```text
Browser / React UI
        |
        | Firebase Auth ID Token + App Check
        v
Backend/API / Domain Services
        |
        +--------------------+
        |                    |
        v                    v
   Firestore             Cloud Storage
 operational data       private documents
        |
        v
Domain events / Audit / Jobs
        |
        +---------------------+
        |                     |
        v                     v
 Reconciliation          Backup / DR
 / Integrity             / PITR
```

### Core rule

**The browser is never the authority for financial, entitlement, approval, role, KYC, audit, or security decisions.**

The browser may request an operation. The backend validates and performs it.

---

# 1. Existing Project Baseline

The existing Arth specification defines:

- A wealth-management / portfolio-tracking / quantitative-research platform.
- Subscription-based research strategies such as Wealth Multiplier Pro, Momentum Alpha, and Dividend Shield.
- Guided portfolio ingestion during onboarding.
- Real-time portfolio tracking and PnL.
- An enterprise admin terminal for portfolio approval, subscription management, CMS, support, and audit trails.
- React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Firebase Authentication, Cloud Firestore, Recharts, Framer Motion, Lucide React, and React Router.
- Client-side repositories and Zustand stores.
- Firestore collections for users, plans, portfolios/holdings, subscriptions, settings, and audit logs.
- Route protection and database-level access control.

The current specification explicitly identifies the platform as using Firestore with normalized collections and dedicated subcollections, including users, plans, portfolios, holdings, subscriptions, settings, and audit logs.

**Production upgrade required:** preserve the product scope while introducing a server-authoritative backend boundary, domain-specific data ownership, versioning, immutable history, restricted sensitive data, stronger authorization, reconciliation, backups, disaster recovery, and security testing.

---

# 2. Production Goals

The finished system should satisfy these principles:

## 2.1 Data integrity

No important business record should be silently overwritten or partially committed.

## 2.2 Data durability

Accidental deletion, deployment bugs, malformed writes, or operator mistakes must be recoverable.

## 2.3 Confidentiality

A user can access only their authorized information. Internal administrators can access only the data required by their role.

## 2.4 Least privilege

Every identity gets the minimum permission required.

## 2.5 Traceability

Every material financial, entitlement, compliance, research, CMS, or administrative mutation should be attributable.

## 2.6 Reproducibility

Historical portfolio, plan, calculation, and subscription results should be explainable later.

## 2.7 Recoverability

Backups must exist and restore drills must be tested.

## 2.8 Separation of concerns

Persistent data, derived calculations, UI state, business logic, external integrations, and audit evidence should not be mixed together.

---

# 3. Target Technology Architecture

## 3.1 Frontend

Keep:

- React 19
- TypeScript strict mode
- Vite
- Tailwind CSS v4
- Zustand
- React Router
- Recharts
- Framer Motion
- Lucide React

Add:

- runtime validation (for example Zod or equivalent)
- API client layer
- typed DTOs/view models
- secure error mapping
- feature/domain boundaries

## 3.2 Authentication

Use Firebase Authentication.

Responsibilities:

- identity
- session lifecycle
- provider authentication
- email verification
- MFA for privileged users
- account disable/revocation controls

## 3.3 Backend

Use a backend layer such as:

- Firebase Cloud Functions, and/or
- Cloud Run services

Use it for all sensitive business operations.

Backend responsibilities:

- authorization
- business rules
- financial operations
- payment verification
- portfolio approval
- subscription/entitlement decisions
- KYC/compliance operations
- research publishing
- CMS publishing
- audit generation
- notification jobs
- reconciliation
- data-integrity jobs
- export workflows

## 3.4 Firestore

Use Cloud Firestore as the operational document database, not as an unrestricted client-side database.

## 3.5 Cloud Storage

Use private Cloud Storage for:

- KYC documents
- support attachments
- user exports
- invoices/documents when required
- internal research attachments where appropriate

## 3.6 Secrets

Use Google Secret Manager for:

- payment provider secrets
- webhook secrets
- market data API keys
- email provider secrets
- KYC provider credentials
- signing keys
- other server-only secrets

Never ship secrets in the React bundle.

## 3.7 Observability

Use structured logs, metrics, alerts, tracing/correlation IDs, and Google Cloud/Firebase audit capabilities.

---

# 4. Environment Separation

Create completely separate environments.

```text
arth-dev
arth-staging
arth-production
```

Each environment should have its own:

- Firebase project
- Firestore database
- Auth configuration
- Storage bucket(s)
- service accounts / IAM
- Secret Manager entries
- payment environment
- market-data credentials
- monitoring configuration

Never use one production database for local development.

---

# 5. Data Classification

Every data domain must have an explicit classification.

| Classification | Examples | Default access |
|---|---|---|
| Public | landing page, active plan summaries, public research | public/read-only |
| Internal | operational metrics, internal non-sensitive configuration | authorized staff |
| Confidential | portfolios, subscriptions, support, payment metadata | user + authorized roles |
| Restricted | PAN, KYC documents, security data, secrets | explicitly authorized personnel/backend only |

For every collection define:

```text
Who can read?
Who can create?
Who can update?
Who can delete?
Who can export?
Who can view sensitive fields?
Is access audited?
```

---

# 6. Production Database Model

Recommended top-level domains:

```text
users/{uid}
userPrivate/{uid}
userSecurity/{uid}
userCompliance/{uid}

plans/{planId}
plans/{planId}/versions/{versionId}

orders/{orderId}
payments/{paymentId}
invoices/{invoiceId}
subscriptions/{subscriptionId}
entitlements/{entitlementId}

portfolios/{portfolioId}
portfolios/{portfolioId}/versions/{versionId}
portfolios/{portfolioId}/versions/{versionId}/holdings/{holdingId}
portfolios/{portfolioId}/events/{eventId}
portfolios/{portfolioId}/snapshots/{snapshotId}

instruments/{instrumentId}
latestPrices/{instrumentId}
marketSnapshots/{snapshotId}

watchlists/{watchlistId}
watchlists/{watchlistId}/items/{itemId}

research/{researchId}
research/{researchId}/versions/{versionId}

notifications/{notificationId}
notificationPreferences/{preferenceId}

supportTickets/{ticketId}
supportTickets/{ticketId}/messages/{messageId}

cms/{contentId}
cms/{contentId}/versions/{versionId}

adminRoles/{uid}
adminActions/{actionId}
auditLogs/{auditId}
securityEvents/{eventId}

systemJobs/{jobId}
systemConfigs/{configId}
integrityChecks/{checkId}
reconciliationRuns/{runId}
```

---

# 7. Source-of-Truth Policy

Every important field must have exactly one authoritative owner.

| Data | Source of truth |
|---|---|
| Authentication identity | Firebase Auth |
| Basic profile | `users/{uid}` |
| Private contact data | `userPrivate/{uid}` |
| Compliance/KYC status | `userCompliance/{uid}` |
| Plan definition | `plans/{planId}` + immutable version |
| Payment state | `payments/{paymentId}` |
| Order state | `orders/{orderId}` |
| Subscription state | `subscriptions/{subscriptionId}` |
| Entitlement | `entitlements/{entitlementId}` |
| Portfolio identity/current version | `portfolios/{portfolioId}` |
| Portfolio history | portfolio versions/events |
| Holding facts | portfolio-version holdings |
| Instrument identity | `instruments/{instrumentId}` |
| Market price | market-data domain |
| PnL / valuation | valuation service + snapshots |
| User notification | `notifications/{notificationId}` |
| Admin history | immutable audit/application events |
| Infrastructure history | cloud audit logs |
| Published content | versioned research/CMS documents |

Do not have two domains both acting as authoritative sources for the same business fact.

---

# 8. User Data Model

## 8.1 `users/{uid}`

This should contain normal profile information only.

```json
{
  "uid": "firebase-auth-uid",
  "displayName": "User Name",
  "email": "user@example.com",
  "photoUrl": "...",
  "status": "active",
  "profileVersion": 1,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "lastLoginAt": "Timestamp"
}
```

Do not place PAN, KYC documents, bank credentials, secrets, or other highly restricted data here.

## 8.2 `userPrivate/{uid}`

```json
{
  "phone": "...",
  "address": {
    "line1": "...",
    "city": "...",
    "state": "...",
    "postalCode": "..."
  },
  "dateOfBirth": "...",
  "communicationPreferences": {
    "email": true,
    "sms": false
  },
  "updatedAt": "Timestamp"
}
```

## 8.3 `userCompliance/{uid}`

```json
{
  "kycStatus": "verified",
  "panLast4": "1234",
  "panToken": "...",
  "verificationProvider": "...",
  "verifiedAt": "Timestamp",
  "verifiedBy": "system",
  "riskProfile": "medium",
  "investmentExperience": "1_3_years",
  "updatedAt": "Timestamp"
}
```

Prefer tokenized/protected PAN representation over raw PAN in ordinary application data.

---

# 9. Firebase Authentication Model

Firebase Auth should be the source of identity.

Use the Firestore user record for application profile metadata but do not duplicate authentication authority into the database.

Required controls:

- email verification where applicable
- MFA for admins/privileged staff
- individual staff accounts
- no shared admin identities
- account suspension/revocation
- reauthentication for critical actions
- session revocation capability

The client-side `isAdmin` state is a UI convenience only. It is never a security authority.

---

# 10. RBAC + Permissions

Roles:

```text
user
admin
super_admin
support
finance
research_admin
```

But role alone is not enough.

Define permissions such as:

```text
USER_READ_SELF
USER_UPDATE_SELF

PORTFOLIO_READ_SELF
PORTFOLIO_CREATE
PORTFOLIO_SUBMIT
PORTFOLIO_REVIEW
PORTFOLIO_APPROVE
PORTFOLIO_REJECT
PORTFOLIO_EDIT

SUBSCRIPTION_VIEW
SUBSCRIPTION_EXTEND

PAYMENT_VIEW
REFUND_APPROVE

KYC_VIEW
KYC_VERIFY

SUPPORT_READ
SUPPORT_REPLY

CMS_EDIT
CMS_PUBLISH

RESEARCH_EDIT
RESEARCH_PUBLISH

ADMIN_ROLE_MANAGE
AUDIT_READ
SECURITY_EVENT_READ
DATA_EXPORT
```

Recommended high-level permission mapping:

| Role | Main access |
|---|---|
| user | own profile, own portfolio/subscription/watchlist/support |
| support | support + limited identity information |
| finance | payments, orders, subscriptions, financial reconciliation |
| research_admin | portfolios/research functions |
| admin | operational administration according to policy |
| super_admin | privileged administration + security/governance |

Sensitive permissions should be individually reviewed.

---

# 11. Firestore Authorization Model

Use a deny-by-default policy.

Conceptual model:

```text
Anonymous -> deny sensitive access
User -> own data only
Staff -> explicit role/permission access
Backend -> IAM-authorized privileged operations
```

Never use rules equivalent to:

```text
allow read, write: if true;
```

or broadly:

```text
allow read, write: if request.auth != null;
```

for sensitive collections.

Client security rules should protect all browser-accessible data. Server-side Firestore access must also be secured through Google Cloud IAM because privileged server SDK access does not rely on Firestore Security Rules in the same way client access does.

---

# 12. Backend Authorization Flow

Every sensitive endpoint follows:

```text
Request
  |
  v
Verify Firebase identity
  |
  v
Verify App Check where applicable
  |
  v
Resolve role / permissions
  |
  v
Validate request schema
  |
  v
Validate business state
  |
  v
Perform authorized domain operation
  |
  v
Write authoritative record
  |
  v
Write audit/event record
  |
  v
Queue notification/job if required
  |
  v
Return sanitized DTO
```

---

# 13. Financial Data Representation

## 13.1 Never use floating point for authoritative money values

Use integer minor units.

```json
{
  "amountMinor": 125050,
  "currency": "INR"
}
```

meaning INR 1,250.50 when using two decimal places.

Apply consistently to:

```text
priceMinor
buyPriceMinor
investedAmountMinor
currentValueMinor
pnlMinor
feeMinor
taxMinor
discountMinor
totalMinor
refundMinor
```

## 13.2 Quantities

Define quantity precision per instrument.

For ordinary integer-share equities:

```json
{
  "quantity": 100,
  "quantityScale": 0
}
```

For fractional-quantity instruments where applicable, define an explicit scale rather than using arbitrary frontend floats.

---

# 14. Timestamp Rules

Use server-side Firestore timestamp values.

Recommended fields:

```text
createdAt
updatedAt
submittedAt
reviewStartedAt
approvedAt
rejectedAt
startsAt
expiresAt
purchaseAt
paidAt
cancelledAt
publishedAt
readAt
```

Do not use the browser's `Date.now()` as the authoritative source for subscription expiry, approval time, payment success, or audit ordering.

---

# 15. Plan Model and Versioning

## 15.1 `plans/{planId}`

```json
{
  "planId": "wealth-multiplier-pro",
  "name": "Wealth Multiplier Pro",
  "status": "active",
  "currentVersionId": "version-3",
  "category": "equity",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 15.2 `plans/{planId}/versions/{versionId}`

```json
{
  "versionNumber": 3,
  "name": "Wealth Multiplier Pro",
  "description": "...",
  "priceMinor": 129900,
  "currency": "INR",
  "taxPolicy": "GST_STANDARD",
  "validityDays": 90,
  "riskLevel": "medium",
  "minInvestmentMinor": 5000000,
  "stockLimit": 12,
  "features": ["..."],
  "recommendedInstrumentIds": ["..."],
  "publishedAt": "Timestamp",
  "createdAt": "Timestamp"
}
```

Old subscriptions should point to the version they purchased.

Changing a plan does not rewrite old commercial history.

---

# 16. Instrument Master

Users should not be able to create arbitrary canonical instruments by typing company names.

## `instruments/{instrumentId}`

```json
{
  "symbol": "HDFCBANK",
  "exchange": "NSE",
  "isin": "...",
  "companyName": "HDFC Bank Limited",
  "instrumentType": "EQUITY",
  "currency": "INR",
  "lotSize": 1,
  "priceScale": 2,
  "quantityScale": 0,
  "isActive": true,
  "updatedAt": "Timestamp"
}
```

Portfolio holdings should reference `instrumentId`.

Search flow:

```text
User types HDFC
   |
   v
Instrument search service
   |
   v
Canonical instrument
   |
   v
Store instrumentId + snapshot metadata if required
```

---

# 17. Portfolio Architecture

The current portfolio/holding model should become versioned.

## 17.1 `portfolios/{portfolioId}`

```json
{
  "portfolioId": "pf_123",
  "userId": "uid_123",
  "planId": "plan_123",
  "currentVersionId": "v_004",
  "status": "active",
  "currency": "INR",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 17.2 `portfolios/{portfolioId}/versions/{versionId}`

```json
{
  "versionNumber": 4,
  "status": "active",
  "source": "admin_approved",
  "previousVersionId": "v_003",
  "submittedAt": "Timestamp",
  "approvedAt": "Timestamp",
  "approvedBy": "adminUid",
  "changeReason": "REBALANCE",
  "totalInvestmentMinor": 12500000,
  "holdingCount": 8,
  "calculationVersion": 3,
  "createdAt": "Timestamp"
}
```

## 17.3 Portfolio-version holdings

```text
portfolios/{portfolioId}/versions/{versionId}/holdings/{holdingId}
```

```json
{
  "instrumentId": "nse_eq_HDFCBANK",
  "symbol": "HDFCBANK",
  "exchange": "NSE",
  "quantity": 100,
  "quantityScale": 0,
  "averageBuyPriceMinor": 185025,
  "investedAmountMinor": 18502500,
  "currency": "INR",
  "source": "USER_SUBMITTED",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

---

# 18. Never Silently Overwrite Financial History

Bad:

```text
buyPrice = 500
     |
     v
buyPrice = 525
```

Good:

```text
Version 1 -> buyPrice = 500
Version 2 -> buyPrice = 525
            reason = ADMIN_CORRECTION
            changedBy = adminUid
            previousVersion = v1
```

All material changes should preserve historical evidence.

---

# 19. Portfolio State Machine

Use explicit legal transitions.

```text
DRAFT
  |
  v
PENDING_REVIEW
  |
  v
IN_REVIEW
  |        \
  |         -> REJECTED
  v
APPROVED
  |
  v
ACTIVE
  |
  v
EXPIRED
```

Rejected portfolios can enter an explicit resubmission flow.

The backend rejects illegal transitions.

For example:

```text
EXPIRED -> ACTIVE
```

should not happen simply because a client writes `status = active`.

---

# 20. Atomic Portfolio Submission

Do not use a multi-step client sequence such as:

```text
create portfolio
write holding 1
write holding 2
write holding 3
redirect user
```

without transactional protection.

Correct model:

```text
Submit Portfolio Request
        |
        v
Validate all holdings
        |
        v
Validate plan constraints
        |
        v
Create portfolio version
        |
        v
Create holdings
        |
        v
Create submission event
        |
        v
Set PENDING_REVIEW
        |
        v
Commit
```

Only after successful commit should the API report submission success.

Use Firestore transactions/batched writes where appropriate, and use backend workflows for operations that span asynchronous jobs.

---

# 21. Derived vs Authoritative Portfolio Data

### Authoritative

```text
quantity
averageBuyPriceMinor
instrumentId
portfolio version
approval status
subscription dates
```

### Derived

```text
currentPrice
currentValue
PnL
PnL percentage
allocation
win rate
portfolio value
AUM
```

Derived values should be recalculable from authoritative records plus market data.

---

# 22. Central Valuation Service

Build one canonical valuation service.

```text
calculateHoldingValue()
calculateHoldingPnL()
calculatePortfolioValue()
calculatePortfolioPnL()
calculateAllocation()
calculatePerformance()
```

The frontend should not be the authoritative calculation engine.

Store a `calculationVersion` on persisted snapshots/reports.

---

# 23. Portfolio Snapshots

Store periodic valuation snapshots.

```text
portfolios/{portfolioId}/snapshots/{snapshotId}
```

Example:

```json
{
  "date": "2026-09-11",
  "investedAmountMinor": 12500000,
  "marketValueMinor": 13842000,
  "pnlMinor": 1342000,
  "pnlPercentBps": 1074,
  "cashMinor": 0,
  "calculationVersion": 3,
  "createdAt": "Timestamp"
}
```

These snapshots support:

- dashboard history
- charts
- performance reports
- reconciliation
- reproducibility
- recovery

---

# 24. Subscription Architecture

## `subscriptions/{subscriptionId}`

```json
{
  "subscriptionId": "sub_123",
  "userId": "uid_123",
  "planId": "plan_123",
  "planVersionId": "version_3",
  "status": "active",
  "currency": "INR",
  "priceMinor": 99900,
  "taxMinor": 17982,
  "discountMinor": 0,
  "totalMinor": 117882,
  "orderId": "ord_123",
  "paymentId": "pay_123",
  "startsAt": "Timestamp",
  "expiresAt": "Timestamp",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

---

# 25. Entitlements

Do not scatter `subscriptionStatus === ACTIVE` logic throughout the entire app.

Create an entitlement concept.

```json
{
  "entitlementId": "ent_123",
  "userId": "uid_123",
  "planId": "plan_123",
  "entitlements": [
    "PORTFOLIO_ACCESS",
    "RESEARCH_ACCESS",
    "WATCHLIST_PREMIUM",
    "REBALANCING_ALERTS"
  ],
  "startsAt": "Timestamp",
  "expiresAt": "Timestamp",
  "status": "active",
  "createdAt": "Timestamp"
}
```

This allows plans and product features to evolve without hardcoding business logic into every UI page.

---

# 26. Payment and Checkout Architecture

The checkout page must not be the authority for payment success.

Correct flow:

```text
User selects plan
      |
      v
Backend creates order
      |
      v
Payment provider
      |
      v
Provider callback/webhook
      |
      v
Backend verifies provider signature/event
      |
      v
Payment marked SUCCESS
      |
      v
Subscription created/activated
      |
      v
Entitlement created/updated
      |
      v
Receipt / invoice workflow
      |
      v
Notification
```

A frontend redirect to a success page is only a UI event.

---

# 27. Payment Idempotency

Every payment workflow should support:

```text
providerOrderId
providerPaymentId
webhookEventId
idempotencyKey
```

The backend must prevent duplicate processing.

Example:

```text
same webhook arrives twice
        |
        v
check webhookEventId
        |
        +--> already processed -> return existing result
        |
        +--> not processed -> process once
```

Apply the same concept to:

- portfolio submission
- portfolio approval
- subscription extension
- notifications
- refunds
- invoice generation

---

# 28. Subscription State Machine

```text
CREATED
   |
   v
PAYMENT_PENDING
   |
   +----> FAILED
   |
   v
ACTIVE
   |
   v
EXPIRING
   |
   v
EXPIRED
```

Cancellation/refund states should be modeled explicitly as required by the business.

---

# 29. Subscription Extension

Never directly run:

```text
expiresAt = expiresAt + 30 days
```

from a browser.

Instead create an extension event/operation containing:

```json
{
  "extensionDays": 30,
  "previousExpiry": "Timestamp",
  "newExpiry": "Timestamp",
  "requestedBy": "adminUid",
  "approvedBy": "adminUid",
  "reason": "Customer support accommodation",
  "createdAt": "Timestamp"
}
```

The backend defines whether extension is applied from the existing expiry or current time according to an explicit business policy.

---

# 30. Notifications

Create persistent notification records.

## `notifications/{notificationId}`

```json
{
  "userId": "uid_123",
  "type": "PORTFOLIO_APPROVED",
  "title": "Portfolio approved",
  "body": "Your portfolio is now active.",
  "entityType": "portfolio",
  "entityId": "pf_123",
  "readAt": null,
  "createdAt": "Timestamp"
}
```

Email/SMS/push is a delivery channel, not the source of notification history.

---

# 31. Notification Outbox Pattern

For important actions:

```text
Portfolio approval transaction
        |
        +--> portfolio status
        +--> audit event
        +--> notification/outbox event
                      |
                      v
                background worker
                      |
             +--------+--------+
             |                 |
          email              push
```

Track:

```text
deliveryStatus
attemptCount
lastAttemptAt
providerMessageId
failureReason
nextRetryAt
```

Do not silently drop failed notifications.

---

# 32. Research Content Model

Research is a core business asset and should be versioned.

```text
research/{researchId}
research/{researchId}/versions/{versionId}
```

Workflow:

```text
DRAFT
  |
  v
REVIEW
  |
  v
PUBLISHED
  |
  v
CORRECTED / ARCHIVED
```

Published research should never be silently overwritten.

Store:

```text
author
reviewer
publishedBy
publishedAt
versionNumber
previousVersionId
audience / plan targeting
content hash where useful
changeReason
```

---

# 33. CMS Model

Current dynamic settings should become versioned content.

```text
cms/{contentId}
cms/{contentId}/versions/{versionId}
```

Workflow:

```text
DRAFT -> REVIEW -> PUBLISHED
```

A bad content update must be reversible by selecting the prior published version.

Use server-side schemas for CMS content.

Do not store arbitrary unknown JSON from the browser.

---

# 34. Watchlist Model

```text
watchlists/{watchlistId}
watchlists/{watchlistId}/items/{itemId}
```

Example:

```json
{
  "instrumentId": "nse_eq_RELIANCE",
  "source": "USER",
  "status": "ACTIVE",
  "notes": "...",
  "addedAt": "Timestamp"
}
```

---

# 35. Support Model

```text
supportTickets/{ticketId}
supportTickets/{ticketId}/messages/{messageId}
```

Ticket example:

```json
{
  "ticketId": "t_123",
  "userId": "uid_123",
  "status": "OPEN",
  "priority": "HIGH",
  "category": "PAYMENT",
  "assignedTo": "staffUid",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

Message example:

```json
{
  "senderType": "USER",
  "senderId": "uid_123",
  "message": "...",
  "attachmentIds": [],
  "createdAt": "Timestamp"
}
```

---

# 36. KYC and Sensitive Files

Use private Cloud Storage.

Recommended logical paths:

```text
/private/users/{uid}/kyc/{documentId}
/private/users/{uid}/support/{ticketId}/{attachmentId}
/private/users/{uid}/exports/{exportId}
```

Files must be:

- private
- access-controlled
- associated with owner UID
- stored under random/non-sensitive object identifiers
- size-limited
- MIME/type validated
- malware-scanned where required
- logged when accessed

Do not create permanently public KYC URLs.

---

# 37. Data Access Pattern: User

```text
React
  |
  v
Firebase Auth
  |
  v
Authorized API / limited Firestore query
  |
  v
Domain service
  |
  v
Authorized data
  |
  v
User DTO/view model
  |
  v
React
```

Only return the fields required for the current screen.

---

# 38. Data Access Pattern: Admin

```text
Admin UI
   |
   v
Firebase Auth + MFA
   |
   v
Role/permission check
   |
   v
Backend admin endpoint
   |
   v
Domain authorization
   |
   v
Field projection
   |
   v
Audit sensitive access if required
   |
   v
Sanitized admin view model
```

Do not fetch every sensitive user field simply because the admin can theoretically access it.

---

# 39. Admin Field Projection

Admin user listing should contain only operational summary fields:

```json
{
  "uid": "...",
  "displayName": "...",
  "email": "...",
  "status": "active",
  "subscriptionStatus": "active",
  "portfolioStatus": "active",
  "createdAt": "Timestamp"
}
```

Sensitive details should be loaded only in the appropriate detail view after authorization.

Mask sensitive values by default:

```text
PAN: XXXXX1234
Phone: ******7812
```

Full access, where policy allows it, should be a separately authorized and audited operation.

---

# 40. Admin Terminal Architecture

Recommended:

```text
ADMIN
├── Overview
├── Users
│   ├── Directory
│   ├── User Detail
│   ├── Security
│   └── Compliance
├── Portfolios
│   ├── Pending Review
│   ├── Active
│   ├── Rejected
│   ├── Versions
│   └── Exceptions
├── Subscriptions
│   ├── Active
│   ├── Expiring
│   ├── Expired
│   └── Overrides
├── Payments
│   ├── Orders
│   ├── Payments
│   ├── Refunds
│   └── Reconciliation
├── Research
│   ├── Drafts
│   ├── Review
│   ├── Published
│   └── Versions
├── Support
├── CMS
├── Audit
│   ├── Application Audit
│   ├── Security Events
│   └── Admin Actions
└── System
    ├── Health
    ├── Jobs
    ├── Integrity
    ├── Backups
    └── Configuration
```

---

# 41. Admin Actions Must Be Backend Operations

Examples:

```text
approvePortfolio()
rejectPortfolio()
editPortfolio()
extendSubscription()
changeUserRole()
approveKyc()
refundPayment()
publishResearch()
publishCms()
exportUserData()
```

The admin UI should call these operations.

It should not directly perform privileged `updateDoc()` writes from arbitrary components.

---

# 42. Maker-Checker for High-Risk Operations

For sensitive actions consider requiring two people:

```text
Admin A requests change
       |
       v
System records request
       |
       v
Admin B / Super Admin approves
       |
       v
Backend performs operation
```

Useful for:

- admin role changes
- financial corrections
- refunds
- large entitlement overrides
- KYC overrides
- sensitive data exports
- destructive operations

---

# 43. Audit Architecture

Do not treat audit logs as ordinary application data.

## 43.1 Application Audit

`auditLogs/{auditId}`

Example:

```json
{
  "eventId": "evt_123",
  "eventType": "PORTFOLIO_APPROVED",
  "actor": {
    "uid": "adminUid",
    "role": "research_admin"
  },
  "target": {
    "type": "portfolio",
    "id": "pf_123"
  },
  "requestId": "req_123",
  "before": {
    "status": "PENDING_REVIEW"
  },
  "after": {
    "status": "ACTIVE"
  },
  "reason": "Research review completed",
  "createdAt": "Timestamp"
}
```

Audit records should be immutable from the application.

## 43.2 Infrastructure Audit

Use Google Cloud audit capabilities for administrative and infrastructure activity.

Together:

```text
Application audit
+
Cloud/infrastructure audit
```

provides far better traceability.

---

# 44. Sensitive Read Auditing

For particularly sensitive data, audit reads as well as writes:

```text
ADMIN_VIEW_FULL_PAN
ADMIN_VIEW_KYC_DOCUMENT
ADMIN_EXPORT_USER_DATA
ADMIN_VIEW_PAYMENT_DETAILS
```

Each should have:

```text
actor
reason
target
requestId
timestamp
```

---

# 45. Immutable History

Financially meaningful records should not be casually deleted.

Prefer:

```text
active
archived
superseded
cancelled
```

over destructive deletion.

Audit records should not have a normal admin delete button.

If legal deletion requirements apply, handle them through a governed retention/deletion workflow rather than ordinary CRUD.

---

# 46. Event/History Model

Important domains should produce events:

```text
portfolio.submitted
portfolio.review_started
portfolio.approved
portfolio.rejected
portfolio.version_created

subscription.created
subscription.activated
subscription.extended
subscription.expired
subscription.cancelled

payment.created
payment.success
payment.failed
payment.refunded

kyc.submitted
kyc.verified
kyc.rejected

research.published
research.corrected

cms.published
cms.rolled_back
```

This turns history into a first-class capability instead of reconstructing it from unrelated documents.

---

# 47. Data Integrity Checks

Create automated integrity jobs.

Checks should include:

```text
ACTIVE subscription with expired expiry
ACTIVE portfolio with no valid entitlement
holding referencing missing instrument
holding referencing missing portfolio version
payment SUCCESS with no valid order
order SUCCESS with no payment
subscription without corresponding payment (when required)
portfolio total != sum of holding investments
stockCount != actual holding count
allocation totals outside configured tolerance
missing current portfolio version
broken previousVersionId reference
orphaned storage objects
orphaned notifications
```

Create:

```text
integrityChecks/{checkId}
```

with:

```text
runId
checkType
status
severity
entityType
entityId
expected
actual
createdAt
resolvedAt
resolvedBy
resolutionReason
```

---

# 48. Financial Reconciliation

Daily or policy-defined reconciliation should validate:

```text
Payments
   |
   v
Orders
   |
   v
Subscriptions
   |
   v
Entitlements
```

and:

```text
Portfolio facts
   |
   v
Valuation engine
   |
   v
Daily snapshots
   |
   v
Dashboard aggregates
```

Any discrepancy should become an exception rather than being silently corrected.

---

# 49. Backups and Disaster Recovery

Minimum production setup:

```text
Primary Firestore
      |
      +--> Point-in-time recovery
      |
      +--> Scheduled backups
      |
      +--> Independent/off-environment backup copy
      |
      +--> Restore testing
```

PITR is useful for rapid rollback from accidental writes/deletes. Scheduled backups provide longer retention. These mechanisms are complementary, not interchangeable.

---

# 50. Restore Drills

A backup is not considered operationally reliable until a restore has been tested.

Recovery drill:

```text
Restore backup to isolated environment
        |
        v
Validate document counts
        |
        v
Validate user references
        |
        v
Validate subscription/payment mappings
        |
        v
Validate portfolio totals
        |
        v
Validate snapshots
        |
        v
Validate security/access configuration
        |
        v
Record recovery result
```

Define target RPO/RTO with the business.

---

# 51. Security Controls

The production security stack should include:

```text
TLS / HTTPS
+
Firebase Authentication
+
MFA for privileged accounts
+
App Check where appropriate
+
Firestore Security Rules
+
Backend authorization
+
Schema validation
+
Business-state validation
+
IAM
+
Secret Manager
+
Rate limiting
+
Security headers
+
Structured logging
+
Security alerts
+
Audit logs
+
Backups / PITR
+
Security testing
```

No one control should be treated as sufficient by itself.

---

# 52. Secrets Management

Never put server secrets in:

```text
React source
Vite environment variables that ship to browser
localStorage
Zustand persisted storage
Firestore
public files
client code
```

Store secrets in Secret Manager and restrict service account access using least privilege.

---

# 53. Security Headers

Production web delivery should include appropriate headers such as:

```text
Strict-Transport-Security
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
frame-ancestors / frame protection
```

Review the policy against actual third-party scripts/services before enforcing a restrictive CSP.

---

# 54. Rate Limiting and Abuse Prevention

Protect:

```text
login
MFA/OTP attempts
profile operations
portfolio submission
checkout
coupon validation
support submission
admin search
exports
public APIs
market-data proxy endpoints
webhooks
```

against:

```text
brute force
spam
enumeration
scraping
replay
resource exhaustion
```

App Check does not replace rate limiting.

---

# 55. Input Validation

Use runtime schemas on every externally supplied request.

Examples:

```text
CreatePortfolioSchema
SubmitPortfolioSchema
ApprovePortfolioSchema
RejectPortfolioSchema
ExtendSubscriptionSchema
CreateOrderSchema
SupportMessageSchema
CmsUpdateSchema
ResearchPublishSchema
RoleChangeSchema
```

Flow:

```text
Request
 -> schema validation
 -> authentication
 -> authorization
 -> business validation
 -> operation
```

Frontend validation is UX; backend validation is security and correctness.

---

# 56. File Upload Security

For uploads enforce:

- maximum size
- allowed MIME types
- extension allow-list
- content validation
- randomized object names
- malware scanning where required
- private bucket/object access
- ownership metadata
- creation timestamp
- access audit for restricted files

Never trust a filename or extension alone.

---

# 57. Export Security

Never let admins download unrestricted raw database dumps through the browser.

Recommended workflow:

```text
Admin requests export
        |
        v
Authorization
        |
        v
Reason required
        |
        v
Backend export job
        |
        v
Sanitize / select fields
        |
        v
Generate protected file
        |
        v
Short-lived controlled access
        |
        v
Audit event
```

Track:

```text
requestedBy
reason
scope
createdAt
completedAt
result
```

---

# 58. Consent Model

Do not store only:

```text
acceptedTerms = true
```

Instead store:

```json
{
  "userId": "uid_123",
  "documentType": "TERMS_OF_SERVICE",
  "documentVersion": "2026-09-01",
  "acceptedAt": "Timestamp",
  "consentTextHash": "...",
  "source": "WEB_CHECKOUT"
}
```

Apply similarly where required to privacy disclosures, research disclosures, and risk-related acknowledgements.

---

# 59. Data Retention

Create a formal retention matrix.

| Domain | Retention rule | Deletion strategy |
|---|---|---|
| Basic profile | policy-defined | delete/anonymize |
| Compliance/KYC | compliance-defined | restricted deletion/archive |
| Payments | finance/legal-defined | archive |
| Portfolio history | long-term business policy | preserve/version |
| Audit | long-term policy | immutable/controlled retention |
| Security logs | defined security policy | controlled retention |
| Support | defined support policy | archive/delete |
| Exports | short-lived where possible | automatic expiry |

Legal/regulatory retention periods must be confirmed by the organization's legal/compliance function and encoded as policy, not guessed by developers.

---

# 60. Account Deletion Workflow

Do not simply delete `users/{uid}`.

Workflow:

```text
Deletion request
      |
      v
Verify identity
      |
      v
Evaluate retention requirements
      |
      v
Delete/anonymize eligible data
      |
      v
Preserve legally required records
      |
      v
Remove eligible storage objects
      |
      v
Revoke active sessions/access
      |
      v
Create audit event
```

Remember that deleting a Firestore parent document does not automatically delete all child subcollections.

---

# 61. Correlation IDs

Every request should have a unique request ID.

Example:

```text
req_01J...
```

Use the same ID, where appropriate, in:

- frontend error context
- backend logs
- audit events
- payment operations
- notification jobs
- reconciliation exceptions

This makes incidents traceable.

---

# 62. Logging Policy

Logs must be structured and searchable.

Never log:

```text
passwords
raw access tokens
refresh tokens
payment secrets
raw PAN
private KYC URLs
other secrets
```

Use identifiers and masked values instead.

---

# 63. Error Handling

Users should receive safe errors such as:

```text
Something went wrong.
Reference: req_123
```

Detailed infrastructure/error stack traces remain server-side.

Never expose:

- secret values
- database paths unnecessarily
- authorization internals
- token values
- stack traces

---

# 64. UI State vs Persistent Data

Zustand is application state, not the database.

Use:

```text
Zustand
-> loading state
-> UI preferences
-> ephemeral selections
-> cached safe view models
```

Use Firestore/backend for:

```text
user records
portfolio records
subscriptions
payments
notifications
support
research
CMS
history
```

The system must be able to reconstruct the app state after the browser is cleared.

---

# 65. View Models / DTOs

Never return raw database documents blindly to React.

Use:

```text
Firestore domain model
       |
       v
Backend domain/service layer
       |
       v
DTO / view model
       |
       v
React
```

This prevents accidental exposure of internal fields.

Example user response:

```json
{
  "uid": "...",
  "displayName": "...",
  "subscriptionStatus": "active",
  "portfolioStatus": "active"
}
```

not the entire private/compliance/admin document.

---

# 66. Pagination and Query Design

Admin screens must be paginated.

Default:

```text
25 / 50 / 100 records per page
```

Use cursor pagination rather than loading huge collections.

Recommended indexes include examples such as:

```text
subscriptions: userId + status + expiresAt
portfolios: status + submittedAt
auditLogs: targetType + targetId + createdAt
auditLogs: actorId + createdAt
supportTickets: status + priority + updatedAt
```

Tune indexes based on actual query patterns.

---

# 67. Realtime Usage Policy

Use realtime listeners only where realtime adds material value.

Good candidates:

- portfolio review status
- support conversation updates
- critical notifications
- active operational state

Normal queries are preferable for:

- long-term history
- audits
- old reports
- large admin lists
- static content

This controls both cost and complexity.

---

# 68. Concurrency Protection

Suppose two admins approve the same portfolio simultaneously.

The backend should guarantee:

```text
one legal state transition
one entitlement effect
one effective audit event
```

Use:

- Firestore transactions
- state checks
- idempotency keys
- optimistic version fields where useful

For editable records:

```json
{
  "version": 7
}
```

If the client submits an old version, reject it with a conflict instead of silently overwriting newer data.

---

# 69. Admin Sensitive Actions

Require a reason for:

```text
portfolio approval/rejection
financial correction
subscription extension
role change
KYC override
refund
user-data export
full sensitive-data view
delete/archive override
```

Record both before and after state wherever safe and useful.

---

# 70. Production Repository Architecture

The current repository layer should expand into domain-based modules.

```text
src/
├── domain/
│   ├── auth/
│   ├── users/
│   ├── compliance/
│   ├── plans/
│   ├── subscriptions/
│   ├── payments/
│   ├── entitlements/
│   ├── portfolios/
│   ├── holdings/
│   ├── instruments/
│   ├── valuation/
│   ├── research/
│   ├── watchlists/
│   ├── notifications/
│   ├── support/
│   ├── cms/
│   ├── audit/
│   └── security/
│
├── repositories/
├── services/
├── api/
├── schemas/
├── stores/
├── components/
├── pages/
└── utils/
```

This makes it clear where each business rule belongs.

---

# 71. Backend Modules

Recommended backend structure:

```text
backend/
├── auth/
├── authorization/
├── users/
├── compliance/
├── plans/
├── planVersions/
├── orders/
├── payments/
├── subscriptions/
├── entitlements/
├── portfolios/
├── portfolioVersions/
├── holdings/
├── instruments/
├── valuation/
├── marketData/
├── research/
├── notifications/
├── support/
├── cms/
├── audit/
├── security/
├── exports/
├── reconciliation/
├── integrity/
├── jobs/
└── monitoring/
```

---

# 72. API Contract Examples

Recommended commands/endpoints include:

```text
POST /api/portfolio/submit
POST /api/portfolio/review
POST /api/portfolio/approve
POST /api/portfolio/reject

POST /api/orders/create
POST /api/payments/create
POST /api/payments/webhook

POST /api/subscriptions/extend

POST /api/admin/users/{uid}/role
POST /api/admin/users/{uid}/export
POST /api/admin/users/{uid}/sensitive-access

POST /api/research/publish
POST /api/cms/publish

POST /api/support/tickets
POST /api/support/tickets/{ticketId}/messages
```

Use typed request/response contracts.

---

# 73. Production Read APIs

Examples:

```text
GET /api/me
GET /api/me/subscriptions
GET /api/me/portfolio
GET /api/me/portfolio/history
GET /api/me/notifications
GET /api/me/watchlists
GET /api/me/support-tickets

GET /api/admin/users
GET /api/admin/users/{uid}
GET /api/admin/portfolios/pending
GET /api/admin/portfolios/{portfolioId}
GET /api/admin/subscriptions
GET /api/admin/payments
GET /api/admin/audit
```

Read responses should be intentionally scoped.

---

# 74. Production Testing Strategy

## 74.1 Unit tests

Test:

- money calculations
- PnL calculations
- allocation
- status transitions
- expiry logic
- permission logic
- validation schemas
- data transformations

## 74.2 Integration tests

Test:

- Auth -> backend -> Firestore
- payment -> subscription -> entitlement
- portfolio submit -> approval
- research publish -> audience visibility
- notification outbox -> delivery

## 74.3 Security tests

Attempt:

```text
anonymous read
anonymous write
user A -> user B
user -> admin document
user -> role change
user -> subscription modification
user -> expiry modification
user -> audit write
support -> KYC read
finance -> research administration
```

## 74.4 Concurrency tests

Test:

- duplicate approval
- duplicate submission
- duplicate webhook
- simultaneous admin edit
- simultaneous subscription extension

## 74.5 Recovery tests

Test:

- accidental delete
- bad deployment
- malformed migration
- restore from backup
- orphan detection

---

# 75. Firestore Rules Testing

Use the Firebase Emulator Suite and automated rule tests.

Examples:

```text
User A reads User B private document -> DENY
User A writes User B portfolio -> DENY
User changes own role -> DENY
User changes own subscription -> DENY
User writes auditLog -> DENY
Support reads authorized support ticket -> ALLOW
Support reads compliance document -> DENY
Finance reads payment -> ALLOW
```

Rules should be reviewed in CI before production deployment.

---

# 76. Security Testing / Attack Simulation

Test direct API/database access, not only the UI.

Attempt:

- token replay
- modified UID
- direct Firestore REST access
- role manipulation
- query enumeration
- pagination abuse
- request replay
- webhook replay
- duplicate payment
- field injection
- unauthorized export
- storage path guessing
- malicious file upload

---

# 77. Data Integrity CI/CD Gate

A production deployment should fail if:

```text
schema checks fail
rules tests fail
critical unit tests fail
migration validation fails
security tests fail
build fails
type checking fails
linting fails
```

Deployments should promote:

```text
dev -> staging -> production
```

rather than allowing arbitrary direct production changes.

---

# 78. Database Migrations

Create:

```text
migrations/
├── 001_initial_schema
├── 002_plan_versions
├── 003_portfolio_versions
├── 004_payment_entities
├── 005_compliance_split
└── ...
```

Each migration should be:

- idempotent
- logged
- tested
- observable
- reversible where practical

Do not use manual Firebase Console edits as the normal migration process.

---

# 79. No Manual Production Mutation as Normal Workflow

Developers/admins should not routinely:

```text
open Firestore Console
find user
change random field
```

Instead create controlled admin operations.

Manual console changes should be exceptional, documented, and audited according to operational policy.

---

# 80. Incident Response

Create a documented procedure for:

```text
suspected account compromise
credential leak
unauthorized admin action
data exposure
payment inconsistency
mass deletion
bad migration
market-data corruption
backup failure
```

Incident process:

```text
Detect
  -> Contain
  -> Investigate
  -> Recover
  -> Validate
  -> Communicate according to policy
  -> Prevent recurrence
```

Preserve relevant logs and evidence.

---

# 81. Production Monitoring

Monitor:

```text
Auth failure rate
MFA failures
API latency
API errors
Firestore errors
Permission denied rate
Payment success/failure
Webhook failures
Subscription anomalies
Portfolio submission failures
Notification failures
Job failures
Backup failures
Integrity exceptions
Reconciliation mismatches
Storage anomalies
```

Use severity levels and alert routing.

---

# 82. Background Jobs

Create `systemJobs/{jobId}` for asynchronous work.

Example:

```json
{
  "jobId": "job_123",
  "type": "SEND_PORTFOLIO_APPROVAL_EMAIL",
  "status": "PROCESSING",
  "attempts": 2,
  "payloadRef": "...",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "nextRetryAt": "Timestamp"
}
```

Jobs require:

- retry strategy
- exponential backoff
- max attempts
- dead-letter/error state
- alerting

---

# 83. Production Data Lifecycle

A useful universal lifecycle is:

```text
CREATE
  |
  v
VALIDATE
  |
  v
AUTHORIZE
  |
  v
STORE
  |
  v
AUDIT
  |
  v
USE / DERIVE
  |
  v
VERSION / ARCHIVE
  |
  v
RETENTION POLICY
  |
  v
CONTROLLED DELETE / ANONYMIZE
```

---

# 84. Production Write Pattern

Every sensitive write should follow:

```text
Client request
      |
      v
Authenticate
      |
      v
Authorize
      |
      v
Validate schema
      |
      v
Validate domain state
      |
      v
Read authoritative current record
      |
      v
Transaction / atomic operation
      |
      +--> domain mutation
      +--> event/audit
      +--> outbox/job
      |
      v
Return safe response
```

---

# 85. Production Read Pattern

```text
Authenticate
    |
    v
Authorize
    |
    v
Query appropriate domain
    |
    v
Field projection
    |
    v
Map to view model
    |
    v
Return minimal required data
```

---

# 86. Production Phased Development Plan

The implementation should be performed in phases rather than attempting every feature at once.

---

## PHASE 0 — Production Architecture Lock

### Objective

Freeze the target data/security architecture before implementation proceeds further.

### Deliverables

- target system architecture
- domain boundaries
- source-of-truth map
- data classification
- RBAC matrix
- permissions matrix
- data dictionary
- API conventions
- state machines
- environment strategy
- retention strategy
- backup/DR strategy

### Exit criteria

No critical collection or business field has ambiguous ownership.

---

## PHASE 1 — Environment & Infrastructure Foundation

### Build

- dev Firebase project
- staging Firebase project
- production Firebase project
- Cloud Run/Functions foundation
- Secret Manager
- IAM service accounts
- Storage buckets
- logging
- monitoring
- CI/CD

### Security

- deny-by-default initial rules
- secure deployment accounts
- no local production credentials
- secret rotation policy

### Testing

- deploy from CI
- verify environment separation
- verify secrets are not shipped

### Exit criteria

A developer cannot accidentally connect local development to production.

---

## PHASE 2 — Authentication & Authorization

### Build

- Firebase Auth integration
- profile bootstrap
- role model
- permission model
- MFA for privileged staff
- session revocation
- reauthentication for sensitive actions
- App Check

### Build RBAC service

```text
hasPermission(uid, permission)
requirePermission(uid, permission)
```

### Testing

- all cross-user access attempts denied
- all role escalation attempts denied
- MFA enforced for privileged accounts

### Exit criteria

No privileged action relies on React route protection alone.

---

## PHASE 3 — Database Foundation

### Build

- users
- private user data
- compliance
- plans
- plan versions
- instruments
- audit logs
- security events

### Add

- runtime schemas
- repository contracts
- timestamps
- field naming standards
- ID strategy

### Exit criteria

All documents pass canonical schemas and access policies.

---

## PHASE 4 — Portfolio Domain

### Build

- portfolio root
- portfolio versions
- holdings
- portfolio events
- status state machine
- transactional submission
- resubmission model
- admin review
- approval/rejection

### Critical rule

No browser-side authoritative approval/status mutation.

### Exit criteria

A portfolio can be fully traced from submission through approval and historical versions.

---

## PHASE 5 — Market Data & Valuation

### Build

- instrument master
- market data adapter
- latest prices
- market snapshots
- valuation engine
- calculation versions
- portfolio snapshots

### Tests

- money precision
- PnL calculations
- allocation
- historical reproducibility
- bad/missing market prices

### Exit criteria

Current value and PnL are centrally calculated and independently reproducible.

---

## PHASE 6 — Commerce & Payments

### Build

- orders
- payments
- invoices
- subscriptions
- entitlements
- payment provider adapter
- webhook verification
- idempotency
- refunds
- subscription expiry

### Testing

- success
- failure
- retry
- duplicate webhook
- duplicate order request
- payment mismatch
- refund

### Exit criteria

No frontend redirect can manufacture a successful subscription.

---

## PHASE 7 — Notifications & Jobs

### Build

- persistent notifications
- notification preferences
- outbox events
- email provider
- push/SMS if required
- job retries
- failure states

### Exit criteria

Critical notifications cannot silently disappear.

---

## PHASE 8 — Research & CMS

### Build

- research domain
- versioning
- review/publish workflow
- audience targeting
- CMS versioning
- publishing
- rollback

### Security

- sanitized rich text
- schema validation
- role-specific editing/publishing

### Exit criteria

Published content is versioned, traceable, and reversible.

---

## PHASE 9 — Support & User Operations

### Build

- tickets
- messages
- attachments
- assignment
- priorities
- statuses
- staff visibility controls
- notification integration

### Exit criteria

Support agents can resolve customer issues without unnecessary access to restricted financial/compliance data.

---

## PHASE 10 — Admin Terminal

### Build in order

1. Overview
2. User directory
3. User detail
4. Portfolio approvals
5. Portfolio review/version history
6. Subscriptions
7. Payments
8. Research
9. Support
10. CMS
11. Audit
12. Security
13. Integrity/reconciliation
14. System health

### Exit criteria

Every privileged admin action is permission-checked and audited.

---

## PHASE 11 — Data Integrity & Reconciliation

### Build

- nightly/daily integrity jobs
- payment reconciliation
- subscription reconciliation
- portfolio totals validation
- orphan detection
- exception queue
- repair workflows

### Exit criteria

The system can detect and report inconsistent state rather than silently propagating it.

---

## PHASE 12 — Backup & Disaster Recovery

### Build

- PITR
- scheduled backups
- longer retention
- independent backup copy
- restore environment
- restore scripts
- integrity verification
- documented RPO/RTO

### Perform

- accidental delete drill
- bad migration drill
- restore drill

### Exit criteria

A restore has been successfully performed and validated.

---

## PHASE 13 — Security Hardening

### Build

- security headers
- rate limiting
- abuse prevention
- storage hardening
- admin session controls
- sensitive read auditing
- export controls
- dependency scanning
- secret scanning
- vulnerability scanning

### Perform

- threat model review
- penetration test
- Firestore rules assessment
- direct API attack simulation

### Exit criteria

Critical/high severity findings are closed or formally accepted.

---

## PHASE 14 — Production Readiness & Launch

### Required checks

```text
[ ] Typecheck passes
[ ] Lint passes
[ ] Unit tests pass
[ ] Integration tests pass
[ ] E2E tests pass
[ ] Security/rules tests pass
[ ] Concurrency tests pass
[ ] Payment tests pass
[ ] Backup restore tested
[ ] Data-integrity checks pass
[ ] Monitoring active
[ ] Alerts active
[ ] Secrets verified
[ ] Production environment isolated
[ ] CI/CD verified
[ ] Incident plan documented
[ ] Rollback plan documented
[ ] Admin MFA verified
[ ] Retention policies approved
[ ] Legal/compliance sign-off obtained where required
```

---

# 87. Suggested Repository / Source Layout

```text
ArthResearchApplication/
├── docs/
│   ├── 01-project-overview.md
│   ├── 02-design-system.md
│   ├── 05-database-schema.md
│   ├── 06-api-contracts.md
│   ├── 07-folder-structure.md
│   ├── 08-components.md
│   ├── 09-pages.md
│   ├── 10-coding-rules.md
│   ├── 11-production-security.md
│   ├── 12-data-classification.md
│   ├── 13-data-dictionary.md
│   ├── 14-rbac-permissions.md
│   ├── 15-api-security.md
│   ├── 16-backup-disaster-recovery.md
│   ├── 17-audit-logging.md
│   ├── 18-data-retention.md
│   ├── 19-compliance-controls.md
│   ├── 20-incident-response.md
│   ├── 21-testing-security.md
│   ├── 22-database-integrity.md
│   ├── 23-migrations.md
│   ├── 24-production-readiness-checklist.md
│   └── MASTER-PROJECT-DOCUMENTATION.md
│
├── src/
│   ├── api/
│   ├── components/
│   ├── config/
│   ├── domain/
│   ├── hooks/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   ├── repositories/
│   ├── schemas/
│   ├── services/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── backend/
│   ├── auth/
│   ├── authorization/
│   ├── users/
│   ├── compliance/
│   ├── plans/
│   ├── payments/
│   ├── subscriptions/
│   ├── entitlements/
│   ├── portfolios/
│   ├── holdings/
│   ├── instruments/
│   ├── valuation/
│   ├── marketData/
│   ├── research/
│   ├── notifications/
│   ├── support/
│   ├── cms/
│   ├── audit/
│   ├── security/
│   ├── exports/
│   ├── reconciliation/
│   ├── integrity/
│   ├── jobs/
│   └── monitoring/
│
├── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   ├── firestore-rules/
│   └── recovery/
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── package.json
└── vite.config.ts
```

---

# 88. Canonical Data Rules

Implement these rules globally:

1. Every authoritative record has a stable ID.
2. Every record has server-side timestamps.
3. Every sensitive mutation has authorization.
4. Financial values use integer minor units.
5. Important histories are versioned, not overwritten.
6. Derived values are recalculable.
7. Sensitive data is isolated by domain.
8. Client state is never the financial source of truth.
9. Backend validates every sensitive operation.
10. Audit records are immutable from the normal application surface.
11. Critical operations are idempotent.
12. Critical multi-document operations are atomic or explicitly workflow-driven.
13. Sensitive files live in private storage.
14. Exports are explicit, temporary, controlled, and audited.
15. All environments are isolated.
16. Production has tested backups and restore procedures.
17. Security rules are automatically tested.
18. Data integrity is continuously checked.
19. Roles do not automatically imply unlimited access.
20. No production operation depends on a user's browser clock or client-controlled status.

---

# 89. Things Explicitly Prohibited

```text
DO NOT:

- trust frontend validation for security
- trust frontend payment success
- trust browser Date.now() for entitlement authority
- allow client-side role assignment
- allow client-side audit-log creation
- expose raw PAN unnecessarily
- publish KYC files publicly
- store backend secrets in frontend code
- use floating point as authoritative INR storage
- silently overwrite financial history
- delete audit records through normal admin UI
- use shared admin accounts
- protect admin functionality only through React routes
- fetch all sensitive user data for an admin list
- load huge unpaginated collections
- let arbitrary JSON become trusted application configuration
- depend on Zustand/localStorage as durable storage
- assume a successful email means a notification is recorded
- assume a parent Firestore document deletion removes subcollections
- rely on backups without restore drills
- manually mutate production data as the routine repair mechanism
- allow duplicate webhook processing
- allow concurrent privileged requests to bypass state checks
```

---

# 90. Definition of Production-Grade for Arth

Arth should be declared production-ready only when all of the following are operationally true:

```text
SECURITY
[ ] Firebase Auth configured
[ ] Admin MFA mandatory
[ ] App Check configured where appropriate
[ ] Deny-by-default Firestore rules
[ ] Storage rules configured
[ ] Backend authorization active
[ ] RBAC + permission matrix enforced
[ ] Rate limiting active
[ ] Security headers active
[ ] Secrets in Secret Manager

DATA
[ ] User/private/compliance separation
[ ] Plan versioning
[ ] Portfolio versioning
[ ] Holding canonical model
[ ] Instrument master
[ ] Financial minor-unit representation
[ ] Server timestamps
[ ] Derived-vs-authoritative separation
[ ] Consent versioning

COMMERCE
[ ] Orders
[ ] Payments
[ ] Verified webhook
[ ] Idempotency
[ ] Subscriptions
[ ] Entitlements
[ ] Invoice/receipt workflow
[ ] Reconciliation

PORTFOLIO
[ ] Transactional submission
[ ] Backend approval/rejection
[ ] State machine
[ ] Historical versions
[ ] Valuation service
[ ] Snapshot generation

GOVERNANCE
[ ] Immutable application audit
[ ] Cloud/infrastructure audit
[ ] Sensitive-read auditing
[ ] Admin reason codes
[ ] Maker-checker for high-risk actions where required

OPERATIONS
[ ] Notification outbox
[ ] Background jobs
[ ] Retry/dead-letter behavior
[ ] Integrity checks
[ ] Reconciliation dashboard
[ ] Monitoring
[ ] Alerts

RECOVERY
[ ] PITR enabled
[ ] Scheduled backups
[ ] Independent backup strategy
[ ] Restore environment
[ ] Restore drill completed
[ ] RPO/RTO documented

ENGINEERING
[ ] Unit tests
[ ] Integration tests
[ ] E2E tests
[ ] Security/rules tests
[ ] Concurrency tests
[ ] Migration tests
[ ] CI/CD gates
[ ] Rollback strategy
[ ] Incident response documented
```

---

# 91. Final Target Architecture

The final system should operate like this:

```text
                         ┌─────────────────────────┐
                         │       React 19 UI       │
                         │ User + Admin Terminal   │
                         └────────────┬────────────┘
                                      │
                         Auth + App Check + HTTPS
                                      │
                         ┌────────────▼────────────┐
                         │       API Layer         │
                         │ Cloud Run / Functions   │
                         └────────────┬────────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 │                    │                    │
                 v                    v                    v
        ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
        │ Authorization  │   │ Domain Logic   │   │ Integration    │
        │ RBAC / ACL     │   │ Validation     │   │ Providers      │
        └────────────────┘   └────────┬───────┘   └────────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │       Firestore         │
                        │ Operational Source Data │
                        └────────────┬────────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  v                  v                  v
            Audit / Events      Jobs / Outbox      Integrity /
                                                    Reconciliation
                  │                  │                  │
                  └──────────────────┼──────────────────┘
                                     │
                         ┌───────────▼───────────┐
                         │ Backup / PITR / DR     │
                         └───────────────────────┘
```

The fundamental rule remains:

> **React asks. Backend decides. Firestore stores. Events explain. Integrity jobs verify. Backups recover. Security rules constrain. IAM protects privileged infrastructure.**

---

# 92. Recommended Implementation Order

Do not start by polishing more pages.

Build in this order:

```text
1. Architecture + data dictionary
2. Environments + IAM + secrets
3. Auth + MFA + RBAC
4. Firestore rules + security tests
5. User/private/compliance model
6. Plans + plan versions
7. Instruments
8. Portfolio versions + holdings
9. Backend portfolio workflow
10. Valuation + snapshots
11. Orders + payments + webhooks
12. Subscriptions + entitlements
13. Notifications + jobs
14. Research + CMS
15. Support
16. Admin terminal
17. Audit + security event tooling
18. Reconciliation + integrity
19. Backup + restore
20. Security hardening
21. Full test suite
22. Staging validation
23. Production launch
```

This order prevents you from building a beautiful interface on top of an unstable source of truth.

---

# 93. Final Engineering Principle

The most important change to Arth is not a particular Firestore collection or React component.

It is the **trust model**.

The application must assume that:

```text
The browser can be modified.
The browser clock can be modified.
The network can fail.
A request can be replayed.
A webhook can be duplicated.
Two admins can act at once.
A developer can make a migration mistake.
An administrator can make a human error.
A credential can be compromised.
A database record can become inconsistent.
An external provider can fail.
```

The architecture must therefore provide:

```text
Authentication
+
Authorization
+
Validation
+
Atomicity
+
Idempotency
+
Versioning
+
Auditability
+
Reconciliation
+
Backup
+
Recovery
+
Monitoring
+
Security testing
```

That is the standard this project should target before it is described as a production-grade financial/research application.

---

# Appendix A — Existing Arth Pages Mapped to the New Architecture

## Public

```text
LandingPage
LoginPage
PlansPage
```

## Checkout / onboarding

```text
CheckoutPage
WelcomePage
InvestmentEntryPage
PortfolioPendingPage
PortfolioRejectedPage
ApprovalPendingPage
```

## User application

```text
DashboardPage
PortfolioPage
WatchlistPage
HistoryPage
NotificationsPage
SupportPage
ProfilePage
```

## Admin

```text
AdminDashboard
AdminUsers
AdminUserPortfolio
AdminApprovals
AdminReviewPortfolio
AdminSubscriptions
AdminCMS
AdminContentHub
AdminSupport
AdminSettings
```

All of these remain valid product surfaces; the architecture behind them becomes more authoritative and secure.

---

# Appendix B — Quick Security Review Checklist

Before every production release ask:

```text
Can a normal user read another user's portfolio?
Can a normal user modify subscription state?
Can a normal user modify expiry dates?
Can a normal user assign an admin role?
Can a normal user write an audit event?
Can a support user see restricted KYC data?
Can a finance user modify research content?
Can a frontend redirect create a subscription?
Can the same webhook run twice without duplication?
Can two admins overwrite each other's changes?
Can a deleted portfolio's history be recovered?
Can an admin export more information than necessary?
Can a production secret appear in the browser bundle?
Can a public Storage URL reveal KYC documents?
Can a failed notification disappear without an error state?
Can an integrity mismatch be detected automatically?
Can the database be restored and verified?
```

Every answer should be enforced by architecture and automated tests, not tribal knowledge.

---

# Appendix C — Firebase Guidance Relevant to the Architecture

The design relies on standard Firebase/Google Cloud capabilities and should be validated against the current Firebase documentation during implementation:

- Firestore Security Rules for client authorization.
- Server-side IAM controls for privileged backend access.
- Firestore transactions/batched writes for atomic operations.
- Firebase App Check for app-origin verification where appropriate.
- Firebase Authentication MFA for privileged identities.
- Firestore indexes/cursor-based query design.
- Firestore PITR and scheduled backups for recovery.
- Google Cloud Audit Logs for infrastructure-level auditing.
- Secret Manager for backend secrets.

Current Firebase/Google Cloud documentation should be treated as the implementation authority for exact configuration syntax, quotas, supported behavior, and product limits.

---

# Document Status

**Status:** Production architecture blueprint

**Primary purpose:** Implementation planning and architecture governance

**Recommended usage:** Treat each phase as an engineering milestone with its own design review, implementation, tests, and acceptance criteria. Do not bypass security, data-integrity, or backup phases to accelerate feature development.
