# Sub-Property Management System

## Overview

The Sub-Property Management System allows property managers to create and manage sub-properties (e.g., apartments, offices, retail units) under parent properties (e.g., buildings, complexes). This system provides comprehensive management of individual units with detailed contract information, meter tracking, and tenant contact management.

## Features

### ✅ **Required Fields**
- **Contract Number** - Unique identifier for the sub-property contract
- **Payment Frequency** - Monthly, Quarterly, Semi-annual, or Annual
- **Contract PDF** - Required contract document upload
- **Tenant Contact Numbers** - At least one contact number required (with + for additional contacts)
- **Base Price** - Total contract value
- **Rent Amount** - Per-frequency rent amount
- **Contract Duration** - Options from 1 to 5 years

### ✅ **Optional Fields**
- **Meter Numbers** - Utility meter tracking (electricity, water, gas, internet)
- **Unit Details** - Floor number, unit number, unit label
- **Property Specifications** - Bedrooms, bathrooms, area, parking spaces
- **Amenities** - Property features and facilities
- **Service Charges** - Additional monthly fees
- **Furnishing Status** - Furnished or unfurnished

## Database Schema

### New Tables Created

#### 1. **property_meters**
Stores meter information for individual sub-properties:
```sql
CREATE TABLE property_meters (
  id uuid PRIMARY KEY,
  property_id uuid REFERENCES properties(id),
  meter_number text NOT NULL,
  meter_type text CHECK (meter_type IN ('electricity', 'water', 'gas', 'internet', 'utility')),
  current_reading numeric DEFAULT 0,
  last_reading_date timestamp with time zone DEFAULT now()
);
```

#### 2. **property_contacts**
Manages contact information for sub-properties:
```sql
CREATE TABLE property_contacts (
  id uuid PRIMARY KEY,
  property_id uuid REFERENCES properties(id),
  contact_type text CHECK (contact_type IN ('tenant', 'owner', 'manager', 'maintenance')),
  phone_number text NOT NULL,
  is_primary boolean DEFAULT false,
  label text
);
```

### Enhanced Tables

#### 1. **properties**
Added sub-property specific fields:
```sql
ALTER TABLE properties ADD COLUMN:
- is_sub_property boolean DEFAULT false
- parent_property_id uuid REFERENCES properties(id)
- contract_number text
- payment_frequency text CHECK (payment_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual'))
- contract_duration_years integer CHECK (contract_duration_years >= 1 AND contract_duration_years <= 5)
- base_price numeric
- contract_pdf_url text
```

#### 2. **contracts**
Enhanced with sub-property contract details:
```sql
ALTER TABLE contracts ADD COLUMN:
- contract_duration_years integer CHECK (contract_duration_years >= 1 AND contract_duration_years <= 5)
- base_price numeric
- payment_frequency text CHECK (payment_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual'))
```

## API Endpoints

### Sub-Property Management API (`subPropertiesApi`)

#### 1. **Get Sub-Properties by Parent**
```typescript
subPropertiesApi.getByParentProperty(parentPropertyId: string)
```
Returns all sub-properties for a specific parent property with related contract, meter, and contact information.

#### 2. **Create Sub-Property**
```typescript
subPropertiesApi.create(subPropertyData: SubPropertyCreateData)
```
Creates a new sub-property with:
- Property record
- Contract record
- Contract document
- Meter records (if provided)
- Contact records

#### 3. **Update Sub-Property**
```typescript
subPropertiesApi.update(id: string, updateData: Partial<SubPropertyUpdateData>)
```
Updates existing sub-property information.

#### 4. **Delete Sub-Property**
```typescript
subPropertiesApi.delete(id: string)
```
Deletes sub-property and all related records (with validation for active contracts).

#### 5. **Get Sub-Property Details**
```typescript
subPropertiesApi.getById(id: string)
```
Returns comprehensive sub-property information with all related data.

## User Interface Components

### 1. **AddSubPropertyForm Component**
Comprehensive form for creating new sub-properties with:
- **Basic Information Section**: Title, type, area, bedrooms, bathrooms, floor/unit details
- **Financial Information Section**: Base price, rent amount, payment frequency, contract duration
- **Contract Information Section**: Contract number, PDF upload
- **Meter Numbers Section**: Optional meter tracking with add/remove functionality
- **Tenant Contact Numbers Section**: Required contact management with primary/secondary designation
- **Additional Information Section**: Description, amenities, furnishing status

### 2. **SubPropertiesScreen**
Management interface for viewing and managing sub-properties:
- **Summary Statistics**: Total count, available, rented
- **Sub-Property Cards**: Detailed view of each sub-property
- **Contract Information**: Contract details, payment terms, duration
- **Meter Display**: Visual representation of meter numbers
- **Contact Management**: Phone numbers with primary/secondary indicators
- **Actions**: Edit and delete functionality

## Usage Examples

### Creating a Sub-Property

```typescript
import { subPropertiesApi } from '@/lib/api';

const newSubProperty = await subPropertiesApi.create({
  title: "Apartment 2A",
  parent_property_id: "building-uuid",
  property_type: "apartment",
  area_sqm: 120,
  bedrooms: 2,
  bathrooms: 2,
  floor_number: 2,
  unit_number: "2A",
  base_price: 50000,
  rent_amount: 3000,
  payment_frequency: "monthly",
  contract_duration_years: 2,
  contract_number: "APT-2A-2024-001",
  contract_pdf_url: "https://example.com/contract.pdf",
  tenant_contact_numbers: ["+966501234567", "+966507654321"],
  meter_numbers: ["EL-001", "W-001"],
  description: "Modern 2-bedroom apartment with city view",
  is_furnished: true,
  parking_spaces: 1,
  service_charge: 200
});
```

### Retrieving Sub-Properties

```typescript
// Get all sub-properties for a building
const subProperties = await subPropertiesApi.getByParentProperty("building-uuid");

// Get specific sub-property details
const subProperty = await subPropertiesApi.getById("apartment-uuid");
```

## Business Rules

### 1. **Contract Management**
- Contract duration limited to 1-5 years
- Payment frequency must be specified
- Contract PDF is mandatory
- Base price and rent amount are required

### 2. **Contact Requirements**
- At least one tenant contact number required
- Primary contact designation for main tenant
- Additional contacts can be added with + button

### 3. **Meter Tracking**
- Meter numbers are optional
- Multiple meters supported per sub-property
- Meter types: electricity, water, gas, internet, utility

### 4. **Data Integrity**
- Sub-properties cannot be deleted with active contracts
- Parent property relationship maintained
- All related records (meters, contacts, documents) properly linked

## Security & Permissions

### Row Level Security (RLS)
- Users can only view/edit sub-properties for properties they own or manage
- Admin and manager roles have full access
- Property owners can manage their own sub-properties

### Data Validation
- Required field validation
- Data type validation
- Business rule enforcement
- Contract duration limits

## Integration Points

### 1. **Property Management**
- Links to parent properties
- Inherits location and basic property information
- Maintains property hierarchy

### 2. **Contract System**
- Automatic contract creation
- Payment frequency integration
- Duration tracking
- Document management

### 3. **Financial System**
- Base price tracking
- Rent amount management
- Service charge integration
- Payment scheduling

### 4. **Document Management**
- Contract PDF storage
- Document tagging and categorization
- Relationship tracking

## Future Enhancements

### 1. **Advanced Metering**
- Meter reading history
- Consumption analytics
- Utility cost calculations
- Automated billing integration

### 2. **Contract Management**
- Contract renewal workflows
- Payment schedule management
- Late fee calculations
- Tenant communication tools

### 3. **Reporting & Analytics**
- Sub-property performance metrics
- Occupancy rate tracking
- Revenue analysis by unit
- Maintenance cost tracking

### 4. **Mobile Features**
- QR code scanning for meter readings
- Photo documentation
- Offline data collection
- Push notifications for updates

## Technical Implementation

### Dependencies
- React Native Paper for UI components
- Expo Document Picker for PDF uploads
- Lucide React Native for icons
- Custom theme system for styling
- RTL support for Arabic language

### Performance Considerations
- Efficient database queries with proper indexing
- Lazy loading for large sub-property lists
- Optimized re-renders with useCallback and useMemo
- Proper error handling and loading states

### Testing
- Component unit tests
- API integration tests
- Form validation tests
- User interaction tests

## Conclusion

The Sub-Property Management System provides a comprehensive solution for managing individual units within larger properties. It addresses all the required fields specified in the requirements while maintaining flexibility for optional features. The system is designed with scalability, security, and user experience in mind, making it suitable for both small property managers and large real estate companies.







