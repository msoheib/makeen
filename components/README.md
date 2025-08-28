# Components

This directory contains reusable React Native components for the Real Estate Management app.

## QuickStats

A reusable statistics display component that shows key metrics in a clean, visual format.

### Features

- **Clean Design**: Material Design 3 compliant with proper spacing and shadows
- **Theme Support**: Automatically adapts to light/dark mode
- **Flexible Configuration**: Optional owners count display for admin/manager users
- **Loading States**: Built-in loading indicators
- **Responsive Layout**: Optimized for different screen sizes
- **Internationalization**: Arabic text support with RTL layout

### Props

```typescript
interface QuickStatsProps {
  total: number;           // Total count
  active: number;          // Active count  
  pending: number;         // Pending count
  owners?: number;         // Optional owners count
  showOwners?: boolean;    // Whether to display owners stat
  loading?: boolean;       // Loading state
}
```

### Usage

#### Basic Usage
```tsx
import QuickStats from '@/components/QuickStats';

<QuickStats
  total={25}
  active={20}
  pending={5}
/>
```

#### With Owners (Admin/Manager View)
```tsx
<QuickStats
  total={25}
  active={20}
  pending={5}
  owners={10}
  showOwners={true}
/>
```

#### With Loading State
```tsx
<QuickStats
  total={25}
  active={20}
  pending={5}
  loading={true}
/>
```

### Displayed Statistics

1. **إجمالي المستأجرين** (Total Tenants) - Primary color with Users icon
2. **مستأجرين نشطين** (Active Tenants) - Green color with Phone icon  
3. **في الانتظار** (Pending Tenants) - Orange color with Clock icon
4. **إجمالي الملاك** (Total Owners) - Purple color with Shield icon (optional)

### Integration

The component is currently integrated into the Tenants screen (`app/(tabs)/tenants.tsx`) and replaces the previous inline statistics display. It provides a cleaner, more maintainable approach to displaying tenant statistics.

### Styling

- Uses the app's theme system for consistent colors
- Responsive design with proper spacing
- Material Design elevation and shadows
- RTL support for Arabic text
- Icon-based visual indicators for each statistic

### Testing

The component includes comprehensive tests covering:
- Basic rendering
- Owners display toggle
- Loading states
- Zero value handling
- Component stability

Run tests with: `npm test -- __tests__/components/QuickStats.test.tsx`
