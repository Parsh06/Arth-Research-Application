# Folder Structure

```
arth-research-application/
│
├── docs/                      # Project documentation (read these first!)
│
├── public/                    # Static assets (logo, media)
│
├── src/
│   ├── components/            # Reusable UI components
│   │
│   ├── config/                # Configuration (Firebase setup)
│   │
│   ├── layouts/               # Page layouts (UserLayout, AdminLayout)
│   │
│   ├── mock/                  # Temporary mock data (migrating to Firebase)
│   │
│   ├── pages/                 # Route components (Views)
│   │   ├── admin/             # Admin specific pages
│   │
│   ├── stores/                # Zustand global state stores (auth, data)
│   │
│   ├── types/                 # TypeScript interfaces and type definitions
│   │
│   ├── App.tsx                # Main router and component tree
│   ├── index.css              # Global styles and Tailwind config
│   └── main.tsx               # Entry point
│
├── .agents/                   # Custom agent configurations
│
├── firestore.rules            # Firebase security rules
├── package.json               # Dependencies
└── vite.config.ts             # Vite build config
```
