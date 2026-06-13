import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "pink" | "rose" | "sage" | "golden";
const THEMES: Theme[] = ["pink", "rose", "sage", "golden"];

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  themes: Theme[];
}

const Ctx = createContext<ThemeCtx | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "pink";
    return (localStorage.getItem("diera-theme") as Theme) || "pink";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("diera-theme", theme);
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, setTheme: setThemeState, themes: THEMES }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTheme = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be inside ThemeProvider");
  return v;
};
