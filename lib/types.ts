// User types
export type UserRole = 'admin' | 'manager' | 'owner' | 'tenant' | 'buyer' | 'staff';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone_number?: string;
  created_at: string;
  avatar_url?: string;
}

// Security Context Types
export interface UserContext {
  userId: string;
  role: UserRole;
  profileType?: string;
  isAuthenticated: boolean;
  ownedPropertyIds?: string[];
  rentedPropertyIds?: string[];
}

export interface SecurityConfig {
  enableRoleBasedAccess: boolean;
  bypassForAdmin: boolean;
  logAccessAttempts: boolean;
}

// Property types
export type PropertyStatus = 'available' | 'rented' | 'maintenance' | 'reserved';
export type PropertyType = 'apartment' | 'villa' | 'office' | 'retail' | 'warehouse';
export type PaymentMethod = 'cash' | 'installment';

export interface Property {
  id: string;
  title: string;
  description: string;
  property_type: PropertyType;
  status: PropertyStatus;
  address: string;
  city: string;
  country: string;
  neighborhood: string;
  area_sqm: number;
  bedrooms?: number;
  bathrooms?: number;
  price: number;
  payment_method: PaymentMethod;
  owner_id: string;
  created_at: string;
  updated_at: string;
  images: string[];
}

// Financial types
export type VoucherType = 'receipt' | 'payment' | 'journal';
export type VoucherStatus = 'draft' | 'posted' | 'cancelled';

export interface Voucher {
  id: string;
  voucher_type: VoucherType;
  voucher_number: string;
  amount: number;
  currency: string;
  status: VoucherStatus;
  description: string;
  property_id?: string;
  tenant_id?: string;
  owner_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  property_id: string;
  tenant_id: string;
  amount: number;
  vat_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  description: string;
  created_at: string;
  updated_at: string;
}

// Maintenance types
export type MaintenanceStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceRequest {
  id: string;
  property_id: string;
  tenant_id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  images?: string[];
}

export interface WorkOrder {
  id: string;
  maintenance_request_id: string;
  assigned_to: string;
  description: string;
  estimated_cost: number;
  actual_cost?: number;
  start_date: string;
  completion_date?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Contract types
export interface Contract {
  id: string;
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  payment_frequency: 'monthly' | 'quarterly' | 'biannually' | 'annually';
  security_deposit: number;
  is_foreign_tenant: boolean;
  status: 'active' | 'expired' | 'terminated' | 'renewal';
  created_at: string;
  updated_at: string;
  documents?: string[];
}