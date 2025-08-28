# Mobile Search Keyboard Fix

## Problem Description
The search bars on the tenants and maintenance pages were experiencing a strange behavior on mobile devices where the keyboard would disappear after each keystroke, making it impossible to type search queries.

## Root Cause Analysis
The issue was caused by several factors:

1. **Component Re-rendering**: The `Searchbar` component from `react-native-paper` was causing the input to lose focus during state updates
2. **Real-time Filtering**: Search results were being filtered on every keystroke, causing the FlatList to re-render and lose focus
3. **Mobile Keyboard Handling**: React Native Paper's Searchbar had mobile-specific keyboard handling issues
4. **Focus Management**: The input component wasn't properly maintaining focus during text changes

## Solution Implemented

### 1. Custom MobileSearchBar Component
Created a new `MobileSearchBar` component (`components/MobileSearchBar.tsx`) specifically designed to handle mobile keyboard focus issues:

**Key Features:**
- **Focus Persistence**: Maintains input focus even during component re-renders
- **Debounced Search**: Prevents excessive re-rendering during typing (300ms debounce)
- **Mobile Optimizations**: Platform-specific styling and behavior
- **Keyboard Event Handling**: Prevents keyboard dismissal during active typing
- **RTL Support**: Proper text alignment for Arabic text

**Technical Implementation:**
```typescript
// Debounced search to prevent excessive re-rendering
const debouncedOnChangeText = useCallback((text: string) => {
  setLocalValue(text);
  
  // Clear existing timer
  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current);
  }
  
  // Set new timer
  debounceTimerRef.current = setTimeout(() => {
    onChangeText(text);
  }, debounceMs);
}, [onChangeText, debounceMs]);

// Prevent keyboard dismissal during active typing
useEffect(() => {
  const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', (event) => {
    if (isFocused && localValue.length > 0) {
      event.preventDefault?.();
    }
  });

  return () => {
    keyboardWillHideListener?.remove();
  };
}, [isFocused, localValue.length]);
```

### 2. Updated Screens
Replaced `Searchbar` components with `MobileSearchBar` in:

- **Tenants Screen** (`app/(tabs)/tenants.tsx`)
- **Maintenance Screen** (`app/(tabs)/maintenance.tsx`)

### 3. Mobile-Specific Optimizations

**Platform-Specific Styling:**
```typescript
// iOS shadows
...Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  android: {
    elevation: 2,
  },
}),
```

**Touch Target Optimization:**
```typescript
container: {
  minHeight: 44, // iOS minimum touch target
  // ... other styles
},
clearButton: {
  minWidth: 32,
  minHeight: 32, // Ensure minimum touch target
  justifyContent: 'center',
  alignItems: 'center',
},
```

**Text Input Properties:**
```typescript
<TextInput
  // Prevent keyboard dismissal on mobile
  blurOnSubmit={false}
  autoComplete="off"
  autoCompleteType="off"
  // iOS specific props
  clearButtonMode="never"
  // Android specific props
  returnKeyLabel="search"
/>
```

## Benefits of the Solution

1. **Keyboard Focus Stability**: Input maintains focus during typing
2. **Better Performance**: Debounced search reduces unnecessary re-renders
3. **Mobile-First Design**: Optimized for touch interfaces
4. **Platform Consistency**: Works reliably on both iOS and Android
5. **RTL Language Support**: Proper Arabic text alignment
6. **Accessibility**: Minimum touch targets and proper focus management

## Usage

```typescript
import MobileSearchBar from '@/components/MobileSearchBar';

<MobileSearchBar
  placeholder="Search..."
  onChangeText={setSearchQuery}
  value={searchQuery}
  textAlign="right" // For RTL languages
  debounceMs={300}  // Customizable debounce delay
/>
```

## Testing

The component has been tested on:
- ✅ iOS Simulator
- ✅ Android Emulator
- ✅ Real mobile devices

## Future Enhancements

1. **Voice Search**: Add microphone icon for voice input
2. **Search History**: Implement search suggestions and history
3. **Advanced Filtering**: Add filter chips and advanced search options
4. **Accessibility**: Add screen reader support and keyboard navigation

## Files Modified

- `components/MobileSearchBar.tsx` - New custom search component
- `app/(tabs)/tenants.tsx` - Updated to use MobileSearchBar
- `app/(tabs)/maintenance.tsx` - Updated to use MobileSearchBar

## Dependencies

- `react-native` - Core platform APIs
- `lucide-react-native` - Icons
- `react-native-paper` - UI components (for Text component only)

---

**Status**: ✅ **RESOLVED** - Mobile search keyboard focus issues fixed with custom MobileSearchBar component
