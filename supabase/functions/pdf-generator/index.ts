import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

// Database connection setup
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Data fetching functions
async function fetchRevenueData(supabase: any, dateRange?: any) {
  try {
    let query = supabase
      .from('vouchers')
      .select(`
        *,
        property:properties(title, address, city),
        tenant:profiles!tenant_id(first_name, last_name, email)
      `)
      .eq('voucher_type', 'receipt')
      .eq('status', 'posted');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const totalRevenue = data?.reduce((sum: number, voucher: any) => sum + Number(voucher.amount), 0) || 0;
    const recordCount = data?.length || 0;
    
    return {
      vouchers: data || [],
      summary: {
        totalRevenue,
        recordCount,
        averageAmount: recordCount > 0 ? totalRevenue / recordCount : 0
      }
    };
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    throw error;
  }
}

async function fetchExpenseData(supabase: any, dateRange?: any) {
  try {
    let query = supabase
      .from('vouchers')
      .select(`
        *,
        account:accounts(account_name, account_code),
        property:properties(title, address, city)
      `)
      .eq('voucher_type', 'payment')
      .eq('status', 'posted');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const totalExpenses = data?.reduce((sum: number, voucher: any) => sum + Number(voucher.amount), 0) || 0;
    const recordCount = data?.length || 0;
    
    return {
      vouchers: data || [],
      summary: {
        totalExpenses,
        recordCount,
        averageAmount: recordCount > 0 ? totalExpenses / recordCount : 0
      }
    };
  } catch (error) {
    console.error('Error fetching expense data:', error);
    throw error;
  }
}

async function fetchPropertyData(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:profiles!owner_id(first_name, last_name, email),
        contracts(start_date, end_date, rent_amount, status)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const totalProperties = data?.length || 0;
    const occupiedProperties = data?.filter((p: any) => p.status === 'rented').length || 0;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;
    
    return {
      properties: data || [],
      summary: {
        totalProperties,
        occupiedProperties,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      }
    };
  } catch (error) {
    console.error('Error fetching property data:', error);
    throw error;
  }
}

async function fetchTenantData(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        contracts!tenant_id(
          property:properties(title, address),
          rent_amount,
          start_date,
          end_date,
          status
        )
      `)
      .eq('role', 'tenant')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const totalTenants = data?.length || 0;
    const activeTenants = data?.filter((t: any) => t.status === 'active').length || 0;
    const foreignTenants = data?.filter((t: any) => t.is_foreign === true).length || 0;
    
    return {
      tenants: data || [],
      summary: {
        totalTenants,
        activeTenants,
        foreignTenants,
        domesticTenants: totalTenants - foreignTenants
      }
    };
  } catch (error) {
    console.error('Error fetching tenant data:', error);
    throw error;
  }
}

async function fetchMaintenanceData(supabase: any, dateRange?: any) {
  try {
    let query = supabase
      .from('maintenance_requests')
      .select(`
        *,
        property:properties(title, address, city),
        tenant:profiles!tenant_id(first_name, last_name),
        work_orders(estimated_cost, actual_cost, status)
      `);

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const totalRequests = data?.length || 0;
    const completedRequests = data?.filter((r: any) => r.status === 'completed').length || 0;
    const totalCost = data?.reduce((sum: number, request: any) => {
      const workOrderCost = request.work_orders?.reduce((wSum: number, wo: any) => 
        wSum + Number(wo.actual_cost || wo.estimated_cost || 0), 0) || 0;
      return sum + workOrderCost;
    }, 0) || 0;
    
    return {
      maintenanceRequests: data || [],
      summary: {
        totalRequests,
        completedRequests,
        pendingRequests: totalRequests - completedRequests,
        totalCost,
        averageCost: totalRequests > 0 ? totalCost / totalRequests : 0
      }
    };
  } catch (error) {
    console.error('Error fetching maintenance data:', error);
    throw error;
  }
}

// HTML template generation functions
function generateRevenueHTML(data: any): string {
  const { vouchers, summary } = data;
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير الإيرادات الشهرية</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f8f9fa;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2196F3;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2196F3;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header .subtitle {
          color: #666;
          font-size: 16px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-item {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e9ecef;
        }
        .summary-item h3 {
          color: #2196F3;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .summary-item .value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 12px;
          text-align: right;
          border-bottom: 1px solid #e9ecef;
        }
        th {
          background: #f8f9fa;
          font-weight: bold;
          color: #2196F3;
        }
        .amount {
          font-weight: bold;
          color: #4CAF50;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e9ecef;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>تقرير الإيرادات الشهرية</h1>
          <div class="subtitle">شركة إدارة العقارات MG</div>
          <div class="subtitle">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</div>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <h3>إجمالي الإيرادات</h3>
            <div class="value">${summary.totalRevenue.toLocaleString('ar-SA')} ريال</div>
          </div>
          <div class="summary-item">
            <h3>عدد الإيصالات</h3>
            <div class="value">${summary.recordCount}</div>
          </div>
          <div class="summary-item">
            <h3>متوسط المبلغ</h3>
            <div class="value">${Math.round(summary.averageAmount).toLocaleString('ar-SA')} ريال</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>رقم الإيصال</th>
              <th>المبلغ</th>
              <th>العقار</th>
              <th>المستأجر</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${vouchers.map((voucher: any) => `
              <tr>
                <td>${voucher.voucher_number || '-'}</td>
                <td class="amount">${Number(voucher.amount).toLocaleString('ar-SA')} ريال</td>
                <td>${voucher.property?.title || '-'}</td>
                <td>${voucher.tenant?.first_name || ''} ${voucher.tenant?.last_name || ''}</td>
                <td>${new Date(voucher.created_at).toLocaleDateString('ar-SA')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          تم إنشاء هذا التقرير تلقائياً في ${new Date().toLocaleString('ar-SA')}
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateExpenseHTML(data: any): string {
  const { vouchers, summary } = data;
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير المصروفات الشهرية</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #FF9800; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #FF9800; font-size: 28px; margin-bottom: 10px; }
        .header .subtitle { color: #666; font-size: 16px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-item { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
        .summary-item h3 { color: #FF9800; font-size: 14px; margin-bottom: 10px; }
        .summary-item .value { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: right; border-bottom: 1px solid #e9ecef; }
        th { background: #f8f9fa; font-weight: bold; color: #FF9800; }
        .amount { font-weight: bold; color: #f44336; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e9ecef; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>تقرير المصروفات الشهرية</h1>
          <div class="subtitle">شركة إدارة العقارات MG</div>
          <div class="subtitle">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</div>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <h3>إجمالي المصروفات</h3>
            <div class="value">${summary.totalExpenses.toLocaleString('ar-SA')} ريال</div>
          </div>
          <div class="summary-item">
            <h3>عدد المدفوعات</h3>
            <div class="value">${summary.recordCount}</div>
          </div>
          <div class="summary-item">
            <h3>متوسط المبلغ</h3>
            <div class="value">${Math.round(summary.averageAmount).toLocaleString('ar-SA')} ريال</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>رقم الإيصال</th>
              <th>المبلغ</th>
              <th>الحساب</th>
              <th>العقار</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${vouchers.map((voucher: any) => `
              <tr>
                <td>${voucher.voucher_number || '-'}</td>
                <td class="amount">${Number(voucher.amount).toLocaleString('ar-SA')} ريال</td>
                <td>${voucher.account?.account_name || '-'}</td>
                <td>${voucher.property?.title || '-'}</td>
                <td>${new Date(voucher.created_at).toLocaleDateString('ar-SA')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          تم إنشاء هذا التقرير تلقائياً في ${new Date().toLocaleString('ar-SA')}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Add other HTML generation functions for property, tenant, and maintenance reports...
function generatePropertyHTML(data: any): string {
  const { properties, summary } = data;
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير العقارات</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #4CAF50; font-size: 28px; margin-bottom: 10px; }
        .header .subtitle { color: #666; font-size: 16px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-item { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
        .summary-item h3 { color: #4CAF50; font-size: 14px; margin-bottom: 10px; }
        .summary-item .value { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: right; border-bottom: 1px solid #e9ecef; }
        th { background: #f8f9fa; font-weight: bold; color: #4CAF50; }
        .price { font-weight: bold; color: #2196F3; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status.available { background: #e8f5e8; color: #4CAF50; }
        .status.rented { background: #fff3e0; color: #FF9800; }
        .status.maintenance { background: #ffebee; color: #f44336; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e9ecef; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>تقرير العقارات</h1>
          <div class="subtitle">شركة إدارة العقارات MG</div>
          <div class="subtitle">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</div>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <h3>إجمالي العقارات</h3>
            <div class="value">${summary.totalProperties}</div>
          </div>
          <div class="summary-item">
            <h3>العقارات المؤجرة</h3>
            <div class="value">${summary.occupiedProperties}</div>
          </div>
          <div class="summary-item">
            <h3>معدل الإشغال</h3>
            <div class="value">${summary.occupancyRate}%</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>العنوان</th>
              <th>النوع</th>
              <th>الحالة</th>
              <th>السعر</th>
              <th>المالك</th>
            </tr>
          </thead>
          <tbody>
            ${properties.map((property: any) => `
              <tr>
                <td>${property.title}</td>
                <td>${property.property_type}</td>
                <td><span class="status ${property.status}">${property.status}</span></td>
                <td class="price">${Number(property.price).toLocaleString('ar-SA')} ريال</td>
                <td>${property.owner?.first_name || ''} ${property.owner?.last_name || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          تم إنشاء هذا التقرير تلقائياً في ${new Date().toLocaleString('ar-SA')}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const request: PDFRequest = await req.json();
    console.log('Received PDF request:', request);

    // Validate request
    if (!request.reportType || !['revenue', 'expense', 'property', 'tenant', 'maintenance'].includes(request.reportType)) {
      throw new Error('Invalid report type');
    }

    // Create Supabase client
    const supabase = createSupabaseClient();

    // Fetch data based on report type
    let data;
    let html;
    
    switch (request.reportType) {
      case 'revenue':
        data = await fetchRevenueData(supabase, request.dateRange);
        html = generateRevenueHTML(data);
        break;
      case 'expense':
        data = await fetchExpenseData(supabase, request.dateRange);
        html = generateExpenseHTML(data);
        break;
      case 'property':
        data = await fetchPropertyData(supabase);
        html = generatePropertyHTML(data);
        break;
      case 'tenant':
        data = await fetchTenantData(supabase);
        html = generatePropertyHTML(data); // You'd implement generateTenantHTML
        break;
      case 'maintenance':
        data = await fetchMaintenanceData(supabase, request.dateRange);
        html = generatePropertyHTML(data); // You'd implement generateMaintenanceHTML
        break;
      default:
        throw new Error('Unsupported report type');
    }

    console.log('Data fetched successfully, generating PDF...');

    try {
      // Generate PDF using Puppeteer
      console.log('Launching Puppeteer browser...');
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      console.log('Creating new page...');
      const page = await browser.newPage();
      
      console.log('Setting page content...');
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      console.log('Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });
      
      console.log('Closing browser...');
      await browser.close();

      console.log('PDF generated successfully, buffer size:', pdfBuffer.byteLength);

      // Return PDF as response
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${request.reportType}-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      });
      
    } catch (pdfError) {
      console.error('PDF generation failed, falling back to HTML:', pdfError);
      
      // Fallback to HTML response if PDF generation fails
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="report-${request.reportType}-${new Date().toISOString().split('T')[0]}.html"`
        }
      });
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}); 