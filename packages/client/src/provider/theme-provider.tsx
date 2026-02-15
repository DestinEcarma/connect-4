import { useLocalStorage, useMediaQuery } from "@uidotdev/usehooks";

import { type Theme, ThemeProviderContext } from "@/context/theme-context";
import { useIsomorphicLayoutEffect } from "@/hooks";

const THEME_STORAGE = "theme";

interface ThemeProviderProps extends React.PropsWithChildren {
  defaultTheme?: Theme;
  storageKey?: string;
}

function ThemeProvider({ defaultTheme = "system", storageKey = THEME_STORAGE, ...props }: ThemeProviderProps) {
  const [theme, saveTheme] = useLocalStorage<Theme>(storageKey, defaultTheme);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  const activeTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  useIsomorphicLayoutEffect(() => {
    const root = window.document.body;

    root.classList.remove("light", "dark");
    root.classList.add(activeTheme);
  }, [activeTheme]);

  const value = {
    theme,
    activeTheme,
    setTheme: saveTheme
  };

  return <ThemeProviderContext.Provider {...props} value={value} />;
}

export { ThemeProvider };
