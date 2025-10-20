import { format } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { getCurrentLanguage } from './i18n';

// Simple check for Arabic language without complex dependencies
const isArabicLanguage = () => {
  try {
    return getCurrentLanguage() === 'ar';
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
export const toArabicNumerals = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) {
    return isArabicLanguage() ? '٠' : '0';
  }
  const str = text.toString();
  if (!isArabicLanguage()) return str;
  return str.replace(/[0-9]/g, (digit: string) => arabicNumerals[digit] || digit);
};

export const formatDate = (date: Date | string, formatString: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Always use English locale to ensure Gregorian calendar
  const locale = locales.en;
  const formatted = format(dateObj, formatString, { locale });
  return formatted; // Don't convert to Arabic numerals for dates
};

// Unified Saudi Riyal symbol per SAMA repo (https://github.com/abdulrysrr/new-saudi-riyal-symbol)
const SAR_SYMBOL = '﷼';

export const formatCurrency = (amount: number | null | undefined, currency: string = 'SAR'): string => {
  const currentLanguage = getCurrentLanguage();
  const safeAmount = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  
  // Always use English locale for number formatting to ensure consistency
  const locale = 'en-US';
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
  
  // Always use unified SAR symbol; fall back to code for other currencies
  const currencySymbol = currency === 'SAR' ? SAR_SYMBOL : currency;
  
  // Always use format: symbol + space + amount (e.g., "﷼ 1,000")
  return `${currencySymbol} ${formattedAmount}`;
};

export const formatNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || (typeof num === 'number' && !isFinite(num))) {
    return isArabicLanguage() ? '٠' : '0';
  }
  const numStr = num.toString();
  return isArabicLanguage() ? toArabicNumerals(numStr) : numStr;
};

// Enhanced number formatter for stats and displays
export const formatDisplayNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || (typeof num === 'number' && !isFinite(num))) {
    return '0';
  }
  
  // Always use English formatting for consistency
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue as number)) return (num as any).toString();
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue as number);
};

export const formatPercentage = (value: number): string => {
  const percentage = `${value.toFixed(1)}%`;
  return percentage; // Don't convert to Arabic numerals for percentages
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  
  return `${size} ${sizes[i]}`; // Don't convert to Arabic numerals for file sizes
};

export const formatPhoneNumber = (phone: string): string => {
  // Format phone numbers in English format for consistency
  if (!phone) return '';
  
  // Basic formatting - always use English format
  if (phone.startsWith('+966')) {
    // Saudi number
    const number = phone.replace('+966', '').replace(/\s/g, '');
    return `+966 ${number}`;
  }
  
  return phone;
};

export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    const formatted = (num / 1000000000).toFixed(1) + 'B';
    return formatted; // Don't convert to Arabic numerals for large numbers
  } else if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1) + 'M';
    return formatted; // Don't convert to Arabic numerals for large numbers
  } else if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1) + 'K';
    return formatted; // Don't convert to Arabic numerals for large numbers
  }
  return formatNumber(num);
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Always use English locale to ensure Gregorian calendar
  const formatted = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return formatted; // Don't convert to Arabic numerals for time
}; 