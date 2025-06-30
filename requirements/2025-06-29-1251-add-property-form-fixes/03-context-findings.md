# Context Findings

Analysis of the add property form and related components for implementing the requested improvements.

## Current Form Structure Analysis

### Add Property Form Location
**File:** `/app/properties/add.tsx`
**Form Sections:**
1. Basic Information (المعلومات الأساسية) - Property type, status, listing type
2. Location (الموقع) - Address, city, country, neighborhood  
3. Property Details (تفاصيل العقار) - Area, bedrooms, bathrooms
4. Pricing (التسعير) - Price, annual rent, payment method

### Issues Identified

#### 1. Payment Method Options (Lines 392-400)
**Current Implementation:**
```tsx
<SegmentedButtons
  value={formData.payment_method}
  onValueChange={(value) => setFormData({ ...formData, payment_method: value as PaymentMethod })}
  buttons={[
    { value: 'cash', label: 'نقداً' },
    { value: 'installment', label: 'أقساط' },
  ]}
  style={styles.segmentedButtons}
/>
```
**Required Change:** Remove installment option, only keep cash

#### 2. Location Fields Structure (Lines 276-308)
**Current Implementation:**
- City and Country in row layout (lines 276-295)
- Neighborhood field (lines 300-307)

**Required Changes:**
- Replace "country" field with "district" field
- Replace "neighborhood" field with "street" field
- All labels in Arabic

#### 3. Property Type Clipping Issue (Lines 218-230)
**Current Implementation:**
```tsx
<SegmentedButtons
  value={formData.property_type}
  buttons={[
    { value: 'apartment', label: 'شقة' },
    { value: 'villa', label: 'فيلا' },
    { value: 'office', label: 'مكتب' },
    { value: 'retail', label: 'متجر' },
    { value: 'warehouse', label: 'مستودع' },
  ]}
  style={styles.segmentedButtons}
/>
```
**Issue:** Text clipping in SegmentedButtons component

## Required Database Schema Changes

### Current Property Interface (lib/types.ts lines 36-55)
```typescript
export interface Property {
  // ... other fields
  address: string;
  city: string;
  country: string;      // TO BE REPLACED with district
  neighborhood: string; // TO BE REPLACED with street
  // ... other fields
}
```

### Required Type Updates
1. **Property Interface:** Replace `country` with `district`, `neighborhood` with `street`
2. **PaymentMethod Type:** Remove 'installment' option (lines 34)
3. **Form Data Structure:** Update formData interface to match new fields

## Translation Files Analysis

### Current Structure
**Location:** `lib/translations/[locale]/properties.json`
**Section:** `propertyInfo`

### Required Translation Updates
**Arabic translations needed:**
- "street" → "الشارع"
- "district" → "المنطقة"

**English translations needed:**
- "street" → "Street"  
- "district" → "District"

## Technical Implementation Requirements

### 1. Form Data Structure Changes
**File:** `/app/properties/add.tsx` (lines 17-34)
**Changes:**
- Replace `country: ''` with `district: ''`
- Replace `neighborhood: ''` with `street: ''`
- Set `payment_method: 'cash'` as only option

### 2. Validation Updates  
**File:** `/app/properties/add.tsx` (lines 37-67)
**Changes:**
- Update validation for `district` instead of `country`
- Update validation for `street` instead of `neighborhood`
- Update error messages in Arabic

### 3. Database Submission Changes
**File:** `/app/properties/add.tsx` (lines 99-118)
**Changes:**
- Map form fields to new database structure
- Update property data object structure

### 4. UI Layout Adjustments
**SegmentedButtons Styling Issues:**
- Potential height constraints causing clipping
- May need minHeight or padding adjustments
- Check container width for proper text display

## Integration Points

### Files Requiring Updates
1. **Primary:** `/app/properties/add.tsx` - Main form implementation
2. **Types:** `/lib/types.ts` - Property interface and PaymentMethod type
3. **Translations:** `/lib/translations/ar/properties.json` & `/lib/translations/en/properties.json`
4. **Database:** New migration for schema changes
5. **Database Types:** `/lib/database.types.ts` - Generated types from Supabase

### Related Components
- **PropertyCard components** - May need updates for displaying new fields
- **Property filters** - May need updates for filtering by district/street
- **Property listings** - May need updates for showing new location structure

## Visual Fix Requirements

### SegmentedButtons Clipping Issue
**Potential Causes:**
1. Fixed height constraints on container
2. Insufficient padding in button text
3. Font scaling issues
4. Container width limitations

**Solution Approach:**
1. Add minHeight to SegmentedButtons container
2. Increase vertical padding for button text
3. Ensure proper flex layout for text display
4. Test with different device sizes and font scales