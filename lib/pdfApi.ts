// PDF Generation API Service
import Constants from 'expo-constants';

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
  htmlContent?: string;
  filename?: string;
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
   * Generate HTML report using Supabase Edge Function
   */
  async generateReport(request: PDFRequest): Promise<PDFResponse> {
    try {
      console.log('Generating report for request:', request);
      
      if (!this.anonKey) {
        throw new Error('Missing Supabase authentication key');
      }
      
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.anonKey}`,
          'apikey': this.anonKey
        },
        body: JSON.stringify(request)
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

      // Check if response is HTML or JSON error
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (contentType?.includes('text/html')) {
        // Success: HTML response
        const htmlContent = await response.text();
        const filename = this.extractFilenameFromHeaders(response.headers) || 
                        `report-${request.reportType}-${new Date().toISOString().split('T')[0]}.html`;
        
        console.log('Report generated successfully:', filename);
        
        return {
          success: true,
          htmlContent,
          filename
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
      
      // For React Native - would need file system API
      console.log('HTML download not implemented for React Native yet');
      return false;
      
    } catch (error) {
      console.error('HTML download failed:', error);
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
    
    if (result.success && result.htmlContent && result.filename) {
      // Try to open in new tab first, fallback to download
      const opened = await this.openHTML(result.htmlContent, this.getReportTypeLabel(request.reportType));
      
      if (!opened) {
        const downloaded = await this.downloadHTML(result.htmlContent, result.filename);
        
        if (!downloaded) {
          return {
            ...result,
            success: false,
            error: 'تم إنشاء التقرير بنجاح ولكن فشل التحميل'
          };
        }
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
}

// Create and export singleton instance
export const pdfApi = new PDFGeneratorAPI();

// Export default for convenience
export default pdfApi; 