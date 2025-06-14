import { format } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { isRTL } from './rtl';

// Language-specific formatters
const locales = {
  en: enUS,
  ar: ar,
};

export const formatDate = (date: Date | string, formatString: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = isRTL() ? locales.ar : locales.en;
  return format(dateObj, formatString, { locale });
};

export const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
  const isArabic = isRTL();
  
  if (isArabic) {
    // Arabic number formatting with Arabic-Indic numerals
    const formatter = new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
    });
    return formatter.format(amount);
  } else {
    // English formatting
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
    });
    return formatter.format(amount);
  }
};

export const formatNumber = (number: number): string => {
  const isArabic = isRTL();
  
  if (isArabic) {
    return new Intl.NumberFormat('ar-SA').format(number);
  } else {
    return new Intl.NumberFormat('en-US').format(number);
  }
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  const isArabic = isRTL();
  
  if (isArabic) {
    return new Intl.NumberFormat('ar-SA', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  }
};

export const formatFileSize = (bytes: number): string => {
  const isArabic = isRTL();
  const sizes = isArabic 
    ? ['بايت', 'ك.ب', 'م.ب', 'ج.ب', 'ت.ب']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  if (bytes === 0) return `0 ${sizes[0]}`;
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  if (isArabic) {
    return `${formatNumber(Math.round(size * 100) / 100)} ${sizes[i]}`;
  } else {
    return `${(Math.round(size * 100) / 100)} ${sizes[i]}`;
  }
};

export const formatPhoneNumber = (phone: string): string => {
  // Format phone numbers appropriately for Arabic/English contexts
  if (!phone) return '';
  
  const isArabic = isRTL();
  
  // Basic formatting - can be enhanced for specific regions
  if (phone.startsWith('+966')) {
    // Saudi number
    const number = phone.replace('+966', '').replace(/\\s/g, '');
    if (isArabic) {
      return `٠٩٦٦ ${number.replace(/\\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)])}`;
    } else {
      return `+966 ${number}`;
    }
  }
  
  return phone;
}; 