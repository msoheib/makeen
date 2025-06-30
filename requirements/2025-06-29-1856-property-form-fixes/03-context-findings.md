# Context Findings

## Files That Need Modification

### Primary File
- **`/mnt/c/Users/Hopef/Desktop/real-estate/real-estate-mg/app/properties/add.tsx`** (485 lines)
  - Contains the add property form with hardcoded Arabic text
  - Uses SegmentedButtons for property type, status, listing type, and payment method
  - Payment method buttons at lines 392-400
  - Property type buttons at lines 219-230
  - Location fields (country, district) at lines 286-307

### Type Definition File
- **`/mnt/c/Users/Hopef/Desktop/real-estate/real-estate-mg/lib/types.ts`**
  - Line 34: `export type PaymentMethod = 'cash' | 'installment';`
  - May need update if we're removing installment option entirely

### Database Schema
- **`/mnt/c/Users/Hopef/Desktop/real-estate/real-estate-mg/supabase/migrations/20250528112612_humble_field.sql`**
  - Line 54: `country text NOT NULL,` - country is a required field in database
  - Line 67: `CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'installment'))`
  - Database constraint allows both cash and installment

## Patterns to Follow

### Arabic Text Handling
- Most forms use hardcoded Arabic text directly in components
- Only auth forms (signup.tsx) use translation system
- Pattern for Arabic labels in SegmentedButtons:
  ```typescript
  buttons={[
    { value: 'apartment', label: 'شقة' },
    { value: 'villa', label: 'فيلا' },
  ]}
  ```

### Required Fields Pattern
- Required fields marked with asterisk (*) in label
- Validation error messages in Arabic
- Error text displayed below input field with styling:
  ```typescript
  {errors.fieldName && <Text style={styles.errorText}>{errors.fieldName}</Text>}
  ```

### Form Layout Pattern
- ModernCard wraps each section
- Section headers with icons and Arabic titles
- Fields organized in logical groups (Basic Info, Location, Details, Pricing)

## Technical Constraints

### 1. Payment Method
- Database constraint requires 'cash' or 'installment'
- To remove installment, need to either:
  - Keep type but hide UI option (safest)
  - Update database constraint (requires migration)

### 2. Country Field
- Database requires country field (NOT NULL constraint)
- Solution: Default to "السعودية" and hide field from UI
- Keep storing in database for data integrity

### 3. Property Type Button Clipping
- Current SegmentedButtons style only sets marginBottom
- No explicit width or text handling styles
- React Native Paper's SegmentedButtons may clip text on smaller screens

### 4. Field Renaming
- "District" → "Street" (الحي → الشارع)
- Database field is "neighborhood" not "district"
- Can change label without database migration

## Similar Features Analyzed

### Location Field Handling
- Most forms use separate TextInput fields for address components
- No other form combines country/district in the way requested
- City and country typically shown as separate fields

### Payment Method Usage
- Only properties/add.tsx uses payment method with installment option
- Finance vouchers use different payment types (cash, bank, cheque, card)
- Pattern suggests single option could just be removed from UI

## Integration Points
- No API changes needed (form submits to Supabase directly)
- No other components import or depend on payment method display
- Property listing screens don't show payment method