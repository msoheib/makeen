# Real Estate Management System - User Role Flows
## Three Primary User Journeys with Bidding & Approval Workflows

---

## Database Schema Overview

Based on the current Supabase database (18 tables):

### Core Tables for Role Management:
- **`profiles`** - User accounts with roles (tenant, owner, buyer, manager)
- **`properties`** - Property listings with bidding capabilities
- **`bids`** - Property bidding system (rental & purchase)
- **`property_transactions`** - Completed transactions
- **`user_approvals`** - User signup and transaction approvals
- **`contracts`** - Rental agreements
- **`maintenance_requests`** - Maintenance tickets from tenants
- **`work_orders`** - Work orders for property maintenance

### Role Status Fields:
- **`approval_status`** - pending, approved, rejected, suspended
- **`can_bid`** - boolean flag for bidding eligibility
- **`kyc_status`** - pending, verified, rejected

---

## 1. TENANT USER FLOW

### 1.1 Tenant Registration & Approval Process

**Flow:** Guest → Pending Tenant → Approved Tenant → Active Bidder

#### **Step 1: User Signup**
```sql
-- Insert new tenant profile
INSERT INTO profiles (
    first_name, last_name, email, phone, address, city, country,
    role, profile_type, approval_status, can_bid, kyc_status
) VALUES (
    'Ahmed', 'Al-Mansouri', 'ahmed.tenant@email.com', '+966501234567',
    '123 King Fahd Road', 'Riyadh', 'Saudi Arabia',
    'tenant', 'tenant', 'pending', false, 'pending'
);

-- Create approval request
INSERT INTO user_approvals (
    approval_type, requested_by, related_entity_type, related_entity_id,
    expires_at, priority_level
) VALUES (
    'user_signup', [new_user_id], 'profile', [new_user_id],
    now() + interval '7 days', 'normal'
);
```

#### **Step 2: Manager Approval**
```sql
-- Manager approves tenant
UPDATE profiles 
SET approval_status = 'approved', 
    approved_by = [manager_id],
    approval_date = now(),
    can_bid = true,
    kyc_status = 'verified'
WHERE id = [tenant_id];

-- Update approval record
UPDATE user_approvals 
SET approval_status = 'approved',
    approved_by = [manager_id],
    approval_date = now(),
    approval_notes = 'Tenant documents verified and approved'
WHERE related_entity_id = [tenant_id] AND approval_type = 'user_signup';
```

### 1.2 Tenant Property Browsing & Bidding

#### **View Available Rental Properties**
```sql
-- Get properties available for rent
SELECT 
    p.id, p.title, p.description, p.property_type, p.address, p.city,
    p.price, p.annual_rent, p.bedrooms, p.bathrooms, p.is_furnished,
    p.minimum_bid_amount, p.maximum_bid_amount, p.is_accepting_bids,
    owner.first_name || ' ' || owner.last_name as owner_name,
    owner.phone as owner_phone
FROM properties p
LEFT JOIN profiles owner ON p.owner_id = owner.id
WHERE p.status = 'available' 
    AND p.approval_status = 'approved'
    AND p.is_accepting_bids = true
    AND (p.listing_type = 'rent' OR p.listing_type = 'both')
    AND p.listing_expires_at > now()
ORDER BY p.created_at DESC;
```

#### **Submit Rental Bid**
```sql
-- Tenant submits bid for rental property
INSERT INTO bids (
    property_id, bidder_id, bid_type, bid_amount, 
    rental_duration_months, security_deposit_amount,
    utilities_included, message, expires_at
) VALUES (
    [property_id], [tenant_id], 'rental', 4500,
    12, 9000, true, 
    'Experienced tenant with excellent references. Long-term rental needed.',
    now() + interval '48 hours'
);
```

### 1.3 Tenant Maintenance Requests

#### **Create Maintenance Request**
```sql
-- Tenant creates maintenance request for their rented property
INSERT INTO maintenance_requests (
    property_id, tenant_id, title, description, priority, images
) VALUES (
    [property_id], [tenant_id], 
    'AC Unit Not Working', 
    'The air conditioning unit in the master bedroom stopped working yesterday. Room is very hot.',
    'high',
    ARRAY['ac_issue_photo1.jpg', 'ac_issue_photo2.jpg']
);
```

#### **View My Maintenance Requests**
```sql
-- Get tenant's maintenance requests with property info
SELECT 
    mr.id, mr.title, mr.description, mr.status, mr.priority,
    mr.created_at, mr.updated_at,
    p.title as property_title, p.address,
    wo.status as work_order_status, wo.estimated_cost, wo.completion_date
FROM maintenance_requests mr
LEFT JOIN properties p ON mr.property_id = p.id
LEFT JOIN work_orders wo ON wo.maintenance_request_id = mr.id
WHERE mr.tenant_id = [tenant_id]
ORDER BY mr.created_at DESC;
```

---

## 2. PROPERTY OWNER FLOW

### 2.1 Property Owner - List Properties

#### **Add New Property Listing**
```sql
-- Owner lists new property for rent/sale
INSERT INTO properties (
    title, description, property_type, address, city, country,
    area_sqm, bedrooms, bathrooms, price, annual_rent,
    owner_id, listing_type, is_accepting_bids,
    minimum_bid_amount, maximum_bid_amount, bid_increment,
    listing_expires_at, amenities, is_furnished
) VALUES (
    'Modern Villa in Al-Nakheel District',
    'Spacious 4-bedroom villa with private garden and pool',
    'villa', '456 Al-Nakheel Street', 'Riyadh', 'Saudi Arabia',
    450, 4, 3, 1200000, 80000, [owner_id],
    'both', true, 960000, 1440000, 10000,
    now() + interval '90 days',
    ARRAY['pool', 'garden', 'garage', 'maid_room', 'central_ac'],
    false
);

-- Property requires manager approval
INSERT INTO user_approvals (
    approval_type, requested_by, related_entity_type, related_entity_id,
    expires_at
) VALUES (
    'property_listing', [owner_id], 'property', [new_property_id],
    now() + interval '3 days'
);
```

### 2.2 Property Owner - Manage Maintenance Issues

#### **View Maintenance Requests for My Properties**
```sql
-- Get all maintenance requests for owner's properties
SELECT 
    mr.id, mr.title, mr.description, mr.status, mr.priority,
    mr.created_at,
    p.title as property_title, p.address,
    tenant.first_name || ' ' || tenant.last_name as tenant_name,
    tenant.phone as tenant_phone
FROM maintenance_requests mr
JOIN properties p ON mr.property_id = p.id
LEFT JOIN profiles tenant ON mr.tenant_id = tenant.id
WHERE p.owner_id = [owner_id]
    AND mr.status IN ('pending', 'approved', 'in_progress')
ORDER BY 
    CASE mr.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2  
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    mr.created_at DESC;
```

#### **Create Work Order for Maintenance**
```sql
-- Owner creates work order to address maintenance request
INSERT INTO work_orders (
    maintenance_request_id, assigned_to, description,
    estimated_cost, start_date, status
) VALUES (
    [maintenance_request_id], [contractor_id],
    'Replace faulty AC unit in master bedroom. Includes removal of old unit and installation of new 2-ton split AC.',
    2500, now() + interval '2 days',
    'assigned'
);

-- Update maintenance request status
UPDATE maintenance_requests 
SET status = 'approved' 
WHERE id = [maintenance_request_id];
```

### 2.3 Property Owner - Bid on Other Properties

#### **Browse Properties for Purchase**
```sql
-- Owner can also be a buyer for other properties
SELECT 
    p.id, p.title, p.description, p.property_type, p.address, p.city,
    p.price, p.bedrooms, p.bathrooms, p.area_sqm,
    p.minimum_bid_amount, p.maximum_bid_amount, p.is_accepting_bids,
    seller.first_name || ' ' || seller.last_name as seller_name
FROM properties p
LEFT JOIN profiles seller ON p.owner_id = seller.id
WHERE p.status = 'available' 
    AND p.approval_status = 'approved'
    AND p.is_accepting_bids = true
    AND (p.listing_type = 'sale' OR p.listing_type = 'both')
    AND p.owner_id != [current_owner_id]  -- Can't buy own property
ORDER BY p.price ASC;
```

#### **Submit Purchase Bid**
```sql
-- Property owner bids to buy another property
INSERT INTO bids (
    property_id, bidder_id, bid_type, bid_amount, 
    message, expires_at
) VALUES (
    [property_id], [owner_id], 'purchase', 1150000,
    'Cash buyer, ready to complete transaction within 30 days.',
    now() + interval '72 hours'
);
```

### 2.4 Property Owner - Manage Bids on Their Properties

#### **View Bids on My Properties**
```sql
-- Get all bids on owner's properties
SELECT 
    b.id, b.bid_type, b.bid_amount, b.bid_status,
    b.message, b.created_at, b.expires_at,
    b.rental_duration_months, b.security_deposit_amount,
    p.title as property_title, p.address,
    bidder.first_name || ' ' || bidder.last_name as bidder_name,
    bidder.phone as bidder_phone,
    bidder.kyc_status, bidder.credit_score
FROM bids b
JOIN properties p ON b.property_id = p.id
LEFT JOIN profiles bidder ON b.bidder_id = bidder.id
WHERE p.owner_id = [owner_id]
    AND b.bid_status IN ('pending', 'manager_approved')
ORDER BY b.created_at DESC;
```

#### **Accept/Reject Bid**
```sql
-- Owner accepts a bid
UPDATE bids 
SET bid_status = 'owner_approved',
    owner_approved = true,
    owner_approval_date = now(),
    owner_response_message = 'Bid accepted. Please proceed with contract preparation.'
WHERE id = [bid_id] AND property_id IN (
    SELECT id FROM properties WHERE owner_id = [owner_id]
);

-- Create property transaction record
INSERT INTO property_transactions (
    property_id, transaction_type, transaction_amount,
    buyer_id, tenant_id, previous_owner_id, bid_id,
    transaction_status
) VALUES (
    [property_id], 
    CASE WHEN [bid_type] = 'purchase' THEN 'sale' ELSE 'rental' END,
    [bid_amount],
    CASE WHEN [bid_type] = 'purchase' THEN [bidder_id] ELSE NULL END,
    CASE WHEN [bid_type] = 'rental' THEN [bidder_id] ELSE NULL END,
    [owner_id], [bid_id], 'pending'
);
```

---

## 3. BUYER USER FLOW

### 3.1 Buyer Registration & Approval

**Flow:** Guest → Pending Buyer → Approved Buyer → Property Owner (after first purchase)

#### **Step 1: Buyer Signup**
```sql
-- Insert new buyer profile
INSERT INTO profiles (
    first_name, last_name, email, phone, address, city, country,
    role, profile_type, approval_status, can_bid, kyc_status
) VALUES (
    'Fahad', 'Al-Otaibi', 'fahad.buyer@email.com', '+966509876543',
    '789 Prince Mohammed Road', 'Jeddah', 'Saudi Arabia',
    'buyer', 'buyer', 'pending', false, 'pending'
);
```

#### **Step 2: Manager Approval for Buyer**
```sql
-- Manager approves buyer
UPDATE profiles 
SET approval_status = 'approved', 
    approved_by = [manager_id],
    approval_date = now(),
    can_bid = true,
    kyc_status = 'verified'
WHERE id = [buyer_id] AND role = 'buyer';
```

### 3.2 Buyer Property Search & Bidding

#### **Browse Properties for Sale**
```sql
-- Get properties available for purchase
SELECT 
    p.id, p.title, p.description, p.property_type, p.address, p.city,
    p.price, p.bedrooms, p.bathrooms, p.area_sqm, p.amenities,
    p.minimum_bid_amount, p.maximum_bid_amount, p.is_accepting_bids,
    seller.first_name || ' ' || seller.last_name as seller_name,
    seller.phone as seller_phone
FROM properties p
LEFT JOIN profiles seller ON p.owner_id = seller.id
WHERE p.status = 'available' 
    AND p.approval_status = 'approved'
    AND p.is_accepting_bids = true
    AND (p.listing_type = 'sale' OR p.listing_type = 'both')
    AND p.listing_expires_at > now()
ORDER BY p.price ASC;
```

#### **Submit Purchase Bid**
```sql
-- Buyer submits bid for property purchase
INSERT INTO bids (
    property_id, bidder_id, bid_type, bid_amount, 
    message, expires_at
) VALUES (
    [property_id], [buyer_id], 'purchase', 950000,
    'First-time buyer, pre-approved for financing. Serious about purchasing.',
    now() + interval '48 hours'
);
```

### 3.3 Buyer to Owner Transition (Automatic)

#### **Transaction Completion Trigger**
```sql
-- This trigger function automatically converts buyer to owner upon first purchase
CREATE OR REPLACE FUNCTION update_buyer_to_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- When a buyer completes their first property purchase, change their role to owner
    IF NEW.transaction_type = 'sale' AND NEW.transaction_status = 'completed' THEN
        UPDATE profiles 
        SET role = 'owner', profile_type = 'owner'
        WHERE id = NEW.buyer_id 
          AND role = 'buyer'
          AND NOT EXISTS (
              SELECT 1 FROM property_transactions 
              WHERE buyer_id = NEW.buyer_id 
                AND transaction_type = 'sale' 
                AND transaction_status = 'completed'
                AND id != NEW.id
          );
        
        -- Transfer property ownership
        UPDATE properties 
        SET owner_id = NEW.buyer_id
        WHERE id = NEW.property_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3.4 New Property Owner Capabilities

#### **After First Purchase - Full Owner Access**
Once the buyer completes their first property purchase:

1. **Role Change**: `buyer` → `owner`
2. **Property Ownership**: Property `owner_id` updated to new owner
3. **Full Owner Capabilities**: 
   - List new properties
   - Manage maintenance requests
   - Accept/reject bids on their properties
   - Bid on other properties (as owner)

---

## 4. PROPERTY MANAGER WORKFLOW

### 4.1 User Approval Dashboard

#### **View Pending User Approvals**
```sql
-- Get all pending user signup approvals
SELECT 
    ua.id, ua.approval_type, ua.created_at, ua.expires_at,
    ua.priority_level,
    p.first_name || ' ' || p.last_name as user_name,
    p.email, p.phone, p.role, p.kyc_status
FROM user_approvals ua
JOIN profiles p ON ua.related_entity_id = p.id
WHERE ua.approval_status = 'pending'
    AND ua.approval_type = 'user_signup'
ORDER BY ua.priority_level, ua.created_at;
```

#### **Approve/Reject User**
```sql
-- Manager approves user
UPDATE profiles 
SET approval_status = 'approved',
    approved_by = [manager_id],
    approval_date = now(),
    can_bid = true,
    kyc_status = 'verified'
WHERE id = [user_id];

UPDATE user_approvals 
SET approval_status = 'approved',
    approved_by = [manager_id],
    approval_date = now(),
    approval_notes = 'User verification completed successfully'
WHERE related_entity_id = [user_id] AND approval_type = 'user_signup';
```

### 4.2 Bid Approval Workflow

#### **View Pending Bid Approvals**
```sql
-- Get bids requiring manager approval
SELECT 
    b.id, b.bid_type, b.bid_amount, b.created_at, b.expires_at,
    p.title as property_title, p.address,
    bidder.first_name || ' ' || bidder.last_name as bidder_name,
    owner.first_name || ' ' || owner.last_name as owner_name
FROM bids b
JOIN properties p ON b.property_id = p.id
LEFT JOIN profiles bidder ON b.bidder_id = bidder.id
LEFT JOIN profiles owner ON p.owner_id = owner.id
WHERE b.bid_status = 'pending'
    AND b.manager_approved = false
ORDER BY b.expires_at ASC;
```

#### **Approve Bid**
```sql
-- Manager approves bid (first stage approval)
UPDATE bids 
SET bid_status = 'manager_approved',
    manager_approved = true,
    manager_approval_date = now(),
    manager_id = [manager_id],
    manager_notes = 'Bid verified and approved for owner review'
WHERE id = [bid_id];
```

### 4.3 Property Listing Approvals

#### **View Pending Property Listings**
```sql
-- Get properties requiring approval
SELECT 
    p.id, p.title, p.address, p.city, p.property_type,
    p.price, p.listing_type, p.created_at,
    owner.first_name || ' ' || owner.last_name as owner_name
FROM properties p
LEFT JOIN profiles owner ON p.owner_id = owner.id
WHERE p.approval_status = 'pending'
ORDER BY p.created_at DESC;
```

#### **Approve Property Listing**
```sql
-- Manager approves property listing
UPDATE properties 
SET approval_status = 'approved',
    approved_by = [manager_id],
    approval_date = now(),
    is_accepting_bids = true
WHERE id = [property_id];
```

---

## 5. API FUNCTIONS TO IMPLEMENT

### 5.1 Authentication & Role Management
```typescript
// lib/api/auth.ts
export const authApi = {
  // Check user role and permissions
  async getUserPermissions(userId: string): Promise<UserPermissions>,
  
  // Role-based access control
  async canUserBid(userId: string): Promise<boolean>,
  async canUserListProperty(userId: string): Promise<boolean>,
  async canUserManageProperty(userId: string, propertyId: string): Promise<boolean>
};
```

### 5.2 User Approval API
```typescript
// lib/api/approvals.ts
export const approvalsApi = {
  // For managers
  async getPendingUserApprovals(): Promise<UserApproval[]>,
  async approveUser(userId: string, managerId: string, notes?: string): Promise<void>,
  async rejectUser(userId: string, managerId: string, reason: string): Promise<void>,
  
  // For property approvals
  async getPendingPropertyApprovals(): Promise<PropertyApproval[]>,
  async approveProperty(propertyId: string, managerId: string): Promise<void>,
  async rejectProperty(propertyId: string, managerId: string, reason: string): Promise<void>
};
```

### 5.3 Bidding System API
```typescript
// lib/api/bidding.ts
export const biddingApi = {
  // For all users
  async getPropertiesForBidding(bidType: 'rental' | 'purchase'): Promise<Property[]>,
  async submitBid(bidData: BidSubmission): Promise<Bid>,
  async getMyBids(userId: string): Promise<Bid[]>,
  
  // For property owners
  async getBidsOnMyProperties(ownerId: string): Promise<Bid[]>,
  async respondToBid(bidId: string, response: 'accept' | 'reject', message?: string): Promise<void>,
  
  // For managers
  async getPendingBidApprovals(): Promise<Bid[]>,
  async approveBid(bidId: string, managerId: string): Promise<void>
};
```

### 5.4 Property Management API
```typescript
// lib/api/properties.ts
export const propertiesApi = {
  // Property listings
  async getPropertiesForRole(role: 'tenant' | 'buyer' | 'owner'): Promise<Property[]>,
  async createProperty(propertyData: PropertyCreation): Promise<Property>,
  async updateProperty(propertyId: string, updates: PropertyUpdate): Promise<Property>,
  
  // For property owners
  async getMyProperties(ownerId: string): Promise<Property[]>,
  async getPropertyAnalytics(propertyId: string): Promise<PropertyAnalytics>
};
```

### 5.5 Maintenance System API
```typescript
// lib/api/maintenance.ts
export const maintenanceApi = {
  // For tenants
  async createMaintenanceRequest(requestData: MaintenanceRequestData): Promise<MaintenanceRequest>,
  async getMyMaintenanceRequests(tenantId: string): Promise<MaintenanceRequest[]>,
  
  // For property owners
  async getMaintenanceRequestsForMyProperties(ownerId: string): Promise<MaintenanceRequest[]>,
  async createWorkOrder(workOrderData: WorkOrderData): Promise<WorkOrder>,
  async updateMaintenanceStatus(requestId: string, status: MaintenanceStatus): Promise<void>
};
```

### 5.6 Transaction Management API
```typescript
// lib/api/transactions.ts
export const transactionsApi = {
  // Transaction flow
  async createTransaction(transactionData: TransactionData): Promise<PropertyTransaction>,
  async updateTransactionStatus(transactionId: string, status: TransactionStatus): Promise<void>,
  async completeTransaction(transactionId: string): Promise<void>,
  
  // For users
  async getMyTransactions(userId: string): Promise<PropertyTransaction[]>,
  async getTransactionHistory(propertyId: string): Promise<PropertyTransaction[]>
};
```

---

## 6. MOBILE APP SCREENS TO IMPLEMENT

### 6.1 Common Screens (All Users)
- **Login/Register** with role selection
- **Dashboard** (role-specific content)
- **Profile Management** with approval status
- **Notification Center** for approvals, bids, maintenance

### 6.2 Tenant-Specific Screens
- **Browse Properties** (rental filter)
- **My Bids** (rental bids status)
- **My Rental** (current rental details)
- **Maintenance Requests** (create & track)

### 6.3 Property Owner Screens
- **My Properties** (list, edit, analytics)
- **Property Bids** (incoming bids management)
- **Maintenance Dashboard** (requests & work orders)
- **Add Property** (listing creation)

### 6.4 Buyer-Specific Screens
- **Browse Properties** (purchase filter)
- **My Purchase Bids** (purchase bids status)
- **Transaction Progress** (purchase progress tracking)

### 6.5 Manager-Only Screens
- **User Approvals** (approve/reject users)
- **Property Approvals** (approve/reject listings)
- **Bid Management** (approve/reject bids)
- **System Analytics** (overall system metrics)

---

## 7. BUSINESS RULES & VALIDATION

### 7.1 User Approval Rules
- New users start with `approval_status = 'pending'`
- Only managers can approve users
- Users cannot bid until approved (`can_bid = true`)
- KYC verification required for high-value transactions

### 7.2 Bidding Rules
- Users must be approved to submit bids
- Bids have expiration times
- Manager approval required before owner sees bid
- Owner can accept/reject manager-approved bids
- Only one active bid per user per property

### 7.3 Role Transition Rules
- Buyer → Owner: Automatic after first successful purchase
- Tenant remains tenant (doesn't auto-promote)
- Owner can also bid as buyer on other properties
- Managers have oversight on all transactions

### 7.4 Property Rules
- Properties require manager approval before listing
- Only approved properties accept bids
- Property owners cannot bid on their own properties
- Properties have bid ranges (min/max amounts)

This comprehensive user flow system provides complete role-based functionality with proper approval workflows, bidding systems, and automatic role transitions while maintaining data integrity and business rule compliance. 