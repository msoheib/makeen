# Real Estate Management System - Product Requirements Document
## Version 2.0 - December 2024

---

## 1. Executive Summary

### 1.1 Project Overview
A comprehensive real estate management mobile application built with **Expo React Native** and **Supabase**, featuring complete property portfolio management, bidding workflows, financial tracking, maintenance operations, user approval systems, and real-time analytics for the Saudi Arabian real estate market.

### 1.2 Technology Stack
- **Frontend**: Expo React Native with TypeScript
- **Backend**: Supabase (PostgreSQL 15.8, Auth, Realtime, Storage)
- **UI Framework**: React Native Paper (Material Design 3)
- **Navigation**: React Navigation with Drawer + Tab structure
- **State Management**: Custom hooks with Zustand store
- **Database**: 18 tables with comprehensive relationship mapping

### 1.3 Target Users
- **Property Managers**: Complete portfolio oversight and transaction approval
- **Property Owners**: Asset management and bid evaluation  
- **Tenants**: Property search, bidding, and rental management
- **Buyers**: Property discovery, purchase bidding, and ownership transition
- **Administrators**: System configuration and user management

---

## 2. Core System Features

### 2.1 User Management & Authentication
- **Multi-role System**: Admin, Manager, Owner, Tenant, Buyer profiles
- **Approval Workflows**: Manager-approved user registrations
- **KYC Integration**: Identity verification and credit scoring
- **Role Transitions**: Automatic buyer-to-owner promotion upon purchase
- **Profile Management**: Comprehensive user information with documents

### 2.2 Property Management
- **Property Listings**: Comprehensive property database with rich metadata
- **Dual Listing Types**: Rental, sale, or both simultaneously
- **Status Tracking**: Available, rented, maintenance, reserved states
- **Geographic Organization**: City, neighborhood, and building management
- **Media Management**: Multiple property images and documents
- **Owner Relations**: Property-owner linking with transfer capabilities

### 2.3 Bidding System (NEW)
- **Dual Bid Types**: Rental and purchase bidding
- **Approval Workflow**: Manager approval → Owner approval → Transaction
- **Bid Management**: Expiration dates, bid increments, auto-acceptance thresholds
- **Real-time Tracking**: Bid status monitoring and notifications
- **Financial Integration**: Security deposits and payment processing

### 2.4 Transaction Management (NEW)
- **Sale Transactions**: Complete property purchase workflow
- **Rental Transactions**: Lease agreement processing
- **Ownership Transfers**: Automated property ownership updates
- **Contract Generation**: Automatic contract creation from accepted bids
- **Transaction History**: Complete audit trail of all property transfers

### 2.5 Financial Management
- **Chart of Accounts**: Comprehensive accounting structure
- **Voucher System**: Receipt, payment, and journal entry vouchers
- **Invoice Management**: VAT invoice generation and tracking
- **Cost Center Allocation**: Expense categorization and tracking
- **Financial Reporting**: Real-time revenue, expense, and profitability analysis

### 2.6 Maintenance Operations
- **Request Management**: Tenant-submitted maintenance requests
- **Work Order System**: Contractor assignment and tracking
- **Cost Tracking**: Estimated vs actual maintenance costs
- **Priority Classification**: Urgent, high, medium, low priority levels
- **Documentation**: Photo attachments and progress updates

### 2.7 Communication System
- **Document Management**: File upload, categorization, and archive
- **Letter System**: Formal communication templates and tracking
- **Issue Management**: Complaint and dispute tracking
- **Notification Center**: Real-time updates and alerts

### 2.8 Reporting & Analytics
- **Financial Reports**: Revenue, expense, and profitability analysis
- **Property Performance**: Occupancy rates, ROI calculations
- **Tenant Analytics**: Payment history and demographic insights
- **Maintenance Reports**: Cost analysis and request distribution
- **Dashboard Metrics**: Real-time KPIs and summary statistics

---

## 3. Database Schema Overview

### 3.1 Core Tables (18 Total)

#### User Management
- **`profiles`** - User accounts with roles and approval status
- **`user_approvals`** - Generic approval workflow system

#### Property Management  
- **`properties`** - Property listings with bidding capabilities
- **`property_reservations`** - Booking and reservation system
- **`contracts`** - Rental and sales agreements
- **`clients`** - External customer and supplier management

#### Bidding & Transactions (NEW)
- **`bids`** - Property bidding with dual approval workflow
- **`property_transactions`** - Completed sales and rental transactions

#### Financial System
- **`vouchers`** - Financial voucher management
- **`invoices`** - VAT invoice system
- **`accounts`** - Chart of accounts structure
- **`cost_centers`** - Cost allocation management
- **`fixed_assets`** - Asset tracking and depreciation

#### Operations
- **`maintenance_requests`** - Maintenance ticket system
- **`work_orders`** - Contractor work assignments
- **`documents`** - File management and archive
- **`letters`** - Communication tracking
- **`issues`** - Issue and complaint management

### 3.2 Key Relationships
- Properties ↔ Owners (profiles)
- Bids ↔ Properties ↔ Users
- Transactions ↔ Bids ↔ Contracts
- Maintenance ↔ Properties ↔ Work Orders
- Vouchers ↔ Accounts ↔ Properties

---

## 4. Complete Application Views & Pages

### 4.1 Navigation Structure
```
App Root
├── Authentication
│   ├── Login Screen
│   ├── Register Screen  
│   └── Password Reset
│
├── Main Drawer Navigation
│   ├── Dashboard (Tab Navigator Entry)
│   └── Sidebar Menu (All Features)
│
└── Tab Navigator (Bottom Navigation)
    ├── Dashboard
    ├── Properties  
    ├── Tenants
    ├── Documents
    ├── Reports
    └── Settings
```

### 4.2 Dashboard & Analytics
- **`app/(drawer)/(tabs)/index.tsx`** - Main dashboard with KPIs
- **Components**: RentCard, CashflowCard, StatCard with real-time data

### 4.3 Property Management
- **`app/(drawer)/(tabs)/properties.tsx`** - Property listings and statistics
- **`app/properties/add.tsx`** - New property creation form
- **`app/properties/[id].tsx`** - Property detail view
- **`app/properties/[id]/edit.tsx`** - Property editing interface
- **`app/properties/[id]/bids.tsx`** - Property bid management (NEW)

### 4.4 Bidding System (NEW)
- **`app/bids/create.tsx`** - Bid submission form
- **`app/bids/[id].tsx`** - Bid detail and status tracking
- **`app/bids/manage.tsx`** - Manager bid approval interface
- **`app/bids/owner.tsx`** - Owner bid evaluation dashboard

### 4.5 User Management
- **`app/(drawer)/(tabs)/tenants.tsx`** - Tenant directory and management
- **`app/tenants/[id].tsx`** - Individual tenant profiles
- **`app/tenants/[id]/edit.tsx`** - Tenant information editing
- **`app/people/add.tsx`** - Multi-role user creation
- **`app/approvals/manage.tsx`** - User approval dashboard (NEW)

### 4.6 Financial Management
- **`app/(drawer)/(tabs)/payments.tsx`** - Payment processing interface
- **`app/finance/vouchers/add.tsx`** - Voucher creation (receipt, payment, journal)
- **`app/finance/vouchers/[id].tsx`** - Voucher details and editing
- **`app/finance/invoices/create.tsx`** - VAT invoice generation
- **`app/finance/invoices/[id].tsx`** - Invoice management
- **`app/finance/accounts.tsx`** - Chart of accounts management

### 4.7 Maintenance Operations
- **`app/maintenance/add.tsx`** - Maintenance request submission
- **`app/maintenance/requests.tsx`** - Request listing and filtering
- **`app/maintenance/[id].tsx`** - Request details and updates
- **`app/maintenance/work-orders.tsx`** - Work order management
- **`app/maintenance/work-orders/[id].tsx`** - Work order tracking

### 4.8 Communications
- **`app/(drawer)/(tabs)/documents.tsx`** - Document archive and search
- **`app/documents/[id].tsx`** - Document viewer with interaction
- **`app/documents/upload.tsx`** - File upload interface
- **`app/letters/create.tsx`** - Letter composition
- **`app/letters/[id].tsx`** - Letter details and status
- **`app/issues/create.tsx`** - Issue reporting
- **`app/issues/[id].tsx`** - Issue tracking and resolution

### 4.9 Reporting & Analytics
- **`app/(drawer)/(tabs)/reports.tsx`** - Report dashboard with 6 real-time reports
- **`app/reports/revenue.tsx`** - Detailed revenue analysis
- **`app/reports/expenses.tsx`** - Expense breakdown and trends
- **`app/reports/properties.tsx`** - Property performance metrics
- **`app/reports/tenants.tsx`** - Tenant analytics and insights
- **`app/reports/maintenance.tsx`** - Maintenance cost analysis

### 4.10 Settings & Configuration
- **`app/(drawer)/(tabs)/settings.tsx`** - Main settings dashboard
- **`app/profile/index.tsx`** - User profile management
- **`app/notifications/index.tsx`** - Notification preferences
- **`app/language/index.tsx`** - Language selection
- **`app/theme/index.tsx`** - Theme switching (light/dark)
- **`app/currency/index.tsx`** - Currency display settings
- **`app/support/index.tsx`** - Contact support interface
- **`app/terms/index.tsx`** - Terms of service
- **`app/privacy/index.tsx`** - Privacy policy

### 4.11 Transaction Management (NEW)
- **`app/transactions/list.tsx`** - Transaction history
- **`app/transactions/[id].tsx`** - Transaction details
- **`app/transactions/approve.tsx`** - Manager transaction approval

---

## 5. User Workflows

### 5.1 Property Bidding Workflow
1. **Tenant/Buyer** browses available properties
2. **User** submits bid with message and expiration
3. **Manager** reviews and approves bid
4. **Owner** evaluates approved bids
5. **Owner** accepts/rejects bid
6. **System** creates transaction and contract
7. **Automated** role transition (buyer → owner if applicable)

### 5.2 User Approval Workflow
1. **New User** registers with required documents
2. **System** creates pending approval request
3. **Manager** reviews KYC documents and information
4. **Manager** approves/rejects with notes
5. **User** receives notification of status
6. **Approved users** gain bidding capabilities

### 5.3 Property Listing Workflow
1. **Owner** submits property for listing
2. **System** creates property approval request
3. **Manager** reviews property details and documents
4. **Manager** approves listing with configuration
5. **Property** becomes available for bidding
6. **System** activates bid acceptance

### 5.4 Transaction Completion Workflow
1. **Accepted bid** triggers transaction creation
2. **System** generates contract from bid details
3. **Parties** complete necessary documentation
4. **Manager** finalizes transaction approval
5. **System** updates property ownership/status
6. **Financial records** automatically created

---

## 6. Business Rules & Validation

### 6.1 Bidding Rules
- Minimum bid increment enforcement
- Bid expiration date validation
- Auto-acceptance threshold processing
- Manager approval required before owner review
- Single active bid per user per property

### 6.2 User Management Rules
- Email uniqueness across all profiles
- Role-based permission enforcement
- Approval status determines system access
- KYC verification for financial transactions
- Automatic role transitions based on activities

### 6.3 Property Management Rules
- Owner-only property editing permissions
- Manager approval for all new listings
- Status consistency across related entities
- Bid acceptance disables further bidding
- Property transfer updates all relationships

### 6.4 Financial Rules
- Posted voucher immutability
- Account code validation against chart
- VAT calculation automation
- Cost center allocation requirements
- Financial period consistency

---

## 7. Technical Architecture

### 7.1 API Layer Structure
```typescript
// Core API modules
- propertiesApi: Property CRUD and search
- profilesApi: User management and roles
- bidsApi: Bidding system operations (NEW)
- transactionsApi: Transaction processing (NEW)
- approvalsApi: Approval workflow management (NEW)
- financialApi: Vouchers, invoices, accounts
- maintenanceApi: Requests and work orders
- communicationsApi: Documents, letters, issues
- reportsApi: Analytics and insights
```

### 7.2 Database Optimizations
- Comprehensive indexing for performance
- Foreign key constraints for data integrity
- Check constraints for business rules
- Triggers for automated workflows
- Row-level security policies (future)

### 7.3 State Management
- Custom useApi hooks for data fetching
- Zustand store for settings and preferences
- Local state for form management
- Real-time subscriptions for live updates

---

## 8. Security & Compliance

### 8.1 Authentication & Authorization
- Supabase Auth integration
- Role-based access control
- Session management
- Password requirements
- Account lockout policies

### 8.2 Data Security
- Encrypted data transmission
- Database access restrictions
- Audit trail maintenance
- Document access controls
- Financial data protection

### 8.3 Saudi Market Compliance
- Arabic language support infrastructure
- SAR currency handling
- Local business requirements
- Cultural UI considerations
- Privacy policy compliance

---

## 9. Performance Requirements

### 9.1 Response Times
- Dashboard load: < 2 seconds
- Property search: < 1 second
- Report generation: < 5 seconds
- Real-time notifications: < 500ms
- Document viewing: < 3 seconds

### 9.2 Scalability Targets
- Support 10,000+ properties
- Handle 1,000+ concurrent users
- Process 100+ daily transactions
- Store 50,000+ documents
- Generate real-time analytics

---

## 10. Future Enhancements

### 10.1 Phase 2 Features
- Real-time notifications system
- Advanced chart visualizations
- Export capabilities (PDF, Excel)
- Mobile payment integration
- Property photo galleries

### 10.2 Phase 3 Features
- Property valuation automation
- AI-powered matching algorithms
- Integrated background checks
- Multi-language full support
- White-label customization

---

## 11. Testing Strategy

### 11.1 Current Testing Coverage
- API integration testing
- Database relationship validation
- User workflow testing
- UI component testing
- Error handling verification

### 11.2 Testing Environments
- Development: Local Supabase instance
- Staging: Shared Supabase project
- Production: Dedicated Supabase project
- Testing data: Comprehensive sample dataset

---

**Document Version**: 2.0  
**Last Updated**: December 2024  
**Next Review**: January 2025  
**Status**: Current Implementation Complete 