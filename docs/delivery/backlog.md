# Real Estate Management App - Product Backlog

This document contains all PBIs (Product Backlog Items) for the Real Estate Management App, ordered by priority.

## Product Backlog Items

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
|----|-------|------------|--------|-----------------------------------|
| 1 | Property Manager | As a property manager, I want to view and manage tenant information through a dedicated tenants screen so that I can efficiently handle tenant-related tasks and maintain up-to-date records [View Details](mdc:1/prd.md) | Agreed | - Tenants screen displays all tenants with profiles API integration<br>- Search and filter functionality for tenants<br>- Tenant details view with edit capabilities<br>- Add new tenant functionality<br>- Loading states and error handling implemented<br>- Pull-to-refresh capability |
| 2 | Property Manager | As a property manager, I want to manage maintenance requests and work orders through dedicated screens so that I can efficiently track and resolve property maintenance issues [View Details](mdc:2/prd.md) | Proposed | - Maintenance requests list screen with real data<br>- Add maintenance request form<br>- Work orders management screen<br>- Status tracking for maintenance items<br>- Priority levels and assignment capabilities<br>- Integration with properties and profiles APIs |
| 3 | Accountant | As an accountant, I want to create and manage financial vouchers and invoices so that I can maintain accurate financial records for the real estate business [View Details](mdc:3/prd.md) | Proposed | - Receipt voucher creation form<br>- Payment voucher creation form<br>- Entry voucher creation form<br>- VAT invoice management<br>- Integration with chart of accounts<br>- Financial validation and error handling |
| 4 | Property Manager | As a property manager, I want to view comprehensive reports with real data visualization so that I can make informed business decisions based on accurate analytics [View Details](mdc:4/prd.md) | Proposed | - Financial summary reports with charts<br>- Property performance analytics<br>- Tenant and occupancy reports<br>- Maintenance cost analysis<br>- Revenue and expense tracking<br>- Export capabilities |
| 5 | All Users | As a user, I want to receive real-time notifications about important updates so that I can stay informed about critical events and take timely action [View Details](mdc:5/prd.md) | Proposed | - Real-time notification system implementation<br>- Push notifications for mobile app<br>- In-app notification center<br>- Notification preferences and settings<br>- Integration with Supabase real-time features |
| 6 | All Users | As a user, I want to access and manage comprehensive app settings including profile, notifications, language, theme, and legal documents so that I can customize my app experience and access important information [View Details](mdc:6/prd.md) | InProgress | - Profile management system with edit capabilities<br>- Notification preferences and settings<br>- Language selection (English and Arabic)<br>- Theme switching (light/dark/device controlled)<br>- Currency settings locked to SAR<br>- Contact support functionality (email to configurable address)<br>- Terms of Service and Privacy Policy screens<br>- Removal of Help Center from settings |

## PBI History Log

| Timestamp | PBI_ID | Event_Type | Details | User |
|-----------|--------|------------|---------|------|
| 2024-12-21 18:35:00 | 1 | create_pbi | Created PBI for tenants screen integration | User |
| 2024-12-21 18:35:00 | 2 | create_pbi | Created PBI for maintenance management | User |
| 2024-12-21 18:35:00 | 3 | create_pbi | Created PBI for finance voucher/invoice system | User |
| 2024-12-21 18:35:00 | 4 | create_pbi | Created PBI for reports with data visualization | User |
| 2024-12-21 18:35:00 | 5 | create_pbi | Created PBI for real-time notifications | User |
| 2024-12-21 19:15:00 | 1 | propose_for_backlog | PBI 1 approved and moved to Agreed status | User | 
| 2024-12-21 21:45:00 | 6 | create_pbi | Created PBI for settings system implementation | User |
| 2024-12-21 21:50:00 | 6 | propose_for_backlog | PBI 6 approved and moved to Agreed status | User |
| 2024-12-21 22:00:00 | 6 | start_implementation | PBI 6 moved to InProgress status | User | 