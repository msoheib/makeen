import { format } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';

// Simple check for Arabic language without complex dependencies
const isArabicLanguage = () => {
  try {
    // Simple check - if this fails, default to false
    return false; // Temporarily disable Arabic numerals to fix loading issue
  } catch {
    return false;
  }
};

// Language-specific formatters
const locales = {
  en: enUS,
  ar: ar,
};

// Arabic-Indic numerals mapping
const arabicNumerals: { [key: string]: string } = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩'
};

// Convert English numerals to Arabic numerals
export const toArabicNumerals = (text: string): string => {
  if (!isArabicLanguage()) return text;
  
  return text.toString().replace(/[0-9]/g, (digit: string) => arabicNumerals[digit] || digit);
};

export const formatDate = (date: Date | string, formatString: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = isArabicLanguage() ? locales.ar : locales.en;
  const formatted = format(dateObj, formatString, { locale });
  return toArabicNumerals(formatted);
};

export const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
  const formattedAmount = new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  // Use currency symbol consistently regardless of language
  const currencySymbol = currency === 'SAR' ? 'ر.س' : currency;
  
  // Always display as: amount + space + symbol (e.g., "1,000 ر.س")
  return `${formattedAmount} ${currencySymbol}`;
};

export const formatNumber = (num: number | string): string => {
  const numStr = num.toString();
  return isArabicLanguage() ? toArabicNumerals(numStr) : numStr;
};

export const formatPercentage = (value: number): string => {
  const percentage = `${value.toFixed(1)}%`;
  return toArabicNumerals(percentage);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return toArabicNumerals('0 Bytes');
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  
  return toArabicNumerals(`${size} ${sizes[i]}`);
};

export const formatPhoneNumber = (phone: string): string => {
  // Format phone numbers appropriately for Arabic/English contexts
  if (!phone) return '';
  
  const isArabic = isArabicLanguage();
  
  // Basic formatting - can be enhanced for specific regions
  if (phone.startsWith('+966')) {
    // Saudi number
    const number = phone.replace('+966', '').replace(/\s/g, '');
    if (isArabic) {
      return `٠٩٦٦ ${number.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)])}`;
    } else {
      return `+966 ${number}`;
    }
  }
  
  return phone;
};

export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    const formatted = (num / 1000000000).toFixed(1) + 'B';
    return toArabicNumerals(formatted);
  } else if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1) + 'M';
    return toArabicNumerals(formatted);
  } else if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1) + 'K';
    return toArabicNumerals(formatted);
  }
  return formatNumber(num);
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatted = dateObj.toLocaleTimeString(isArabicLanguage() ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return toArabicNumerals(formatted);
}; 