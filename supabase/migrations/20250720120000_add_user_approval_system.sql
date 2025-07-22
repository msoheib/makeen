/*
  # User Approval System for Property Managers

  1. New Fields
    - Add status field to profiles table for user approval workflow
    - Add approved_by and approved_at fields for tracking

  2. New Tables
    - user_approvals: Track approval history and actions
    - audit_logs: Track manager actions for compliance

  3. Security
    - Add RLS policies for approval workflows
    - Restrict approval actions to managers only

  4. Features
    - User status tracking (pending, approved, rejected)
    - Approval history and audit trail
    - Manager action logging
*/

-- Add status and approval fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_reason text,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Create user approvals tracking table
CREATE TABLE user_approvals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('approved', 'rejected', 'reactivated', 'deactivated')),
  performed_by uuid NOT NULL REFERENCES profiles(id),
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create audit logs table for manager actions
CREATE TABLE audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  performed_by uuid NOT NULL REFERENCES profiles(id),
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_role_status ON profiles(role, status);
CREATE INDEX idx_user_approvals_user_id ON user_approvals(user_id);
CREATE INDEX idx_user_approvals_performed_by ON user_approvals(performed_by);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by);

-- Enable RLS on new tables
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_approvals table
CREATE POLICY "Managers can view all approval records" ON user_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can insert approval records" ON user_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
    AND performed_by = auth.uid()
  );

-- RLS Policies for audit_logs table  
CREATE POLICY "Managers can view all audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Update existing profiles to have approved status for existing users
UPDATE profiles 
SET status = 'approved', approved_at = now()
WHERE status IS NULL OR status = 'pending';

-- Create function to automatically log user approval actions
CREATE OR REPLACE FUNCTION log_user_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Log approval/rejection actions
  IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO user_approvals (user_id, action, performed_by, reason)
    VALUES (
      NEW.id,
      NEW.status,
      NEW.approved_by,
      NEW.rejected_reason
    );
    
    -- Also log in audit table
    INSERT INTO audit_logs (action_type, entity_type, entity_id, performed_by, details)
    VALUES (
      'user_' || NEW.status,
      'profile',
      NEW.id,
      NEW.approved_by,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'reason', NEW.rejected_reason
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user approval logging
CREATE TRIGGER trigger_log_user_approval
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_user_approval();

-- Create function to soft delete users
CREATE OR REPLACE FUNCTION soft_delete_user(user_id uuid, deleted_by uuid)
RETURNS void AS $$
BEGIN
  -- Update user status to inactive and set deleted_at
  UPDATE profiles 
  SET status = 'inactive', 
      deleted_at = now()
  WHERE id = user_id;
  
  -- Log the deletion
  INSERT INTO audit_logs (action_type, entity_type, entity_id, performed_by, details)
  VALUES (
    'user_deleted',
    'profile', 
    user_id,
    deleted_by,
    jsonb_build_object('deleted_at', now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for managers to approve users
CREATE OR REPLACE FUNCTION approve_user(user_id uuid, manager_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if the manager has permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = manager_id 
    AND role IN ('admin', 'manager')
    AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Only approved managers can approve users';
  END IF;
  
  -- Update user status
  UPDATE profiles 
  SET status = 'approved',
      approved_by = manager_id,
      approved_at = now(),
      rejected_reason = NULL
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for managers to reject users
CREATE OR REPLACE FUNCTION reject_user(user_id uuid, manager_id uuid, reason text)
RETURNS void AS $$
BEGIN
  -- Check if the manager has permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = manager_id 
    AND role IN ('admin', 'manager')
    AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Only approved managers can reject users';
  END IF;
  
  -- Update user status
  UPDATE profiles 
  SET status = 'rejected',
      approved_by = manager_id,
      approved_at = now(),
      rejected_reason = reason
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;