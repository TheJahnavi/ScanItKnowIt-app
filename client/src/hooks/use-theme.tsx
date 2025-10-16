import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    try {
      // Initialize theme from localStorage or system preference
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Check if window and matchMedia are available
        if (typeof window !== 'undefined' && window.matchMedia) {
          const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
          setTheme(systemPreference);
        } else {
          // Default to light theme if matchMedia is not available
          setTheme("light");
        }
      }
    } catch (error) {
      console.error("Failed to initialize theme from localStorage:", error);
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    try {
      // Apply theme to document
      if (typeof document !== 'undefined') {
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
      }
    } catch (error) {
      console.error("Failed to apply theme to document:", error);
    }
  }, [theme]);

  const toggleTheme = () => {
    try {
      setTheme(theme === "light" ? "dark" : "light");
    } catch (error) {
      console.error("Failed to toggle theme:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}