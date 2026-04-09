// In src/context/ThemeContext.js
import React, { createContext, useEffect, useContext, useMemo } from 'react';

const ThemeContext = createContext();
const LOCKED_THEME = 'dark';

export const ThemeProvider = ({ children }) => {
  // Keep a single visual system across the app.
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(LOCKED_THEME);
  }, []);

  const setTheme = () => { };

  const value = useMemo(
    () => ({ theme: LOCKED_THEME, setTheme, availableThemes: [LOCKED_THEME] }),
    []
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};