// PDF Generation API Service

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
  pdfBlob?: Blob;
  filename?: string;
  error?: string;
  message?: string;
}

class PDFGeneratorAPI {
  private readonly edgeFunctionUrl: string;

  constructor() {
    const projectId = 'fbabpaorcvatejkrelrf';
    this.edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/pdf-generator`;
  }

  /**
   * Generate PDF report using Supabase Edge Function
   */
  async generatePDF(request: PDFRequest): Promise<PDFResponse> {
    try {
      console.log('Generating PDF for request:', request);
      
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        // Try to get error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Check if response is PDF or JSON error
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/pdf')) {
        // Success: PDF response
        const pdfBlob = await response.blob();
        const filename = this.extractFilenameFromHeaders(response.headers) || 
                        `report-${request.reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        console.log('PDF generated successfully:', filename);
        
        return {
          success: true,
          pdfBlob,
          filename
        };
      } else {
        // Error response in JSON format
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF generation failed');
      }

    } catch (error) {
      console.error('PDF generation failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
        message: 'فشل في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.'
      };
    }
  }

  /**
   * Download PDF file to device
   */
  async downloadPDF(pdfBlob: Blob, filename: string): Promise<boolean> {
    try {
      // For web/Expo - create download link
      if (typeof window !== 'undefined') {
        const url = URL.createObjectURL(pdfBlob);
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
      console.log('PDF download not implemented for React Native yet');
      return false;
      
    } catch (error) {
      console.error('PDF download failed:', error);
      return false;
    }
  }

  /**
   * Share PDF file using native sharing
   */
  async sharePDF(pdfBlob: Blob, filename: string): Promise<boolean> {
    try {
      // For web - use Web Share API if available
      if (typeof window !== 'undefined' && navigator.share) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        await navigator.share({
          title: 'تقرير PDF',
          text: 'تقرير تم إنشاؤه من تطبيق إدارة العقارات',
          files: [file]
        });
        return true;
      }
      
      // Fallback to download
      return await this.downloadPDF(pdfBlob, filename);
      
    } catch (error) {
      console.error('PDF sharing failed:', error);
      return await this.downloadPDF(pdfBlob, filename);
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
    
    return `${arabicType}-${date}.pdf`;
  }

  /**
   * Generate and download PDF in one operation
   */
  async generateAndDownload(request: PDFRequest): Promise<PDFResponse> {
    const result = await this.generatePDF(request);
    
    if (result.success && result.pdfBlob && result.filename) {
      const downloaded = await this.downloadPDF(result.pdfBlob, result.filename);
      
      if (!downloaded) {
        return {
          ...result,
          success: false,
          error: 'تم إنشاء PDF بنجاح ولكن فشل التحميل'
        };
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
}

// Create and export singleton instance
export const pdfApi = new PDFGeneratorAPI();

// Export default for convenience
export default pdfApi; 