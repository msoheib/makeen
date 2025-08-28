/*
  # Add Accountant Role to Profiles Table
  
  This migration adds a new 'accountant' role to the profiles table
  and updates the role constraint to include it.
  
  The accountant role will have access to:
  - Financial reports and analytics
  - Receipt vouchers
  - Accounts and chart of accounts
  - Utility meters and billing
  - Maintenance pricing
  - Expense/revenue reports
  - Printing functionality
*/

-- Update the role constraint to include 'accountant'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'owner', 'tenant', 'buyer', 'employee', 'contractor', 'accountant'));

-- Add comment to document the new role
COMMENT ON COLUMN profiles.role IS 'User role: admin, manager, owner, tenant, buyer, employee, contractor, or accountant';

-- Create index for accountant role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role_accountant ON profiles(role) WHERE role = 'accountant';

-- Add comment explaining accountant role permissions
COMMENT ON INDEX idx_profiles_role_accountant IS 'Index for accountant role queries - accountants have access to financial data and reports only';
