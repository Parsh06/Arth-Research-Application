# Design System

## Theme Philosophy
**Neo-Brutalism:** Bold, raw, and high-impact. Avoid subtle gradients or soft shadows. Embrace sharp corners, solid borders, and high-contrast elements.

## Colors
*   **Background (`neo-bg`)**: `#E0E7FF` (Light indigo)
*   **Primary (`neo-primary`)**: `#FF90E8` (Vibrant pink)
*   **Secondary (`neo-secondary`)**: `#FFC900` (Vibrant yellow)
*   **Accent (`neo-accent`)**: `#2E90FA` (Bright blue)
*   **Success (`neo-success`)**: `#00E676` (Neon green)
*   **Danger (`neo-danger`)**: `#FF3B30` (Vibrant red)
*   **Borders**: `#000000` (Solid black)

## Typography
*   **Font Family**: Google Fonts (Inter, Outfit, or system sans-serif with heavy weights)
*   **Headings**: `font-black`, `uppercase`, `tracking-tighter`
*   **Body**: `font-bold` or `font-medium`

## Borders & Radii
*   **Borders**: `border-4 border-black` everywhere (cards, inputs, buttons, containers)
*   **Border Radius**: `0px` (Square corners only, NO rounded corners unless specifically required for an icon circle)

## Shadows
*   **Standard (`shadow-neo`)**: `8px 8px 0px 0px rgba(0,0,0,1)`
*   **Small (`shadow-neo-sm`)**: `4px 4px 0px 0px rgba(0,0,0,1)`
*   **Large (`shadow-neo-lg`)**: `12px 12px 0px 0px rgba(0,0,0,1)`
*   **Pressed (`shadow-neo-pressed`)**: `2px 2px 0px 0px rgba(0,0,0,1)` (Used on button active/hover states)

## Components
*   **Buttons**: Solid colors, thick borders, sharp shadows. On hover: Translate slightly (e.g., `translate-y-1` or `translate-x-1`) and reduce shadow to simulate a physical button press.
*   **Cards**: White or solid color backgrounds, thick borders, large shadows. Often utilize slight rotations (`transform -rotate-1` or `rotate-2`) for a dynamic feel.
*   **Inputs**: Thick borders, distinct focus rings (`focus:ring-4 focus:ring-neo-primary`).

## Icons & Animations
*   **Icons**: Lucide React (use `stroke-[3]` for thicker, bolder icons to match the theme).
*   **Animations**: Framer Motion for entrance animations (slide up, fade in), but keep interactions snappy and hardware-like.
