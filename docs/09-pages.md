# Pages

## Public / Guest
*   **Landing Page**: Hero, About, Philosophy, Testimonials, FAQ. (CMS Controlled).
*   **Plans Page**: Grid of available subscription plans dynamically fetched from Firestore.
*   **Login Page**: Exclusive Google Authentication. Strict neo-brutalist styling.

## User Authenticated
*   **Checkout Page**: Mock Razorpay overlay simulation for purchasing a plan.
*   **Investment Entry Page**: Form for users to submit their current stock holdings (Symbol and Quantity). Submits to Firestore with `pending` status.
*   **Pending Approval Page**: Intermediary screen while waiting for Admin verification.
*   **Dashboard Page**: Main hub. Overview of assets.
*   **Portfolio Page**: Detailed view of live stock allocations and PnL.
*   **History Page**: Transaction history.
*   **Notifications Page**: System alerts and Admin messages.
*   **Profile Page**: User settings and session management.

## Admin Authenticated
*   **Admin Dashboard**: High-level metrics.
*   **Admin Users**: Table of all users.
*   **Admin Subscriptions**: CRUD interface for Firestore `plans` collection.
*   **Admin Approvals**: Table of `pending` portfolios from Firestore. Ability to approve or reject.
*   **Admin CMS**: Interface to edit global website settings (e.g., Hero section data).
*   **Admin Settings**: Platform-level configs.
