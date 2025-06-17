// PDF Generation API Service
import Constants from 'expo-constants';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

export interface PDFRequest {
  type: string;
  title: string;
  titleEn?: string;
  data?: any;
  userContext?: {
    userId: string;
    role: 'admin' | 'manager' | 'owner' | 'tenant';
    ownedPropertyIds?: string[];
  };
  filters?: {
    tenantId?: string;
    ownerId?: string;
    propertyId?: string;
    reportType?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface PDFResponse {
  success: boolean;
  htmlContent?: string;
  pdfData?: string; // Base64 encoded PDF data
  filename?: string;
  contentType?: string; // 'application/pdf' or 'text/html'
  error?: string;
  message?: string;
}

class PDFGeneratorAPI {
  private readonly edgeFunctionUrl: string;
  private readonly anonKey: string;

  constructor() {
    const projectId = 'fbabpaorcvatejkrelrf';
    this.edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/pdf-generator`;
    
    // Properly access Expo environment variables
    const extraConfig = Constants.expoConfig?.extra;
    this.anonKey = extraConfig?.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!this.anonKey) {
      console.error('Supabase anonymous key not found in Expo config');
    }
  }

  /**
   * Map frontend report types to backend expected types
   */
  private mapReportType(type: string): 'revenue' | 'expense' | 'property' | 'tenant' | 'maintenance' {
    const mapping: Record<string, 'revenue' | 'expense' | 'property' | 'tenant' | 'maintenance'> = {
      // Financial Reports
      'revenue-report': 'revenue',
      'expense-report': 'expense',
      'account-statement': 'revenue',
      'financial-statements': 'revenue',
      
      // Property Reports
      'property-report': 'property',
      'property-performance': 'property',
      'owner-financial': 'property',
      
      // Tenant Reports
      'tenant-statement': 'tenant',
      'payments-late-tenants': 'tenant',
      
      // Operations/Maintenance Reports
      'electrical-meter': 'maintenance',
      'maintenance-report': 'maintenance',
      
      // Summary Reports (default to revenue)
      'summary-report': 'revenue',
    };
    
    return mapping[type] || 'revenue'; // Default fallback
  }

  /**
   * Generate HTML report using Supabase Edge Function
   */
  async generateReport(request: PDFRequest): Promise<PDFResponse> {
    try {
      console.log('Generating report for request:', request);
      
      if (!this.anonKey) {
        throw new Error('Missing Supabase authentication key');
      }

      // Transform the request to match backend expectations
      const backendRequest = {
        reportType: this.mapReportType(request.type),
        dateRange: request.filters?.startDate && request.filters?.endDate ? {
          startDate: request.filters.startDate,
          endDate: request.filters.endDate
        } : undefined,
        propertyId: request.filters?.propertyId,
        tenantId: request.filters?.tenantId,
      };

      console.log('Transformed backend request:', backendRequest);
      
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.anonKey}`,
          'apikey': this.anonKey
        },
        body: JSON.stringify(backendRequest)
      });

      console.log('Report API response status:', response.status);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          console.log('Could not parse error response as JSON:', jsonError);
          try {
            const errorText = await response.text();
            console.log('Error response text:', errorText);
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            console.log('Could not read error response as text:', textError);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Check if response is PDF, HTML, or JSON error
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (contentType?.includes('application/pdf')) {
        // Success: PDF response - handle PDF download for mobile
        const pdfBuffer = await response.arrayBuffer();
        const filename = this.extractFilenameFromHeaders(response.headers) || 
                        `report-${request.type}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        console.log('PDF report generated successfully:', filename);
        
        // For Expo mobile app, convert to base64 and save/share
        const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
        
        return {
          success: true,
          pdfData: base64Pdf,
          filename,
          contentType: 'application/pdf'
        };
      } else if (contentType?.includes('text/html')) {
        // Fallback: HTML response (if PDF generation failed)
        const htmlContent = await response.text();
        const filename = this.extractFilenameFromHeaders(response.headers) || 
                        `report-${request.type}-${new Date().toISOString().split('T')[0]}.html`;
        
        console.log('HTML report generated (PDF generation may have failed):', filename);
        
        return {
          success: true,
          htmlContent,
          filename,
          contentType: 'text/html'
        };
      } else {
        // Error response in JSON format
        const errorData = await response.json();
        throw new Error(errorData.error || 'Report generation failed');
      }

    } catch (error) {
      console.error('Report generation failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed',
        message: 'فشل في إنشاء التقرير. يرجى المحاولة مرة أخرى.'
      };
    }
  }

  /**
   * Download PDF file to device (for Expo mobile apps)
   */
  async downloadPDF(base64PdfData: string, filename: string): Promise<boolean> {
    try {
      // For web - create download link
      if (typeof window !== 'undefined') {
        // Convert base64 to blob
        const binaryString = atob(base64PdfData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      }
      
      // For React Native - use expo-file-system and expo-sharing
      if (Platform.OS !== 'web') {
        return await this.downloadPDFNative(base64PdfData, filename);
      }
      
      return false;
      
    } catch (error) {
      console.error('PDF download failed:', error);
      return false;
    }
  }

  /**
   * Download PDF file on React Native using expo-file-system
   */
  private async downloadPDFNative(base64PdfData: string, filename: string): Promise<boolean> {
    try {
      // Ensure filename has .pdf extension
      const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      
      // Create file path in document directory
      const fileUri = `${FileSystem.documentDirectory}${pdfFilename}`;
      
      // Write PDF content to file as base64
      await FileSystem.writeAsStringAsync(fileUri, base64PdfData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the PDF file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'حفظ التقرير PDF',
          UTI: 'com.adobe.pdf',
        });
        
        // Show success message
        Alert.alert(
          '✅ تم إنشاء التقرير بنجاح',
          `تم إنشاء وحفظ التقرير PDF:\n${pdfFilename}\n\nيمكنك الآن مشاركته أو حفظه على جهازك.`,
          [{ text: 'موافق', style: 'default' }]
        );
        
        return true;
      } else {
        // Fallback - just save to app directory
        Alert.alert(
          '✅ تم حفظ التقرير PDF',
          `تم حفظ التقرير في:\n${fileUri}\n\nيمكنك العثور عليه في مجلد المستندات.`,
          [{ text: 'موافق', style: 'default' }]
        );
        
        return true;
      }
      
    } catch (error) {
      console.error('Native PDF download failed:', error);
      
      Alert.alert(
        '❌ خطأ في التحميل',
        'فشل في حفظ التقرير PDF. يرجى المحاولة مرة أخرى.',
        [{ text: 'موافق', style: 'default' }]
      );
      
      return false;
    }
  }

  /**
   * Download HTML file to device
   */
  async downloadHTML(htmlContent: string, filename: string): Promise<boolean> {
    try {
      // For web/Expo - create download link
      if (typeof window !== 'undefined') {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      }
      
      // For React Native - use expo-file-system and expo-sharing
      if (Platform.OS !== 'web') {
        return await this.downloadHTMLNative(htmlContent, filename);
      }
      
      return false;
      
    } catch (error) {
      console.error('HTML download failed:', error);
      return false;
    }
  }

  /**
   * Download HTML file on React Native using expo-file-system
   */
  private async downloadHTMLNative(htmlContent: string, filename: string): Promise<boolean> {
    try {
      // Ensure filename has .html extension
      const htmlFilename = filename.endsWith('.html') ? filename : `${filename}.html`;
      
      // Create file path in document directory
      const fileUri = `${FileSystem.documentDirectory}${htmlFilename}`;
      
      // Write HTML content to file with UTF-8 encoding for Arabic support
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the file (this allows user to save, email, etc.)
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'حفظ التقرير',
          UTI: 'public.html',
        });
        
        // Show success message
        Alert.alert(
          '✅ تم إنشاء التقرير بنجاح',
          `تم إنشاء وحفظ التقرير:\n${htmlFilename}\n\nيمكنك الآن مشاركته أو حفظه على جهازك.`,
          [{ text: 'موافق', style: 'default' }]
        );
        
        return true;
      } else {
        // Fallback - just save to app directory
        Alert.alert(
          '✅ تم حفظ التقرير',
          `تم حفظ التقرير في:\n${fileUri}\n\nيمكنك العثور عليه في مجلد المستندات.`,
          [{ text: 'موافق', style: 'default' }]
        );
        
        return true;
      }
      
    } catch (error) {
      console.error('Native HTML download failed:', error);
      
      Alert.alert(
        '❌ خطأ في التحميل',
        'فشل في حفظ التقرير. يرجى المحاولة مرة أخرى.',
        [{ text: 'موافق', style: 'default' }]
      );
      
      return false;
    }
  }

  /**
   * Open HTML content in new window/tab
   */
  async openHTML(htmlContent: string, title: string = 'Report'): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          newWindow.document.title = title;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to open HTML:', error);
      return false;
    }
  }

  /**
   * Share HTML file using native sharing
   */
  async shareHTML(htmlContent: string, filename: string): Promise<boolean> {
    try {
      // For web - use Web Share API if available
      if (typeof window !== 'undefined' && navigator.share) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const file = new File([blob], filename, { type: 'text/html' });
        await navigator.share({
          title: 'تقرير HTML',
          text: 'تقرير تم إنشاؤه من تطبيق إدارة العقارات',
          files: [file]
        });
        return true;
      }
      
      // For React Native - use the native download which includes sharing
      if (Platform.OS !== 'web') {
        return await this.downloadHTMLNative(htmlContent, filename);
      }
      
      // Fallback to download
      return await this.downloadHTML(htmlContent, filename);
      
    } catch (error) {
      console.error('HTML sharing failed:', error);
      return await this.downloadHTML(htmlContent, filename);
    }
  }

  /**
   * Extract filename from response headers
   */
  private extractFilenameFromHeaders(headers: Headers): string | null {
    const contentDisposition = headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match) {
        return match[1].replace(/['"]/g, '');
      }
    }
    return null;
  }

  /**
   * Map report type to Arabic filename
   */
  getArabicFilename(reportType: string): string {
    const typeMap: Record<string, string> = {
      'revenue': 'تقرير-الإيرادات',
      'expense': 'تقرير-المصروفات',
      'property': 'تقرير-العقارات',
      'tenant': 'تقرير-المستأجرين',
      'maintenance': 'تقرير-الصيانة'
    };
    
    const arabicType = typeMap[reportType] || reportType;
    const date = new Date().toISOString().split('T')[0];
    
    return `${arabicType}-${date}.html`;
  }

  /**
   * Generate and download report in one operation
   */
  async generateAndDownload(request: PDFRequest): Promise<PDFResponse> {
    const result = await this.generateReport(request);
    
    if (result.success && result.filename) {
      // Handle PDF response (preferred)
      if (result.pdfData && result.contentType === 'application/pdf') {
        console.log('Downloading PDF report...');
        const downloaded = await this.downloadPDF(result.pdfData, result.filename);
        
        if (!downloaded) {
          return {
            ...result,
            success: false,
            error: 'تم إنشاء تقرير PDF بنجاح ولكن فشل التحميل'
          };
        }
        
        return result;
      }
      
      // Handle HTML response (fallback)
      else if (result.htmlContent && result.contentType === 'text/html') {
        console.log('Downloading HTML report (PDF generation may have failed)...');
        
        // For web - try to open in new tab first, fallback to download
        if (typeof window !== 'undefined') {
          const opened = await this.openHTML(result.htmlContent, this.getReportTypeLabel(request.type));
          
          if (!opened) {
            const downloaded = await this.downloadHTML(result.htmlContent, result.filename);
            
            if (!downloaded) {
              return {
                ...result,
                success: false,
                error: 'تم إنشاء التقرير HTML بنجاح ولكن فشل التحميل'
              };
            }
          }
        } else {
          // For React Native - directly download/share HTML
          const downloaded = await this.downloadHTML(result.htmlContent, result.filename);
          
          if (!downloaded) {
            return {
              ...result,
              success: false,
              error: 'تم إنشاء التقرير HTML بنجاح ولكن فشل في الحفظ أو المشاركة'
            };
          }
        }
        
        return result;
      }
    }
    
    return result;
  }

  /**
   * Get report type mapping for different languages
   */
  getReportTypeLabel(reportType: string): string {
    const labels: Record<string, string> = {
      'revenue': 'تقرير الإيرادات الشهرية',
      'expense': 'تقرير المصروفات الشهرية', 
      'property': 'تقرير العقارات',
      'tenant': 'تقرير المستأجرين',
      'maintenance': 'تقرير الصيانة'
    };
    
    return labels[reportType] || reportType;
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use generateAndDownload instead
   */
  async generatePDF(request: PDFRequest): Promise<PDFResponse> {
    console.warn('generatePDF is deprecated. Use generateAndDownload instead.');
    return this.generateAndDownload(request);
  }

  // Enhanced helper method for generating filtered reports
  async generateFilteredReport(
    reportType: string, 
    title: string, 
    userContext: PDFRequest['userContext'], 
    filters: PDFRequest['filters'] = {}
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.generatePDF({
      type: reportType,
      title,
      userContext,
      filters
    });
  }

  // Helper method for property-specific reports
  async generatePropertyReport(
    propertyId: string,
    userContext: PDFRequest['userContext']
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.generatePDF({
      type: 'property-report',
      title: 'Property Report',
      titleEn: 'Property Report',
      userContext,
      filters: { propertyId }
    });
  }

  // Helper method for tenant-specific reports
  async generateTenantStatement(
    tenantId: string,
    userContext: PDFRequest['userContext']
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.generatePDF({
      type: 'tenant-statement',
      title: 'كشف حساب المستأجر',
      titleEn: 'Tenant Statement',
      userContext,
      filters: { tenantId }
    });
  }

  // Helper method for owner-specific reports
  async generateOwnerReport(
    ownerId: string,
    userContext: PDFRequest['userContext']
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.generatePDF({
      type: 'owner-financial',
      title: 'التقرير المالي للمالك',
      titleEn: 'Owner Financial Report',
      userContext,
      filters: { ownerId }
    });
  }

  // Helper method for expense reports with type filtering
  async generateExpenseReport(
    reportType: 'sales' | 'maintenance' | 'all',
    userContext: PDFRequest['userContext'],
    filters: PDFRequest['filters'] = {}
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.generatePDF({
      type: 'expense-report',
      title: reportType === 'maintenance' ? 'تقرير مصاريف الصيانة' : 
             reportType === 'sales' ? 'تقرير مصاريف المبيعات' : 
             'تقرير المصاريف',
      titleEn: reportType === 'maintenance' ? 'Maintenance Expense Report' : 
               reportType === 'sales' ? 'Sales Expense Report' : 
               'Expense Report',
      userContext,
      filters: { ...filters, reportType }
    });
  }
}

// Create and export singleton instance
export const pdfApi = new PDFGeneratorAPI();

// Export default for convenience
export default pdfApi; 