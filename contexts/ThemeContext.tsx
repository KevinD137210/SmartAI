import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const removeOldTheme = () => {
      root.classList.remove('dark', 'light');
    };

    const applyTheme = (mode: 'dark' | 'light') => {
      removeOldTheme();
      root.classList.add(mode);
      setCurrentMode(mode);
    };

    const handleSystemChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    if (theme === 'system') {
      handleSystemChange(mediaQuery);
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      applyTheme(theme);
    }

    localStorage.setItem('theme', theme);

    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
