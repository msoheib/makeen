# Requirements Specification: Property Form Fixes

## Problem Statement
The Add Property form has several issues that need to be addressed:
1. Payment method shows both cash and installment options, but only cash should be available
2. The form has separate fields for "country" and "district" (الحي), but needs to be reorganized for Saudi Arabia-only properties
3. Property type buttons are getting clipped/cut off and text is not fully visible

## Solution Overview
Update the Add Property form to:
- Remove payment method selection entirely (default to cash)
- Replace "district" (الحي) field with "street" (الشارع) 
- Replace "country" field with "district" (الحي)
- Make property type buttons horizontally scrollable
- Automatically set country to "السعودية" in the database

## Functional Requirements

### FR1: Payment Method Changes
- Remove the payment method SegmentedButtons component entirely from the UI
- Form should automatically use 'cash' as the payment method when submitting
- No UI indication of payment method needed since it's always cash

### FR2: Location Field Reorganization
- Change the label "الحي" (currently neighborhood) to "الشارع" (street)
- Change the label "الدولة" (country) to "الحي" (district)
- Both fields remain as TextInput components
- The street field (previously neighborhood) becomes required
- The district field (previously country) remains required
- Automatically set country to "السعودية" in the database submission

### FR3: Property Type Button Fix
- Make the property type SegmentedButtons horizontally scrollable
- Ensure all property type options are accessible without text clipping
- Maintain the current property types: شقة، فيلا، مكتب، متجر، مستودع

### FR4: Validation Updates
- Street field (الشارع): Required field with basic non-empty validation
- District field (الحي): Required field with basic non-empty validation  
- Remove country field validation since it's auto-filled
- Keep error messages in Arabic as currently implemented

## Technical Requirements

### TR1: File Modifications
**Primary file to modify:** `app/properties/add.tsx`

Changes needed:
1. Remove payment method section (lines 391-400)
2. Update location field labels and variable mappings
3. Add horizontal scroll to property type SegmentedButtons
4. Update form submission to include hardcoded country value

### TR2: Form State Updates
- Remove `payment_method` from formData state
- Update field mapping:
  - `neighborhood` → stores street data (labeled الشارع)
  - `country` → stores district data (labeled الحي)
- Add hardcoded country value during submission

### TR3: Styling Updates
- Add ScrollView wrapper around property type SegmentedButtons
- Configure horizontal scrolling with showsHorizontalScrollIndicator={false}
- Maintain existing styling for consistency

### TR4: Database Compatibility
- No database schema changes required
- Country field will always contain "السعودية"
- Payment method will always be 'cash'
- Maintain existing database constraints

## Implementation Hints

### Property Type Scrolling Pattern
```jsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <SegmentedButtons
    value={formData.property_type}
    onValueChange={(value) => setFormData({ ...formData, property_type: value as PropertyType })}
    buttons={[
      { value: 'apartment', label: 'شقة' },
      { value: 'villa', label: 'فيلا' },
      { value: 'office', label: 'مكتب' },
      { value: 'retail', label: 'متجر' },
      { value: 'warehouse', label: 'مستودع' },
    ]}
    style={styles.segmentedButtons}
  />
</ScrollView>
```

### Form Submission Update Pattern
```javascript
const propertyData = {
  ...existingFields,
  country: 'السعودية', // Hardcoded
  payment_method: 'cash', // Hardcoded
  neighborhood: formData.neighborhood.trim(), // This is now street
  // country field in formData now contains district
};
```

## Acceptance Criteria

1. **Payment Method**
   - [ ] Payment method section completely removed from UI
   - [ ] Form submits with 'cash' as default payment method
   - [ ] No payment-related validation errors

2. **Location Fields**
   - [ ] "الحي" label changed to "الشارع" (street)
   - [ ] "الدولة" label changed to "الحي" (district)
   - [ ] Both fields are required and show appropriate error messages
   - [ ] Form submits with "السعودية" as country value

3. **Property Type Display**
   - [ ] All property type options are fully visible
   - [ ] Horizontal scrolling works smoothly
   - [ ] No text clipping occurs
   - [ ] Selection functionality remains intact

4. **Form Functionality**
   - [ ] Form validation works correctly
   - [ ] Form submits successfully with all changes
   - [ ] Error messages display in Arabic
   - [ ] Navigation back to property list works

## Assumptions
- Database schema remains unchanged
- No changes needed to property listing or detail views
- Arabic text direction (RTL) handling remains as-is
- No translation system implementation needed (maintaining hardcoded Arabic)