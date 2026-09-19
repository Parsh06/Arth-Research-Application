// src/components/ThemeToggle.tsx
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="w-8 h-8 rounded-md border border-border bg-card/80 text-foreground hover:text-primary hover:border-primary/40 transition-all duration-200 shadow-sm backdrop-blur-md cursor-pointer flex items-center justify-center"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-primary hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-foreground hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
