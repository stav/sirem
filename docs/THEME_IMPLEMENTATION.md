# Theme Implementation Guide

## Overview

This project now supports a complete dark/light theme system with the following features:

- **Three theme modes**: Light, Dark, and System (follows OS preference)
- **Persistent storage**: Theme choice is saved in localStorage
- **Smooth transitions**: CSS transitions for theme changes
- **AG Grid integration**: Automatic theme switching for data grids
- **shadcn/ui compatibility**: All UI components automatically adapt

## Architecture

### Theme Context (`src/contexts/ThemeContext.tsx`)

The theme system is built around a React context that manages theme state:

```typescript
type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}
```

### CSS Variables (`src/app/globals.css`)

Themes are implemented using CSS custom properties:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  /* ... other light theme variables */
}

.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
  /* ... other dark theme variables */
}
```

### Theme Toggle Component

Two theme toggle components are available:

1. **ThemeToggle** (`src/components/ThemeToggle.tsx`): Full dropdown with Light/Dark/System options
2. **SimpleThemeToggle** (`src/components/SimpleThemeToggle.tsx`): Simple toggle between Light/Dark

## Usage

### Using the Theme Hook

```typescript
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  )
}
```

### Adding Theme Toggle to Components

```typescript
import { ThemeToggle } from '@/components/ThemeToggle'
// or
import { SimpleThemeToggle } from '@/components/SimpleThemeToggle'

function MyHeader() {
  return (
    <header>
      <h1>My App</h1>
      <ThemeToggle />
    </header>
  )
}
```

### AG Grid Integration

AG Grid automatically adapts to the current theme:

```typescript
import { getCurrentTheme } from '@/lib/ag-grid-themes'

function MyGrid() {
  return (
    <AgGridReact
      theme={getCurrentTheme()}
      // ... other props
    />
  )
}
```

## Theme Variables

All theme colors are defined as CSS custom properties:

| Variable               | Light     | Dark      | Usage              |
| ---------------------- | --------- | --------- | ------------------ |
| `--background`         | `#ffffff` | `#0a0a0a` | Main background    |
| `--foreground`         | `#171717` | `#ededed` | Main text          |
| `--card`               | `#ffffff` | `#0a0a0a` | Card backgrounds   |
| `--card-foreground`    | `#171717` | `#ededed` | Card text          |
| `--primary`            | `#171717` | `#ededed` | Primary actions    |
| `--primary-foreground` | `#fafafa` | `#0a0a0a` | Primary text       |
| `--secondary`          | `#f5f5f5` | `#262626` | Secondary elements |
| `--muted`              | `#f5f5f5` | `#262626` | Muted backgrounds  |
| `--muted-foreground`   | `#737373` | `#a3a3a3` | Muted text         |
| `--accent`             | `#f5f5f5` | `#262626` | Accent elements    |
| `--destructive`        | `#ef4444` | `#7f1d1d` | Error states       |
| `--border`             | `#e5e5e5` | `#262626` | Borders            |
| `--input`              | `#e5e5e5` | `#262626` | Input fields       |
| `--ring`               | `#171717` | `#ededed` | Focus rings        |

## Best Practices

### 1. Use Semantic Color Classes

Always use Tailwind's semantic color classes instead of hardcoded colors:

```typescript
// ✅ Good
<div className="bg-background text-foreground border-border">

// ❌ Bad
<div className="bg-white text-black border-gray-200">
```

### 2. Test Both Themes

When developing new components, test them in both light and dark modes to ensure proper contrast and readability.

### 3. Use CSS Variables for Custom Colors

If you need custom colors, define them as CSS variables:

```css
:root {
  --custom-color: #your-light-color;
}

.dark {
  --custom-color: #your-dark-color;
}
```

### 4. Handle Theme Changes in Components

For components that need to react to theme changes:

```typescript
import { useTheme } from '@/contexts/ThemeContext'
import { useEffect } from 'react'

function MyComponent() {
  const { theme } = useTheme()

  useEffect(() => {
    // Handle theme-specific logic
    if (theme === 'dark') {
      // Dark mode specific code
    }
  }, [theme])
}
```

## Troubleshooting

### Theme Not Persisting

- Check that localStorage is available
- Verify the ThemeProvider is wrapping your app
- Check browser console for errors

### Hydration Mismatch

- The `suppressHydrationWarning` attribute is added to the html element
- The ThemeProvider includes hydration protection

### AG Grid Not Theming

- Ensure you're using `getCurrentTheme()` function
- Check that AG Grid theme prop is being updated when theme changes

### Components Not Theming

- Verify components are using semantic color classes
- Check that CSS variables are properly defined
- Ensure no hardcoded colors are being used

## Future Enhancements

Potential improvements for the theme system:

1. **Custom theme colors**: Allow users to customize theme colors
2. **Theme presets**: Pre-built theme variations (blue, green, etc.)
3. **Animation preferences**: Allow users to disable transitions
4. **High contrast mode**: Accessibility-focused theme option
5. **Theme export/import**: Share theme preferences between users
