import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

console.log("PDF Generator Edge Function starting...");

// CORS headers for client requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PDFRequest {
  reportType: 'revenue' | 'expense' | 'property' | 'tenant' | 'maintenance';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  propertyId?: string;
  tenantId?: string;
}

interface DatabaseConfig {
  url: string;
  key: string;
}

// Database connection setup
function createSupabaseClient(): ReturnType<typeof createClient> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Validate PDF request data
function validatePDFRequest(data: any): PDFRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { reportType, dateRange, propertyId, tenantId } = data;
  
  // Validate report type
  const validReportTypes = ['revenue', 'expense', 'property', 'tenant', 'maintenance'];
  if (!validReportTypes.includes(reportType)) {
    throw new Error(`Invalid report type. Must be one of: ${validReportTypes.join(', ')}`);
  }
  
  // Validate date range if provided
  if (dateRange) {
    if (!dateRange.startDate || !dateRange.endDate) {
      throw new Error('Date range must include both startDate and endDate');
    }
    
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format in date range');
    }
    
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }
  }
  
  return { reportType, dateRange, propertyId, tenantId };
}

// Test database connectivity
async function testDatabaseConnection(supabase: ReturnType<typeof createClient>) {
  try {
    console.log('Testing database connection...');
    
    // Simple query to test connectivity
    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Get report data based on request type
async function getReportData(
  supabase: ReturnType<typeof createClient>, 
  request: PDFRequest
) {
  console.log(`Fetching ${request.reportType} report data...`);
  
  switch (request.reportType) {
    case 'revenue':
      return await getRevenueData(supabase, request.dateRange);
    case 'expense':
      return await getExpenseData(supabase, request.dateRange);
    case 'property':
      return await getPropertyData(supabase, request.propertyId);
    case 'tenant':
      return await getTenantData(supabase, request.tenantId);
    case 'maintenance':
      return await getMaintenanceData(supabase, request.dateRange);
    default:
      throw new Error(`Unsupported report type: ${request.reportType}`);
  }
}

// Revenue report data
async function getRevenueData(supabase: ReturnType<typeof createClient>, dateRange?: PDFRequest['dateRange']) {
  let query = supabase
    .from('vouchers')
    .select(`
      id,
      amount,
      created_at,
      description,
      properties:property_id (title, address),
      profiles:tenant_id (first_name, last_name)
    `)
    .eq('voucher_type', 'receipt')
    .eq('status', 'posted');
  
  if (dateRange) {
    query = query
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to fetch revenue data: ${error.message}`);
  }
  
  const totalRevenue = data?.reduce((sum, voucher) => sum + (voucher.amount || 0), 0) || 0;
  
  return {
    vouchers: data || [],
    totalRevenue,
    reportType: 'revenue',
    dateRange,
    generatedAt: new Date().toISOString()
  };
}

// Expense report data
async function getExpenseData(supabase: ReturnType<typeof createClient>, dateRange?: PDFRequest['dateRange']) {
  let query = supabase
    .from('vouchers')
    .select(`
      id,
      amount,
      created_at,
      description,
      properties:property_id (title, address),
      accounts:account_id (account_name, account_type)
    `)
    .eq('voucher_type', 'payment')
    .eq('status', 'posted');
  
  if (dateRange) {
    query = query
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to fetch expense data: ${error.message}`);
  }
  
  const totalExpenses = data?.reduce((sum, voucher) => sum + (voucher.amount || 0), 0) || 0;
  
  return {
    vouchers: data || [],
    totalExpenses,
    reportType: 'expense',
    dateRange,
    generatedAt: new Date().toISOString()
  };
}

// Property report data
async function getPropertyData(supabase: ReturnType<typeof createClient>, propertyId?: string) {
  let query = supabase
    .from('properties')
    .select(`
      *,
      profiles:owner_id (first_name, last_name, email, phone),
      contracts (
        id,
        rent_amount,
        start_date,
        end_date,
        status,
        profiles:tenant_id (first_name, last_name)
      ),
      maintenance_requests (
        id,
        title,
        status,
        priority,
        created_at
      )
    `);
  
  if (propertyId) {
    query = query.eq('id', propertyId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch property data: ${error.message}`);
  }
  
  return {
    properties: data || [],
    reportType: 'property',
    propertyId,
    generatedAt: new Date().toISOString()
  };
}

// Tenant report data
async function getTenantData(supabase: ReturnType<typeof createClient>, tenantId?: string) {
  let query = supabase
    .from('profiles')
    .select(`
      *,
      contracts (
        id,
        rent_amount,
        start_date,
        end_date,
        status,
        properties:property_id (title, address)
      ),
      vouchers:tenant_id (
        id,
        amount,
        voucher_type,
        created_at,
        status
      )
    `)
    .eq('role', 'tenant');
  
  if (tenantId) {
    query = query.eq('id', tenantId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch tenant data: ${error.message}`);
  }
  
  return {
    tenants: data || [],
    reportType: 'tenant',
    tenantId,
    generatedAt: new Date().toISOString()
  };
}

// Maintenance report data
async function getMaintenanceData(supabase: ReturnType<typeof createClient>, dateRange?: PDFRequest['dateRange']) {
  let query = supabase
    .from('maintenance_requests')
    .select(`
      *,
      properties:property_id (title, address),
      profiles:tenant_id (first_name, last_name),
      work_orders (
        id,
        estimated_cost,
        actual_cost,
        status,
        completion_date
      )
    `);
  
  if (dateRange) {
    query = query
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to fetch maintenance data: ${error.message}`);
  }
  
  const totalCosts = data?.reduce((sum, request) => {
    const workOrderCosts = request.work_orders?.reduce((workSum: number, wo: any) => 
      workSum + (wo.actual_cost || wo.estimated_cost || 0), 0) || 0;
    return sum + workOrderCosts;
  }, 0) || 0;
  
  return {
    maintenanceRequests: data || [],
    totalCosts,
    reportType: 'maintenance',
    dateRange,
    generatedAt: new Date().toISOString()
  };
}

// Main request handler
serve(async (req) => {
  console.log(`${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
  
  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();
    
    // Test database connection
    await testDatabaseConnection(supabase);
    
    // Parse request body
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    // Validate request
    const pdfRequest = validatePDFRequest(requestBody);
    console.log('Validated PDF request:', pdfRequest);
    
    // Get report data
    const reportData = await getReportData(supabase, pdfRequest);
    console.log('Report data fetched successfully');
    
    // For now, return the report data as JSON
    // In next tasks, this will be converted to PDF
    return new Response(
      JSON.stringify({
        success: true,
        message: 'PDF generation infrastructure ready',
        reportData,
        meta: {
          recordCount: Array.isArray(reportData.vouchers) ? reportData.vouchers.length :
                      Array.isArray(reportData.properties) ? reportData.properties.length :
                      Array.isArray(reportData.tenants) ? reportData.tenants.length :
                      Array.isArray(reportData.maintenanceRequests) ? reportData.maintenanceRequests.length : 0,
          generatedAt: new Date().toISOString(),
          edgeFunctionVersion: '1.0.0'
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error in PDF generator:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 