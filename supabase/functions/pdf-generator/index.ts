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
  reportType:
    | 'revenue'
    | 'expense'
    | 'property'
    | 'tenant'
    | 'maintenance'
    | 'pnl'
    | 'cashflow'
    | 'occupancy'
    | 'property_performance'
    | 'payments_log'
    | 'contracts_expiring'
    | 'operations'
    | 'suppliers';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  propertyId?: string;
  tenantId?: string;
}

// Helper function to format numbers with Western (Latin) numerals
function formatNumber(num: number): string {
  // Force Western numerals by converting to string and ensuring no locale conversion
  const formatted = num.toLocaleString('en-US', {
    useGrouping: true,
    maximumFractionDigits: 0
  });
  // Replace any Arabic-Indic numerals with Western numerals as fallback
  return formatted
    .replace(/[\u0660-\u0669]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x0030))
    .replace(/[\u06F0-\u06F9]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 0x0030));
}

// Helper function to format dates in Gregorian calendar with Western numerals
function formatDate(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  // Format as DD/MM/YYYY with Western numerals
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

// Helper function to format datetime with Western numerals
function formatDateTime(date: Date): string {
  const dateStr = formatDate(date);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return `${dateStr} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

// NEW: Financial - Profit & Loss
async function fetchPnLData(supabase: any, dateRange?: any) {
  let base = supabase.from('vouchers').select('voucher_type, amount, created_at').eq('status', 'posted');
  if (dateRange) base = base.gte('created_at', dateRange.startDate).lte('created_at', dateRange.endDate);
  const { data, error } = await base;
  if (error) throw error;
  const revenue = (data || []).filter((v: any) => v.voucher_type === 'receipt').reduce((s: number, v: any) => s + Number(v.amount || 0), 0);
  const expense = (data || []).filter((v: any) => v.voucher_type === 'payment').reduce((s: number, v: any) => s + Number(v.amount || 0), 0);
  return { revenue, expense, netIncome: revenue - expense, rows: data || [] };
}

// NEW: Cashflow (totals by type)
async function fetchCashflowData(supabase: any, dateRange?: any) {
  let q = supabase.from('vouchers').select('voucher_type, amount, created_at, voucher_number').eq('status', 'posted');
  if (dateRange) q = q.gte('created_at', dateRange.startDate).lte('created_at', dateRange.endDate);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  const inflow = (data || []).filter((x: any) => x.voucher_type === 'receipt').reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const outflow = (data || []).filter((x: any) => x.voucher_type === 'payment').reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  return { inflow, outflow, net: inflow - outflow, entries: data?.slice(0, 100) || [] };
}

// NEW: Occupancy report
async function fetchOccupancyData(supabase: any) {
  const { data, error } = await supabase.from('properties').select('status, city');
  if (error) throw error;
  const total = data?.length || 0;
  const occupied = (data || []).filter((p: any) => p.status === 'rented').length;
  const maintenance = (data || []).filter((p: any) => p.status === 'maintenance').length;
  const available = total - occupied - maintenance;
  return { total, occupied, available, maintenance };
}

// NEW: Property performance
async function fetchPropertyPerformanceData(supabase: any) {
  const { data, error } = await supabase
    .from('properties')
    .select('title, city, price, annual_rent, status')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data || []).map((p: any) => {
    const roi = p.annual_rent && p.price ? (Number(p.annual_rent) / Number(p.price)) * 100 : null;
    return { ...p, roi };
  });
  return { rows };
}

// NEW: Payments log
async function fetchPaymentsLogData(supabase: any, dateRange?: any) {
  let q = supabase
    .from('vouchers')
    .select('voucher_number, voucher_type, amount, created_at, description')
    .eq('status', 'posted');
  if (dateRange) q = q.gte('created_at', dateRange.startDate).lte('created_at', dateRange.endDate);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return { entries: data || [] };
}

// NEW: Contracts expiring soon
async function fetchContractsExpiringData(supabase: any, dateRange?: any) {
  const now = new Date();
  const to = dateRange?.endDate ? new Date(dateRange.endDate) : new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const fromISO = now.toISOString();
  const toISO = to.toISOString();
  const { data, error } = await supabase
    .from('contracts')
    .select('contract_number, end_date, start_date, status, rent_amount')
    .eq('status', 'active')
    .gte('end_date', fromISO)
    .lte('end_date', toISO)
    .order('end_date', { ascending: true });
  if (error) throw error;
  return { entries: data || [], from: fromISO, to: toISO };
}

// NEW: Operations summary
async function fetchOperationsSummaryData(supabase: any) {
  const [maint, letters, issues] = await Promise.all([
    supabase.from('maintenance_requests').select('id').then((r: any) => r.data || []),
    supabase.from('letters').select('id').then((r: any) => r.data || []),
    supabase.from('issues').select('id').then((r: any) => r.data || []),
  ]);
  return { maintenanceCount: maint.length, lettersCount: letters.length, issuesCount: issues.length };
}

// NEW: Suppliers report
async function fetchSuppliersData(supabase: any) {
  const { data, error } = await supabase
    .from('clients')
    .select('company_name, contact_person, phone, email, status')
    .in('client_type', ['supplier', 'vendor', 'contractor']);
  if (error) throw error;
  return { suppliers: data || [] };
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
          <div class="subtitle">تاريخ التقرير: ${formatDate(new Date())}</div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <h3>إجمالي الإيرادات</h3>
            <div class="value">${formatNumber(summary.totalRevenue)} ﷼</div>
          </div>
          <div class="summary-item">
            <h3>عدد الإيصالات</h3>
            <div class="value">${summary.recordCount}</div>
          </div>
          <div class="summary-item">
            <h3>متوسط المبلغ</h3>
            <div class="value">${formatNumber(Math.round(summary.averageAmount))} ﷼</div>
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
                <td class="amount">${formatNumber(Number(voucher.amount))} ﷼</td>
                <td>${voucher.property?.title || '-'}</td>
                <td>${voucher.tenant?.first_name || ''} ${voucher.tenant?.last_name || ''}</td>
                <td>${formatDate(voucher.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td style="font-weight: bold; padding-top: 15px; border-top: 2px solid #2196F3;">الإجمالي</td>
              <td class="amount" style="font-size: 18px; padding-top: 15px; border-top: 2px solid #2196F3;">${formatNumber(summary.totalRevenue)} ﷼</td>
              <td style="padding-top: 15px; border-top: 2px solid #2196F3;"></td>
              <td style="padding-top: 15px; border-top: 2px solid #2196F3;"></td>
              <td style="padding-top: 15px; border-top: 2px solid #2196F3;"></td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          تم إنشاء هذا التقرير تلقائياً في ${formatDateTime(new Date())}
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
          <div class="subtitle">تاريخ التقرير: ${formatDate(new Date())}</div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <h3>إجمالي المصروفات</h3>
            <div class="value">${formatNumber(summary.totalExpenses)} ﷼</div>
          </div>
          <div class="summary-item">
            <h3>عدد المدفوعات</h3>
            <div class="value">${summary.recordCount}</div>
          </div>
          <div class="summary-item">
            <h3>متوسط المبلغ</h3>
            <div class="value">${formatNumber(Math.round(summary.averageAmount))} ﷼</div>
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
                <td class="amount">${formatNumber(Number(voucher.amount))} ﷼</td>
                <td>${voucher.account?.account_name || '-'}</td>
                <td>${voucher.property?.title || '-'}</td>
                <td>${formatDate(voucher.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td style="font-weight: bold; padding-top: 15px; border-top: 2px solid #FF9800;">الإجمالي</td>
              <td class="amount" style="font-size: 18px; padding-top: 15px; border-top: 2px solid #FF9800;">${formatNumber(summary.totalExpenses)} ﷼</td>
              <td style="padding-top: 15px; border-top: 2px solid #FF9800;"></td>
              <td style="padding-top: 15px; border-top: 2px solid #FF9800;"></td>
              <td style="padding-top: 15px; border-top: 2px solid #FF9800;"></td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          تم إنشاء هذا التقرير تلقائياً في ${formatDateTime(new Date())}
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
          <div class="subtitle">تاريخ التقرير: ${formatDate(new Date())}</div>
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
                <td class="price">${formatNumber(Number(property.price))} ﷼</td>
                <td>${property.owner?.first_name || ''} ${property.owner?.last_name || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          تم إنشاء هذا التقرير تلقائياً في ${formatDateTime(new Date())}
        </div>
      </div>
    </body>
    </html>
  `;
}

// ---------- New HTML generators (lightweight) ----------
function generatePnLHTML(data: any): string {
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>قائمة الأرباح والخسائر</title>
  <style>body{font-family:Arial;padding:24px;background:#fafafa;color:#333} .card{background:#fff;padding:24px;border-radius:8px;border:1px solid #eee}
  h1{color:#3f51b5} .row{display:flex;gap:16px} .kpi{flex:1;background:#f7f9fc;border:1px solid #e6eaf2;border-radius:8px;padding:16px;text-align:center}
  .kpi .v{font-size:22px;font-weight:bold} table{width:100%;border-collapse:collapse;margin-top:16px} th,td{padding:10px;border-bottom:1px solid #eee;text-align:right}
  </style></head><body><div class="card"><h1>قائمة الأرباح والخسائر</h1>
  <div class="row"><div class="kpi"><div>الإيرادات</div><div class="v">﷼ ${formatNumber(data.revenue)}</div></div>
  <div class="kpi"><div>المصروفات</div><div class="v">﷼ ${formatNumber(data.expense)}</div></div>
  <div class="kpi"><div>صافي الدخل</div><div class="v">﷼ ${formatNumber(data.netIncome)}</div></div></div>
  </div></body></html>`;
}

function generateCashflowHTML(data: any): string {
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>بيان التدفقات النقدية</title>
  <style>body{font-family:Arial;padding:24px;background:#fafafa;color:#333} .card{background:#fff;padding:24px;border-radius:8px;border:1px solid #eee}
  h1{color:#009688} .row{display:flex;gap:16px} .kpi{flex:1;background:#f3fbfb;border:1px solid #d6efef;border-radius:8px;padding:16px;text-align:center}
  .kpi .v{font-size:22px;font-weight:bold} table{width:100%;border-collapse:collapse;margin-top:16px} th,td{padding:10px;border-bottom:1px solid #eee;text-align:right}
  </style></head><body><div class="card"><h1>بيان التدفقات النقدية</h1>
  <div class="row"><div class="kpi"><div>التدفقات الداخلة</div><div class="v">﷼ ${formatNumber(data.inflow)}</div></div>
  <div class="kpi"><div>التدفقات الخارجة</div><div class="v">﷼ ${formatNumber(data.outflow)}</div></div>
  <div class="kpi"><div>الصافي</div><div class="v">﷼ ${formatNumber(data.net)}</div></div></div>
  </div></body></html>`;
}

function generateOccupancyHTML(data: any): string {
  const rate = data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0;
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تقرير الإشغال</title>
  <style>body{font-family:Arial;padding:24px;background:#fafafa;color:#333} .card{background:#fff;padding:24px;border-radius:8px;border:1px solid #eee}
  h1{color:#4CAF50} .grid{display:flex;gap:16px} .kpi{flex:1;background:#f5f9f5;border:1px solid #e1f0e1;border-radius:8px;padding:16px;text-align:center}
  .kpi .v{font-size:22px;font-weight:bold}
  </style></head><body><div class="card"><h1>تقرير الإشغال</h1>
  <div class="grid"><div class="kpi"><div>الإجمالي</div><div class="v">${formatNumber(data.total)}</div></div>
  <div class="kpi"><div>مشغول</div><div class="v">${formatNumber(data.occupied)}</div></div>
  <div class="kpi"><div>متاح</div><div class="v">${formatNumber(data.available)}</div></div>
  <div class="kpi"><div>صيانة</div><div class="v">${formatNumber(data.maintenance)}</div></div>
  <div class="kpi"><div>نسبة الإشغال</div><div class="v">${rate}%</div></div></div>
  </div></body></html>`;
}

function generatePropertyPerformanceHTML(data: any): string {
  const rows = data.rows || [];
  return `<!DOCTYPE html><html dir=\"rtl\" lang=\"ar\"><head><meta charset=\"UTF-8\"><title>أداء العقار</title>
  <style>body{font-family:Arial;padding:24px;background:#fafafa;color:#333} .card{background:#fff;padding:24px;border-radius:8px;border:1px solid #eee}
  h1{color:#673ab7} table{width:100%;border-collapse:collapse;margin-top:16px} th,td{padding:10px;border-bottom:1px solid #eee;text-align:right}
  </style></head><body><div class=card><h1>أداء العقار</h1>
  <table><thead><tr><th>العقار</th><th>المدينة</th><th>السعر</th><th>الإيجار السنوي</th><th>العائد (%)</th><th>الحالة</th></tr></thead>
  <tbody>${rows.map((r: any) => `<tr><td>${r.title || '-'}</td><td>${r.city || '-'}</td><td>﷼ ${formatNumber(Number(r.price || 0))}</td><td>﷼ ${formatNumber(Number(r.annual_rent || 0))}</td><td>${r.roi ? r.roi.toFixed(2) : '-'}</td><td>${r.status}</td></tr>`).join('')}</tbody>
  </table></div></body></html>`;
}

function generatePaymentsLogHTML(data: any): string {
  const rows = data.entries || [];
  return `<!DOCTYPE html><html dir=\"rtl\" lang=\"ar\"><head><meta charset=\"UTF-8\"><title>سجل المدفوعات</title>
  <style>body{font-family:Arial;padding:24px;background:#fafafa;color:#333} .card{background:#fff;padding:24px;border-radius:8px;border:1px solid #eee}
  h1{color:#795548} table{width:100%;border-collapse:collapse;margin-top:16px} th,td{padding:10px;border-bottom:1px solid #eee;text-align:right}
  </style></head><body><div class=card><h1>سجل المدفوعات</h1>
  <table><thead><tr><th>التاريخ</th><th>النوع</th><th>الرقم</th><th>المبلغ</th></tr></thead>
  <tbody>${rows.map((r: any) => `<tr><td>${formatDate(r.created_at)}</td><td>${r.voucher_type}</td><td>${r.voucher_number || '-'}</td><td>﷼ ${formatNumber(Number(r.amount || 0))}</td></tr>`).join('')}</tbody>
  </table></div></body></html>`;
}

function generateContractsExpiringHTML(data: any): string {
  const rows = data.entries || [];
  return `<!DOCTYPE html><html dir=\"rtl\" lang=\"ar\"><head><meta charset=\"UTF-8\"><title>تقرير انتهاء العقود</title>
  <style>body{font-family:Arial;padding:24px;background:#fafafa;color:#333} .card{background:#fff;padding:24px;border-radius:8px;border:1px solid #eee}
  h1{color:#e91e63} table{width:100%;border-collapse:collapse;margin-top:16px} th,td{padding:10px;border-bottom:1px solid #eee;text-align:right}
  </style></head><body><div class=card><h1>تقرير انتهاء العقود</h1>
  <table><thead><tr><th>رقم العقد</th><th>بداية</th><th>نهاية</th><th>الحالة</th><th>الإيجار</th></tr></thead>
  <tbody>${rows.map((r: any) => `<tr><td>${r.contract_number || '-'}</td><td>${formatDate(r.start_date)}</td><td>${formatDate(r.end_date)}</td><td>${r.status}</td><td>﷼ ${formatNumber(Number(r.rent_amount || 0))}</td></tr>`).join('')}</tbody>
  </table></div></body></html>`;
}

function generateOperationsSummaryHTML(data: any): string {
  return `<!DOCTYPE html><html dir=\"rtl\" lang=\"ar\"><head><meta charset=\"UTF-8\"><title>ملخص العمليات</title>
  <style>body{font-family:Arial;padding:24px;background:#fafafa;color:#333} .card{background:#fff;padding:24px;border-radius:8px;border:1px solid #eee}
  h1{color:#607d8b} .grid{display:flex;gap:16px} .kpi{flex:1;background:#f5f7f9;border:1px solid #e2e7ed;border-radius:8px;padding:16px;text-align:center}
  .kpi .v{font-size:22px;font-weight:bold}
  </style></head><body><div class=card><h1>ملخص العمليات</h1>
  <div class=grid><div class=kpi><div>طلبات الصيانة</div><div class=v>${formatNumber(data.maintenanceCount)}</div></div>
  <div class=kpi><div>الخطابات</div><div class=v>${formatNumber(data.lettersCount)}</div></div>
  <div class=kpi><div>القضايا</div><div class=v>${formatNumber(data.issuesCount)}</div></div></div>
  </div></body></html>`;
}

function generateSuppliersHTML(data: any): string {
  const rows = data.suppliers || [];
  return `<!DOCTYPE html><html dir=\"rtl\" lang=\"ar\"><head><meta charset=\"UTF-8\"><title>تقرير الموردين</title>
  <style>body{font-family:Arial;padding:24px;background:#fafafa;color:#333} .card{background:#fff;padding:24px;border-radius:8px;border:1px solid #eee}
  h1{color:#9c27b0} table{width:100%;border-collapse:collapse;margin-top:16px} th,td{padding:10px;border-bottom:1px solid #eee;text-align:right}
  </style></head><body><div class=card><h1>تقرير الموردين</h1>
  <table><thead><tr><th>الشركة</th><th>المسؤول</th><th>الهاتف</th><th>البريد الإلكتروني</th><th>الحالة</th></tr></thead>
  <tbody>${rows.map((r: any) => `<tr><td>${r.company_name || '-'}</td><td>${r.contact_person || '-'}</td><td>${r.phone || '-'}</td><td>${r.email || '-'}</td><td>${r.status || '-'}</td></tr>`).join('')}</tbody>
  </table></div></body></html>`;
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
    if (!request.reportType || ![
      'revenue','expense','property','tenant','maintenance','pnl','cashflow','occupancy','property_performance','payments_log','contracts_expiring','operations','suppliers'
    ].includes(request.reportType)) {
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
      case 'pnl':
        data = await fetchPnLData(supabase, request.dateRange);
        html = generatePnLHTML(data);
        break;
      case 'cashflow':
        data = await fetchCashflowData(supabase, request.dateRange);
        html = generateCashflowHTML(data);
        break;
      case 'occupancy':
        data = await fetchOccupancyData(supabase);
        html = generateOccupancyHTML(data);
        break;
      case 'property_performance':
        data = await fetchPropertyPerformanceData(supabase);
        html = generatePropertyPerformanceHTML(data);
        break;
      case 'payments_log':
        data = await fetchPaymentsLogData(supabase, request.dateRange);
        html = generatePaymentsLogHTML(data);
        break;
      case 'contracts_expiring':
        data = await fetchContractsExpiringData(supabase, request.dateRange);
        html = generateContractsExpiringHTML(data);
        break;
      case 'operations':
        data = await fetchOperationsSummaryData(supabase);
        html = generateOperationsSummaryHTML(data);
        break;
      case 'suppliers':
        data = await fetchSuppliersData(supabase);
        html = generateSuppliersHTML(data);
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
        error: error.message || 'Unknown error occurred',
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