import { I18n } from 'i18n-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a new i18n instance
const i18n = new I18n();

// Set the locale based on the device or user preference
export const getLocale = async () => {
  try {
    const locale = await AsyncStorage.getItem('user-locale');
    return locale || 'en'; // Default to English
  } catch (error) {
    console.error('Failed to get locale', error);
    return 'en';
  }
};

// Set the locale
export const setLocale = async (locale: string) => {
  try {
    await AsyncStorage.setItem('user-locale', locale);
    i18n.locale = locale;
  } catch (error) {
    console.error('Failed to set locale', error);
  }
};

// English translations
const en = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    select: 'Select',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    done: 'Done',
  },
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    createAccount: 'Create Account',
  },
  dashboard: {
    title: 'Dashboard',
    properties: 'Properties',
    tenants: 'Tenants',
    maintenance: 'Maintenance',
    finance: 'Finance',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    overview: 'Overview',
  },
  properties: {
    title: 'Properties',
    addProperty: 'Add Property',
    editProperty: 'Edit Property',
    details: 'Property Details',
    name: 'Property Name',
    type: 'Property Type',
    status: 'Status',
    address: 'Address',
    city: 'City',
    country: 'Country',
    neighborhood: 'Neighborhood',
    area: 'Area (sqm)',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    price: 'Price',
    paymentMethod: 'Payment Method',
    available: 'Available',
    rented: 'Rented',
    maintenance: 'Maintenance',
    reserved: 'Reserved',
    noProperties: 'No properties found',
  },
  maintenance: {
    title: 'Maintenance',
    requests: 'Requests',
    workOrders: 'Work Orders',
    addRequest: 'Add Request',
    editRequest: 'Edit Request',
    requestDetails: 'Request Details',
    property: 'Property',
    tenant: 'Tenant',
    priority: 'Priority',
    status: 'Status',
    description: 'Description',
    images: 'Images',
    noRequests: 'No maintenance requests found',
    assignedTo: 'Assigned To',
    estimatedCost: 'Estimated Cost',
    actualCost: 'Actual Cost',
    startDate: 'Start Date',
    completionDate: 'Completion Date',
  },
  finance: {
    title: 'Finance',
    vouchers: 'Vouchers',
    invoices: 'Invoices',
    receipts: 'Receipts',
    payments: 'Payments',
    journals: 'Journals',
    addVoucher: 'Add Voucher',
    editVoucher: 'Edit Voucher',
    voucherDetails: 'Voucher Details',
    voucherNumber: 'Voucher Number',
    amount: 'Amount',
    vatAmount: 'VAT Amount',
    totalAmount: 'Total Amount',
    currency: 'Currency',
    description: 'Description',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    property: 'Property',
    tenant: 'Tenant',
    owner: 'Owner',
    status: 'Status',
    noVouchers: 'No vouchers found',
  },
  contracts: {
    title: 'Contracts',
    addContract: 'Add Contract',
    editContract: 'Edit Contract',
    contractDetails: 'Contract Details',
    property: 'Property',
    tenant: 'Tenant',
    startDate: 'Start Date',
    endDate: 'End Date',
    rentAmount: 'Rent Amount',
    paymentFrequency: 'Payment Frequency',
    securityDeposit: 'Security Deposit',
    isForeignTenant: 'Foreign Tenant',
    status: 'Status',
    documents: 'Documents',
    noContracts: 'No contracts found',
  },
};

// Arabic translations (simplified example)
const ar = {
  common: {
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    retry: 'إعادة المحاولة',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    add: 'إضافة',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    select: 'اختيار',
    confirm: 'تأكيد',
    back: 'رجوع',
    next: 'التالي',
    done: 'تم',
  },
  auth: {
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    signOut: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'إعادة تعيين كلمة المرور',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    createAccount: 'إنشاء حساب',
  },
  dashboard: {
    title: 'لوحة التحكم',
    properties: 'العقارات',
    tenants: 'المستأجرين',
    maintenance: 'الصيانة',
    finance: 'المالية',
    recentActivity: 'النشاط الأخير',
    quickActions: 'إجراءات سريعة',
    overview: 'نظرة عامة',
  },
  // Additional translations would go here
};

// Set available translations
i18n.translations = { en, ar };

// Set the default locale and fallback
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Initialize locale (to be called on app startup)
export const initLocale = async () => {
  const locale = await getLocale();
  i18n.locale = locale;
};

export default i18n;