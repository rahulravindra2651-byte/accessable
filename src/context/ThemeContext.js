import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext(null);

const THEME_KEY = 'accessableTheme';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [highContrast, setHighContrast] = useState(false);
  const [largeFont,    setLargeFont]    = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.body.classList.toggle('large-font', largeFont);
  }, [largeFont]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      isDark: theme === 'dark',
      highContrast,
      setHighContrast,
      largeFont,
      setLargeFont,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
