// src/context/ThemeContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Manages dark/light mode across the entire app.
// Reads saved preference from localStorage on first load.
// Adds or removes the "dark" class on <html> whenever theme changes.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

export function ThemeProvider({ children }) {
  // Default to 'dark'; read saved preference if it exists
  const [theme, setTheme] = useState(
    () => localStorage.getItem('twc-theme') || 'dark'
  )

  useEffect(() => {
    const root = document.documentElement // <html> element
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('twc-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
