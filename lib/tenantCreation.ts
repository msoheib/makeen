import { createClient } from '@supabase/supabase-js';
import { supabase as mainClient, supabaseUrl } from './supabase';
import { logger, logTenantCreation, withPerformanceLogging } from './structuredLogger';

/**
 * Ephemeral Supabase client for tenant creation
 * This client has session persistence disabled to prevent overwriting the manager's session
 */
const createEphemeralClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * Create a tenant user account without affecting the current manager session
 * @param email - Tenant email
 * @param password - Tenant password
 * @param metadata - User metadata
 * @returns Promise with success/error result
 */
export const createTenantAccount = async (
  email: string,
  password: string,
  metadata: {
    first_name: string;
    last_name: string;
    phone?: string;
    role: string;
  }
) => {
  const startTime = Date.now();

  try {
    logger.info('tenant', 'account_creation_start', `Starting tenant account creation for ${email}`, {
      email,
      role: metadata.role,
      hasPhone: !!metadata.phone,
    });

    // Route through Edge Function (service role) for guaranteed creation
    const edgeUrl = `${supabaseUrl}/functions/v1/create-tenant`;
    let json: any = null;
    let fnErrorMsg: string | undefined;
    try {
      const { data: fnData, error: fnError } = await mainClient.functions.invoke('create-tenant', {
        body: { email, password, ...metadata },
      });
      json = fnData as any;
      fnErrorMsg = fnError?.message;
      console.log('🔍 Edge Function response:', { fnData, fnError, json });
    } catch (e: any) {
      fnErrorMsg = e?.message || 'Edge function call failed';
      console.log('🔍 Edge Function error:', e);
    }
    if (fnErrorMsg || !json?.userId) {
      const msg = json?.error || fnErrorMsg || 'Failed creating user via edge function';
      logger.error('tenant', 'account_creation_failed', msg, { email });
      return { success: false, error: msg, userId: null };
    }

    const userId = json.userId as string;

    const duration = Date.now() - startTime;
    logTenantCreation.success(userId, email, duration, {
      userId,
      emailConfirmed: true,
    });

    logger.info('tenant', 'account_created', `Tenant account created successfully for ${email}`, {
      userId,
      email,
      role: metadata.role,
      duration,
    });

    return { success: true, error: null, userId };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logTenantCreation.error(undefined, email, error.message, {
      error: error.message,
      stack: error.stack,
      duration,
    });
    return { success: false, error: error.message || 'Unexpected error', userId: null };
  }
};

/**
 * Create tenant profile in database
 * @param userId - User ID from auth signup
 * @param profileData - Profile data to insert
 * @returns Promise with success/error result
 */
export const createTenantProfile = async (
  userId: string,
  profileData: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
    address?: string;
    city?: string;
    country?: string;
    nationality?: string;
    id_number?: string;
    is_foreign?: boolean;
  }
) => {
  const startTime = Date.now();

  try {
    logger.info('profile', 'creation_start', `Starting profile creation for user ${userId}`, {
      userId,
      email: profileData.email,
      role: profileData.role,
      hasAddress: !!profileData.address,
    });

    // Use main authenticated client so RLS policies for managers/admins apply
    // This prevents failures when an unauthenticated (anon) client attempts to insert
    const { data, error } = await mainClient
      .from('profiles')
      .insert([{
        id: userId,
        ...profileData,
        status: 'active',
        profile_type: profileData.role === 'tenant' ? 'tenant' : 'employee',
      }])
      .select()
      .single();

    if (error) {
      const duration = Date.now() - startTime;
      logProfileOperation(userId, 'create', false, {
        error: error.message,
        code: error.code,
        duration,
      });
      return { success: false, error: error.message, profile: null };
    }

    const duration = Date.now() - startTime;
    logProfileOperation(userId, 'create', true, {
      profileId: data.id,
      duration,
    });

    logger.info('profile', 'created', `Profile created successfully for user ${userId}`, {
      userId,
      profileId: data.id,
      role: data.role,
      duration,
    });

    return { success: true, error: null, profile: data };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logProfileOperation(userId, 'create', false, {
      error: error.message,
      stack: error.stack,
      duration,
    });
    return { success: false, error: error.message || 'Unexpected error', profile: null };
  }
};

/**
 * Complete tenant creation process (account + profile)
 * @param tenantData - Complete tenant data
 * @returns Promise with success/error result
 */
export const createTenantComplete = async (tenantData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  id_number?: string;
  is_foreign?: boolean;
}) => {
  const startTime = Date.now();

  try {
    logger.info('tenant', 'complete_creation_start', `Starting complete tenant creation for ${tenantData.email}`, {
      email: tenantData.email,
      role: tenantData.role,
      hasPhone: !!tenantData.phone,
      hasAddress: !!tenantData.address,
    });

    // Step 1: Create auth account
    const authResult = await createTenantAccount(
      tenantData.email,
      tenantData.password,
      {
        first_name: tenantData.first_name,
        last_name: tenantData.last_name,
        phone: tenantData.phone,
        role: tenantData.role,
      }
    );

    if (!authResult.success) {
      const duration = Date.now() - startTime;
      logger.error('tenant', 'complete_creation_failed', `Auth account creation failed for ${tenantData.email}`, {
        email: tenantData.email,
        error: authResult.error,
        duration,
      });
      return { success: false, error: authResult.error, userId: null, profile: null };
    }

    // Step 2: Create profile
    const profileResult = await createTenantProfile(authResult.userId!, {
      first_name: tenantData.first_name,
      last_name: tenantData.last_name,
      email: tenantData.email,
      phone: tenantData.phone,
      role: tenantData.role,
      address: tenantData.address,
      city: tenantData.city,
      country: tenantData.country,
      nationality: tenantData.nationality,
      id_number: tenantData.id_number,
      is_foreign: tenantData.is_foreign,
    });

    if (!profileResult.success) {
      // Note: Auth account was created but profile failed
      // In production, you might want to clean up the auth account
      const duration = Date.now() - startTime;
      logger.warn('tenant', 'profile_creation_failed', `Profile creation failed for ${tenantData.email}, auth account exists`, {
        email: tenantData.email,
        userId: authResult.userId,
        profileError: profileResult.error,
        duration,
      });
      return {
        success: false,
        error: `Account created but profile failed: ${profileResult.error}`,
        userId: authResult.userId,
        profile: null
      };
    }

    const duration = Date.now() - startTime;
    logger.info('tenant', 'complete_creation_success', `Complete tenant creation successful for ${tenantData.email}`, {
      email: tenantData.email,
      userId: authResult.userId,
      profileId: profileResult.profile?.id,
      duration,
    });

    return {
      success: true,
      error: null,
      userId: authResult.userId,
      profile: profileResult.profile
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('tenant', 'complete_creation_error', `Unexpected error in complete tenant creation for ${tenantData.email}`, {
      email: tenantData.email,
      error: error.message,
      stack: error.stack,
      duration,
    });
    return {
      success: false,
      error: error.message || 'Unexpected error',
      userId: null,
      profile: null
    };
  }
};





