# API Contracts (Zustand & Firebase)

Because we use Firebase Client SDKs directly, our "APIs" are managed through Zustand stores calling Firebase services.

## authStore (`useAuthStore`)
State:
- `user: FirebaseUser | null`
- `dbUser: any | null` (The custom user document)
- `isAdmin: boolean`
- `isLoading: boolean`

Actions:
- `loginWithGoogle()`: Triggers popup, authenticates, fetches/creates `users` document.
- `logout()`: Signs out of Firebase.
- `initAuthListener()`: Subscribes to auth state changes.

## dataStore (`useDataStore`)
State:
- `plans: Plan[]`
- `userPortfolio: UserPortfolio | null`
- `allUsers: any[]`
- `allPortfolios: any[]`
- `siteContent: any` (Admin CMS text settings)
- `isLoadingPlans: boolean`
- `isLoadingPortfolio: boolean`
- `isLoadingSiteContent: boolean`

Actions:
- `fetchPlans()`: Reads all from `plans` collection.
- `fetchUserPortfolio(userId)`: Reads from `portfolios` collection where `userId == uid`.
- `fetchAllPortfolios()`: Reads all from `portfolios` for the Admin Dashboard.
- `fetchAllUsers()`: Reads all from `users` for the Admin Dashboard.
- `fetchSiteContent()`: Reads `landingPage`, `welcomePage`, and `plansPage` from `settings` collection.
- `updateSiteContent(collectionName, docId, data)`: Modifies CMS settings and refetches.
- `seedMockData()`: Populates `plans` collection if empty.
