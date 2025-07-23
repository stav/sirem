# AG Grid Theming API Guide

## Overview

AG Grid v33+ introduced a new Theming API that replaces the legacy CSS-based theming system. This guide explains the benefits and implementation approaches.

## Benefits of the New Theming API

### 1. **Better Performance**

- **CSS-in-JS**: Styles are generated at runtime, reducing bundle size
- **Tree Shaking**: Only includes styles you actually use
- **No CSS Conflicts**: Eliminates global CSS pollution issues

### 2. **Type Safety**

- **Full TypeScript Support**: Proper type definitions for all theme properties
- **IntelliSense**: Better IDE support with autocomplete
- **Compile-time Validation**: Catch theme errors before runtime

### 3. **Dynamic Theming**

- **Runtime Theme Switching**: Change themes without page reload
- **System Preference Detection**: Automatic light/dark mode support
- **User Preference Storage**: Persist theme choices

### 4. **Enhanced Customization**

- **Granular Control**: Customize individual components
- **CSS Variables**: Use CSS custom properties for dynamic values
- **Component-level Styling**: Target specific grid elements

### 5. **Better Integration**

- **Framework Agnostic**: Works with React, Vue, Angular, etc.
- **Build Tool Friendly**: Compatible with modern bundlers
- **SSR Support**: Works with server-side rendering

## Implementation Approaches

### Option 1: Use Built-in Themes (Recommended)

```tsx
// Simple approach - let AG Grid use default theme
<AgGridReact
  // No theme prop needed - defaults to 'quartz'
  rowData={data}
  columnDefs={columns}
/>

// Or explicitly specify a theme
<AgGridReact
  theme="quartz" // or "quartz-dark", "balham", "material", etc.
  rowData={data}
  columnDefs={columns}
/>
```

### Option 2: Dynamic Theme Switching

```tsx
import { useState } from 'react'

function MyGrid() {
  const [theme, setTheme] = useState('quartz')

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="quartz">Quartz Light</option>
        <option value="quartz-dark">Quartz Dark</option>
        <option value="balham">Balham</option>
        <option value="material">Material</option>
      </select>

      <AgGridReact theme={theme} rowData={data} columnDefs={columns} />
    </div>
  )
}
```

### Option 3: System Preference Detection

```tsx
import { useEffect, useState } from 'react'

function MyGrid() {
  const [theme, setTheme] = useState('quartz')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'quartz-dark' : 'quartz')
    }

    setTheme(mediaQuery.matches ? 'quartz-dark' : 'quartz')
    mediaQuery.addEventListener('change', updateTheme)

    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [])

  return <AgGridReact theme={theme} rowData={data} columnDefs={columns} />
}
```

### Option 4: Custom Theme Configuration

```tsx
// For advanced customization
const customTheme = {
  palette: {
    fills: ['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8'],
    strokes: ['#cbd5e1', '#94a3b8', '#64748b', '#475569']
  },
  overrides: {
    common: {
      backgroundColor: '#ffffff',
      color: '#1e293b',
      borderColor: '#e2e8f0',
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    header: {
      backgroundColor: '#f8fafc',
      color: '#475569',
      fontWeight: '600'
    },
    row: {
      hoverBackgroundColor: '#f1f5f9',
      selectedBackgroundColor: '#dbeafe'
    }
  }
}

<AgGridReact
  theme={customTheme}
  rowData={data}
  columnDefs={columns}
/>
```

## Available Built-in Themes

### Modern Themes (New Theming API)

- `quartz` - Clean, modern light theme
- `quartz-dark` - Clean, modern dark theme
- `balham` - Professional light theme
- `balham-dark` - Professional dark theme
- `material` - Material Design theme
- `material-dark` - Material Design dark theme

### Legacy Themes (CSS-based)

- `legacy` - Use with CSS imports
- `alpine` - Classic light theme
- `alpine-dark` - Classic dark theme
- And many more enterprise themes...

## Migration from Legacy CSS

### Before (Legacy CSS)

```tsx
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
;<div className="ag-theme-alpine">
  <AgGridReact
    theme="legacy" // Required for CSS themes
    rowData={data}
    columnDefs={columns}
  />
</div>
```

### After (New Theming API)

```tsx
// No CSS imports needed!

<div>
  <AgGridReact
    theme="quartz" // or any other theme
    rowData={data}
    columnDefs={columns}
  />
</div>
```

## Best Practices

### 1. **Start with Built-in Themes**

- Use `quartz` or `quartz-dark` for most applications
- These themes are well-tested and maintained

### 2. **Implement Dark Mode Support**

- Detect system preferences
- Allow user override
- Store preference in localStorage

### 3. **Performance Considerations**

- Avoid switching themes frequently
- Use `useMemo` for custom themes
- Consider lazy loading for multiple themes

### 4. **Accessibility**

- Ensure sufficient color contrast
- Test with screen readers
- Follow WCAG guidelines

## Troubleshooting

### Common Issues

1. **Theme not applying**: Make sure you're not importing CSS files
2. **TypeScript errors**: Use proper type casting for custom themes
3. **Performance issues**: Avoid creating themes in render functions

### Error #239 Solution

If you see error #239 about conflicting theming methods:

- Remove CSS imports (`ag-grid.css`, `ag-theme-*.css`)
- Use `theme="legacy"` if you need to keep CSS imports
- Or migrate to the new Theming API completely

## Example Implementation

See `src/lib/ag-grid-themes.ts` for a practical implementation with:

- Theme constants
- System preference detection
- User preference helpers
- Usage examples

## Resources

- [AG Grid Theming Documentation](https://www.ag-grid.com/react-data-grid/theming/)
- [Migration Guide](https://www.ag-grid.com/react-data-grid/theming-migration/)
- [Theme Customization](https://www.ag-grid.com/react-data-grid/theming-customisation/)
