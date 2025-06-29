// AG Grid Theme Configuration Examples
// This file demonstrates how to use the new Theming API in AG Grid v34+

// Simple theme constants for easy use
export const AG_GRID_THEMES = {
  // Modern themes (new Theming API) - recommended
  quartz: 'quartz',
  quartzDark: 'quartz-dark',
  balham: 'balham',
  balhamDark: 'balham-dark',
  material: 'material',
  materialDark: 'material-dark',
  
  // Legacy themes (CSS-based) - for backward compatibility
  legacy: 'legacy',
  alpine: 'alpine',
  alpineDark: 'alpine-dark',
} as const

// Helper function to get theme based on system preference
export const getSystemTheme = (): string => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? AG_GRID_THEMES.quartzDark 
      : AG_GRID_THEMES.quartz
  }
  return AG_GRID_THEMES.quartz
}

// Helper function to get theme based on user preference
export const getUserTheme = (userPreference: 'light' | 'dark' | 'auto'): string => {
  switch (userPreference) {
    case 'dark':
      return AG_GRID_THEMES.quartzDark
    case 'light':
      return AG_GRID_THEMES.quartz
    case 'auto':
    default:
      return getSystemTheme()
  }
}

// Example usage in your component:
// import { AG_GRID_THEMES, getUserTheme } from '@/lib/ag-grid-themes'
// 
// // In your AgGridReact component:
// <AgGridReact
//   theme={AG_GRID_THEMES.quartz}
//   // ... other props
// />
// 
// // Or with user preference:
// <AgGridReact
//   theme={getUserTheme('dark')}
//   // ... other props
// /> 
