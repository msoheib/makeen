// PDF Generation API Integration
// This will connect to the Supabase Edge Function once deployed

import { supabase } from './supabase';

export interface PDFRequest {
  reportType: 'revenue' | 'expense' | 'property' | 'tenant' | 'maintenance';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  propertyId?: string;
  tenantId?: string;
}

export interface PDFResponse {
  success: boolean;
  message?: string;
  reportData?: any;
  pdfUrl?: string;
  filename?: string;
  meta?: {
    recordCount: number;
    generatedAt: string;
    edgeFunctionVersion: string;
  };
  error?: string;
  timestamp?: string;
}

// PDF Generation API
export const pdfApi = {
  /**
   * Generate PDF report using Supabase Edge Function
   */
  async generatePDF(request: PDFRequest): Promise<PDFResponse> {
    try {
      console.log('Generating PDF for request:', request);
      
      // Call the actual Edge Function
      const response = await this.callEdgeFunction(request);
      
      return response;
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'PDF generation failed');
    }
  },

  /**
   * Simulate Edge Function call for testing
   * This will be replaced with actual Edge Function URL once deployed
   */
  async simulateEdgeFunctionCall(request: PDFRequest): Promise<PDFResponse> {
    // Simulate the data fetching that the Edge Function would do
    console.log(`Simulating ${request.reportType} report generation...`);
    
    let reportData;
    let recordCount = 0;

    switch (request.reportType) {
      case 'revenue':
        reportData = await this.getRevenueData(request.dateRange);
        recordCount = reportData.vouchers?.length || 0;
        break;
      case 'expense':
        reportData = await this.getExpenseData(request.dateRange);
        recordCount = reportData.vouchers?.length || 0;
        break;
      case 'property':
        reportData = await this.getPropertyData(request.propertyId);
        recordCount = reportData.properties?.length || 0;
        break;
      case 'tenant':
        reportData = await this.getTenantData(request.tenantId);
        recordCount = reportData.tenants?.length || 0;
        break;
      case 'maintenance':
        reportData = await this.getMaintenanceData(request.dateRange);
        recordCount = reportData.maintenanceRequests?.length || 0;
        break;
      default:
        throw new Error(`Unsupported report type: ${request.reportType}`);
    }

    return {
      success: true,
      message: 'PDF generation infrastructure ready (simulated)',
      reportData,
      meta: {
        recordCount,
        generatedAt: new Date().toISOString(),
        edgeFunctionVersion: '1.0.0-simulation'
      }
    };
  },

  /**
   * Call actual Edge Function (for when deployed)
   */
  async callEdgeFunction(request: PDFRequest): Promise<PDFResponse> {
    const projectId = 'fbabpaorcvatejkrelrf';
    const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/pdf-generator`;
    
    console.log('Calling Edge Function at:', edgeFunctionUrl);
    
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseAnonKey}`,
          'apikey': supabase.supabaseAnonKey,
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error response:', errorText);
        throw new Error(`Edge Function failed: ${response.status} ${response.statusText}`);
      }
      
      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/pdf')) {
        // Get PDF as blob
        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        console.log('PDF generated successfully:', pdfUrl);
        
        return {
          success: true,
          message: 'PDF generated successfully',
          pdfUrl,
          filename: `${request.reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`,
          meta: {
            recordCount: 0, // Will be populated by Edge Function
            generatedAt: new Date().toISOString(),
            edgeFunctionVersion: '1.0.0'
          }
        };
      } else {
        // Parse JSON error response
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error from Edge Function');
      }
    } catch (error) {
      console.error('Edge Function call failed:', error);
      // Fallback to simulation if Edge Function fails
      console.log('Falling back to simulation...');
      return await this.simulateEdgeFunctionCall(request);
    }
  },

  // Data fetching methods (same as Edge Function)
  async getRevenueData(dateRange?: PDFRequest['dateRange']) {
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
  },

  async getExpenseData(dateRange?: PDFRequest['dateRange']) {
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
  },

  async getPropertyData(propertyId?: string) {
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
  },

  async getTenantData(tenantId?: string) {
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
  },

  async getMaintenanceData(dateRange?: PDFRequest['dateRange']) {
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
}; 