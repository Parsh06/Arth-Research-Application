# Coding Rules

## Architecture
*   **Always use TypeScript**: Strict typing for all components, stores, and API contracts.
*   **Use Zustand for state**: Avoid React Context for complex state. Use Zustand for auth and data stores.
*   **Firebase SDK**: Always use Firebase Client SDK (v9+ modular syntax) for DB/Auth operations.
*   **No Duplicate Data**: Follow normalized NoSQL architecture.

## UI & Styling
*   **Never use inline CSS**: Always use Tailwind CSS classes.
*   **Tailwind v4**: The project uses Tailwind v4. Do not try to downgrade or use incompatible v3 plugins.
*   **Never hardcode colors**: Use the defined CSS variables (`neo-primary`, `neo-bg`, etc.) from the Design System.
*   **Strict Neo-Brutalism**: Follow the Design System (02-design-system.md) religiously. Thick borders, harsh shadows, sharp corners.
*   **Responsive First**: Build mobile layouts first, then scale up using `md:` and `lg:` prefixes.

## Components
*   **Always use reusable components**: If a UI element appears twice, abstract it.
*   **Icons**: Always use `lucide-react` with `stroke-[3]` for thickness.
*   **Animations**: Use `framer-motion` for entrances, but keep hover states hardware-accelerated via Tailwind (`transition-transform`, `translate-x/y`).
