import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

export interface ReportData {
  id: string;
  title: string;
  description: string;
  type: string;
  lastGenerated: string;
  data: any;
}

// Generate comprehensive Arabic report content
const generateReportContent = (report: ReportData): string => {
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const currentTime = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });

  let content = `نظام إدارة العقارات\n`;
  content += `${'='.repeat(50)}\n\n`;
  content += `${report.title}\n`;
  content += `${report.description}\n\n`;
  content += `تاريخ التقرير: ${currentDate}\n`;
  content += `وقت الإنشاء: ${currentTime}\n`;
  content += `${'='.repeat(50)}\n\n`;

  switch (report.type) {
    case 'revenue':
      content += `📊 ملخص الإيرادات:\n`;
      content += `${'─'.repeat(30)}\n`;
      content += `• إجمالي الإيرادات: ${report.data.totalRevenue?.toLocaleString('ar-SA') || '0'} ريال سعودي\n`;
      content += `• النمو الشهري: +${report.data.monthlyGrowth || '0'}%\n`;
      content += `• عدد العقارات المدرة للدخل: ${report.data.properties || '0'} عقار\n`;
      content += `• متوسط الإيراد الشهري: ${report.data.averageRent?.toLocaleString('ar-SA') || '0'} ريال\n\n`;
      
      content += `📈 تحليل الأداء:\n`;
      content += `${'─'.repeat(30)}\n`;
      content += `يُظهر التقرير نمواً إيجابياً في الإيرادات بنسبة ${report.data.monthlyGrowth || '0'}% مقارنة بالشهر السابق.\n\n`;
      content += `متوسط الإيراد لكل عقار: ${Math.round((report.data.totalRevenue || 0) / (report.data.properties || 1)).toLocaleString('ar-SA')} ريال شهرياً\n\n`;
      
      const revenueGrowth = report.data.monthlyGrowth || 0;
      if (revenueGrowth > 10) {
        content += `✅ الأداء ممتاز: نمو قوي في الإيرادات\n`;
      } else if (revenueGrowth > 5) {
        content += `✅ الأداء جيد: نمو مستقر في الإيرادات\n`;
      } else {
        content += `⚠️ يحتاج تحسين: نمو بطيء في الإيرادات\n`;
      }
      break;

    case 'expenses':
      content += `💰 ملخص المصروفات:\n`;
      content += `${'─'.repeat(30)}\n`;
      content += `• إجمالي المصروفات: ${report.data.totalExpenses?.toLocaleString('ar-SA') || '0'} ريال سعودي\n`;
      content += `• مصروفات الصيانة: ${report.data.maintenanceExpenses?.toLocaleString('ar-SA') || '0'} ريال\n`;
      content += `• المصروفات التشغيلية: ${report.data.operationalExpenses?.toLocaleString('ar-SA') || '0'} ريال\n`;
      content += `• التغيير الشهري: ${report.data.monthlyChange || '0'}%\n\n`;
      
      content += `📊 توزيع المصروفات:\n`;
      content += `${'─'.repeat(30)}\n`;
      const maintenancePercentage = Math.round(((report.data.maintenanceExpenses || 0) / (report.data.totalExpenses || 1)) * 100);
      const operationalPercentage = Math.round(((report.data.operationalExpenses || 0) / (report.data.totalExpenses || 1)) * 100);
      
      content += `• نسبة مصروفات الصيانة: ${maintenancePercentage}%\n`;
      content += `• نسبة المصروفات التشغيلية: ${operationalPercentage}%\n\n`;
      
      if (maintenancePercentage > 60) {
        content += `⚠️ تحذير: مصروفات الصيانة مرتفعة\n`;
      } else {
        content += `✅ مصروفات الصيانة ضمن المعدل الطبيعي\n`;
      }
      break;

    case 'properties':
      content += `🏢 إحصائيات العقارات:\n`;
      content += `${'─'.repeat(30)}\n`;
      content += `• إجمالي العقارات: ${report.data.totalProperties || '0'} عقار\n`;
      content += `• العقارات المشغولة: ${report.data.occupiedProperties || '0'} عقار\n`;
      content += `• العقارات الشاغرة: ${report.data.vacantProperties || '0'} عقار\n`;
      content += `• معدل الإشغال: ${report.data.occupancyRate || '0'}%\n\n`;
      
      content += `📈 تحليل الأداء:\n`;
      content += `${'─'.repeat(30)}\n`;
      const occupancyRate = report.data.occupancyRate || 0;
      if (occupancyRate > 80) {
        content += `✅ معدل الإشغال ممتاز (${occupancyRate}%)\n`;
      } else if (occupancyRate > 60) {
        content += `✅ معدل الإشغال جيد (${occupancyRate}%)\n`;
      } else {
        content += `⚠️ معدل الإشغال يحتاج تحسين (${occupancyRate}%)\n`;
      }
      
      content += `\n• العقارات المتاحة للإيجار: ${report.data.vacantProperties || '0'} عقار\n`;
      content += `• الإمكانية لزيادة الإيرادات من العقارات الشاغرة\n`;
      break;

    case 'tenants':
      content += `👥 إحصائيات المستأجرين:\n`;
      content += `${'─'.repeat(30)}\n`;
      content += `• إجمالي المستأجرين: ${report.data.totalTenants || '0'} مستأجر\n`;
      content += `• المستأجرين النشطين: ${report.data.activeTenants || '0'} مستأجر\n`;
      content += `• المستأجرين الأجانب: ${report.data.foreignTenants || '0'} مستأجر\n`;
      content += `• العقود المعلقة للتجديد: ${report.data.pendingRenewals || '0'} عقد\n\n`;
      
      content += `📊 تحليل الوضع:\n`;
      content += `${'─'.repeat(30)}\n`;
      const activePercentage = Math.round(((report.data.activeTenants || 0) / (report.data.totalTenants || 1)) * 100);
      content += `• نسبة المستأجرين النشطين: ${activePercentage}%\n`;
      content += `• العقود التي تحتاج متابعة: ${report.data.pendingRenewals || '0'} عقد\n\n`;
      
      if (report.data.pendingRenewals > 0) {
        content += `⚠️ تنبيه: يوجد ${report.data.pendingRenewals} عقد يحتاج تجديد\n`;
      } else {
        content += `✅ جميع العقود محدثة\n`;
      }
      break;

    case 'maintenance':
      content += `🔧 إحصائيات الصيانة:\n`;
      content += `${'─'.repeat(30)}\n`;
      content += `• إجمالي طلبات الصيانة: ${report.data.totalRequests || '0'} طلب\n`;
      content += `• الطلبات المكتملة: ${report.data.completedRequests || '0'} طلب\n`;
      content += `• الطلبات المعلقة: ${report.data.pendingRequests || '0'} طلب\n`;
      content += `• متوسط التكلفة: ${report.data.averageCost?.toLocaleString('ar-SA') || '0'} ريال\n\n`;
      
      content += `📈 تحليل الأداء:\n`;
      content += `${'─'.repeat(30)}\n`;
      const completionRate = Math.round(((report.data.completedRequests || 0) / (report.data.totalRequests || 1)) * 100);
      content += `• معدل إنجاز الصيانة: ${completionRate}%\n`;
      content += `• الطلبات التي تحتاج متابعة: ${report.data.pendingRequests || '0'} طلب\n\n`;
      
      if (completionRate > 80) {
        content += `✅ أداء ممتاز في إنجاز الصيانة\n`;
      } else {
        content += `⚠️ يحتاج تحسين في سرعة إنجاز الصيانة\n`;
      }
      break;

    case 'financial':
      content += `💼 الملخص المالي:\n`;
      content += `${'─'.repeat(30)}\n`;
      content += `• صافي الدخل: ${report.data.netIncome?.toLocaleString('ar-SA') || '0'} ريال سعودي\n`;
      content += `• هامش الربح: ${report.data.profitMargin || '0'}%\n`;
      content += `• العائد على الاستثمار: ${report.data.roi || '0'}%\n`;
      content += `• إجمالي الأصول: ${report.data.totalAssets?.toLocaleString('ar-SA') || '0'} ريال\n\n`;
      
      content += `📊 تقييم الأداء المالي:\n`;
      content += `${'─'.repeat(30)}\n`;
      const profitMargin = report.data.profitMargin || 0;
      const roi = report.data.roi || 0;
      
      if (profitMargin > 30) {
        content += `✅ الأداء المالي ممتاز (هامش ربح ${profitMargin}%)\n`;
      } else if (profitMargin > 15) {
        content += `✅ الأداء المالي جيد (هامش ربح ${profitMargin}%)\n`;
      } else {
        content += `⚠️ الأداء المالي يحتاج تحسين (هامش ربح ${profitMargin}%)\n`;
      }
      
      if (roi > 15) {
        content += `✅ العائد على الاستثمار مرتفع (${roi}%)\n`;
      } else if (roi > 8) {
        content += `✅ العائد على الاستثمار متوسط (${roi}%)\n`;
      } else {
        content += `⚠️ العائد على الاستثمار منخفض (${roi}%)\n`;
      }
      break;

    default:
      content += `📋 معلومات التقرير:\n`;
      content += `${'─'.repeat(30)}\n`;
      content += `${report.description}\n\n`;
      content += `هذا تقرير عام يحتوي على معلومات أساسية حول النظام.\n`;
  }

  content += `\n${'='.repeat(50)}\n`;
  content += `📞 معلومات التواصل:\n`;
  content += `نظام إدارة العقارات\n`;
  content += `تم إنشاء هذا التقرير تلقائياً\n`;
  content += `تاريخ الإنشاء: ${currentDate} - ${currentTime}\n`;
  content += `${'='.repeat(50)}\n`;

  return content;
};

// Generate and share report file
export const generateAndDownloadPDF = async (report: ReportData): Promise<void> => {
  try {
    // Generate comprehensive report content
    const reportContent = generateReportContent(report);
    
    // Create filename with Arabic-friendly naming
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const reportTypeArabic = getArabicReportType(report.type);
    const fileName = `${reportTypeArabic}_${timestamp}.txt`;
    
    // Create file path
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write file with UTF-8 encoding for Arabic support
    await FileSystem.writeAsStringAsync(fileUri, reportContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: report.title,
        UTI: 'public.plain-text',
      });
      
      Alert.alert(
        '✅ تم إنشاء التقرير بنجاح',
        `تم إنشاء وحفظ التقرير:\n${fileName}\n\nيمكنك الآن مشاركته أو حفظه على جهازك.`,
        [{ text: 'موافق', style: 'default' }]
      );
    } else {
      Alert.alert(
        '✅ تم حفظ التقرير',
        `تم حفظ التقرير في:\n${fileUri}\n\nيمكنك العثور عليه في مجلد المستندات.`,
        [{ text: 'موافق', style: 'default' }]
      );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    Alert.alert(
      '❌ خطأ في إنشاء التقرير',
      'حدث خطأ أثناء إنشاء التقرير. يرجى التأكد من صلاحيات التطبيق والمحاولة مرة أخرى.',
      [
        { text: 'إعادة المحاولة', style: 'default', onPress: () => generateAndDownloadPDF(report) },
        { text: 'إلغاء', style: 'cancel' }
      ]
    );
  }
};

// Helper function to get Arabic report type names
const getArabicReportType = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'revenue': 'تقرير_الإيرادات',
    'expenses': 'تقرير_المصروفات',
    'properties': 'تقرير_العقارات',
    'tenants': 'تقرير_المستأجرين',
    'maintenance': 'تقرير_الصيانة',
    'financial': 'التقرير_المالي'
  };
  return typeMap[type] || 'تقرير_عام';
};

// Preview function for testing
export const previewReportContent = (report: ReportData): string => {
  return generateReportContent(report);
}; 