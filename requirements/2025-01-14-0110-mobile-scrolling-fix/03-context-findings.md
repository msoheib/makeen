# Context Findings

## Technical Analysis of Scrolling Issues

### Page Structure Analysis

#### 1. **Properties Page (`app/(tabs)/properties.tsx`)**
- **Structure**: `SafeAreaView` > `ModernHeader` > `ScrollView` > Content
- **Stats Section**: Inside ScrollView at the top
- **Property List**: `FlatList` with `scrollEnabled={false}` nested inside ScrollView
- **Problem**: Nested scrollable components where FlatList is disabled, forcing parent ScrollView to handle all scrolling

#### 2. **Tenants Page (`app/(tabs)/tenants.tsx`)**
- **Structure**: Similar to Properties page
- **Stats Section**: Inside ScrollView at the top
- **Tenant List**: `FlatList` with `scrollEnabled={false}` nested inside ScrollView
- **Problem**: Same nested scrolling issue as Properties page

#### 3. **Maintenance Page (`app/(tabs)/maintenance.tsx`)**
- **Structure**: `SafeAreaView` > `ModernHeader` > `FlatList` (main container)
- **Stats Section**: Outside FlatList, positioned between header and main content
- **Maintenance List**: `FlatList` as the main scrollable container
- **Problem**: Stats section is positioned outside the main scroll container, causing it to appear "fixed"

### Root Cause Analysis

#### A. **Card Touch Event Interference**
All three pages use React Native Paper's `Card` component with `onPress` handlers:
- `PropertyCard` (line 36-38): `<Card onPress={handlePress}>`
- `MaintenanceRequestCard` (line 195): `<Card onPress={handlePress}>`
- Similar pattern in tenant cards

**React Native Paper's Card implementation**:
- Uses `TouchableRipple` internally
- On web, this creates touch event conflicts
- Prevents scroll event propagation on card areas
- Only empty spaces outside cards respond to touch scrolling

#### B. **Nested Scroll Architecture Issues**
Properties and Tenants pages use problematic pattern:
```javascript
<ScrollView>
  <View style={styles.statsSection}>
    {/* Stats content */}
  </View>
  <FlatList
    data={items}
    scrollEnabled={false}  // Forces parent to handle scrolling
    renderItem={renderItem}
  />
</ScrollView>
```

This creates:
- Performance issues on web
- Touch event conflicts
- Inconsistent scrolling behavior

#### C. **Maintenance Page Stats Positioning**
The maintenance page has a different architecture:
```javascript
<SafeAreaView>
  <ModernHeader />
  <View style={styles.statsSection}>  // Outside main scroll container
    {/* Stats content */}
  </View>
  <FlatList>  // Main scrollable container
    {/* List items */}
  </FlatList>
</SafeAreaView>
```

This causes the stats to appear "frozen" because they're outside the scrollable area.

### Web-Specific Issues

#### 1. **React Native Web Touch Handling**
- No explicit `Platform.OS === 'web'` optimizations found
- Missing web-specific touch configurations
- No `WebView` or web-specific scroll optimizations

#### 2. **Card Component Web Compatibility**
- React Native Paper's `Card` component not optimized for web touch events
- `TouchableRipple` creates invisible overlays that block scroll gestures
- No `pointerEvents` configurations for web

#### 3. **Shadow/Elevation Effects**
Cards use elevation and shadow properties:
```javascript
const shadows = {
  medium: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }
}
```

On web, these can create invisible touch-blocking layers.

### Component Analysis

#### ModernCard (`components/ModernCard.tsx`)
- Uses `Surface` from React Native Paper
- No touch event handling
- Should be less problematic than Paper's `Card`

#### PropertyCard (`components/PropertyCard.tsx`)
- Uses `Card` with `onPress` (line 36-38)
- Complex internal structure with multiple touchable elements
- Primary cause of touch conflicts on Properties page

#### MaintenanceRequestCard (`components/MaintenanceRequestCard.tsx`)
- Uses `Card` with `onPress` (line 195)
- Complex internal structure with image handling
- Primary cause of touch conflicts on Maintenance page

### Files Requiring Modification

1. **`app/(tabs)/properties.tsx`** - Fix nested scroll architecture
2. **`app/(tabs)/tenants.tsx`** - Fix nested scroll architecture  
3. **`app/(tabs)/maintenance.tsx`** - Fix stats section positioning
4. **`components/PropertyCard.tsx`** - Add web touch optimizations
5. **`components/MaintenanceRequestCard.tsx`** - Add web touch optimizations
6. **Similar tenant card components** - Add web touch optimizations

### Recommended Solutions

1. **Replace nested FlatList pattern** with single scrollable container
2. **Add web-specific touch configurations** using `Platform.select`
3. **Implement proper scroll event handling** for card components
4. **Fix maintenance page stats positioning** to scroll with content
5. **Add `pointerEvents` configurations** for web compatibility

### Related Features Analyzed

- All three pages follow similar patterns established in the codebase
- Stats sections are consistently used across pages
- Card-based layouts are a core design pattern
- The issue affects the primary navigation tabs users interact with most