// In src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. State to hold the current theme, defaulting to 'light'
  // We check localStorage for a saved theme
  const availableThemes = ['light', 'dark', 'solarized', 'forest', 'ocean', 'dracula', 'midnight'];
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // 2. useEffect to apply the theme to the body and save to localStorage
  useEffect(() => {
    // Add the theme class to the body element
    document.body.className = '';
    document.body.classList.add(theme);
    // Save the user's choice
    localStorage.setItem('theme', theme);
  }, [theme]);

  // useMemo to prevent unnecessary re-renders of the context value
  const value = useMemo(() => ({ theme, setTheme, availableThemes }), [theme, availableThemes]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. Custom hook for easy access to the context
export const useTheme = () => {
  return useContext(ThemeContext);
};