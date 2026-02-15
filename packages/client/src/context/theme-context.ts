import { createContext } from "react";

type ActiveTheme = "dark" | "light";
type Theme = ActiveTheme | "system";

interface ThemeProviderState {
    theme: Theme;
    activeTheme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

export { ThemeProviderContext, type Theme };
