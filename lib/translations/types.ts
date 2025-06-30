// Translation namespace interfaces for type safety
export interface CommonTranslations {
  // Navigation
  back: string;
  close: string;
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  add: string;
  search: string;
  filter: string;
  loading: string;
  error: string;
  retry: string;
  refresh: string;
  
  // General actions
  confirm: string;
  yes: string;
  no: string;
  ok: string;
  submit: string;
  reset: string;
  clear: string;
  
  // Status labels
  active: string;
  inactive: string;
  pending: string;
  completed: string;
  cancelled: string;
  
  // Time and dates
  today: string;
  yesterday: string;
  tomorrow: string;
  thisWeek: string;
  thisMonth: string;
  
  // Common errors
  networkError: string;
  somethingWentWrong: string;
  noDataFound: string;
  invalidInput: string;
}

export interface DashboardTranslations {
  title: string;
  welcome: string;
  overview: string;
  totalProperties: string;
  totalTenants: string;
  totalRevenue: string;
  monthlyIncome: string;
  expenses: string;
  netIncome: string;
  occupancyRate: string;
  recentActivity: string;
  quickActions: {
    addProperty: string;
    addTenant: string;
    createVoucher: string;
    viewReports: string;
  };
}

export interface PropertiesTranslations {
  title: string;
  myProperties: string;
  addProperty: string;
  propertyDetails: string;
  available: string;
  rented: string;
  maintenance: string;
  reserved: string;
  propertyType: {
    villa: string;
    apartment: string;
    office: string;
    retail: string;
    warehouse: string;
  };
  propertyInfo: {
    address: string;
    city: string;
    neighborhood: string;
    area: string;
    bedrooms: string;
    bathrooms: string;
    price: string;
    owner: string;
    amenities: string;
  };
}

export interface TenantsTranslations {
  title: string;
  allTenants: string;
  addTenant: string;
  tenantDetails: string;
  foreignTenant: string;
  domesticTenant: string;
  tenantInfo: {
    name: string;
    email: string;
    phone: string;
    nationality: string;
    idNumber: string;
    address: string;
    contractStatus: string;
    property: string;
  };
}

export interface FinanceTranslations {
  title: string;
  vouchers: {
    title: string;
    receipt: string;
    payment: string;
    journal: string;
    createVoucher: string;
    voucherNumber: string;
    amount: string;
    description: string;
    property: string;
    tenant: string;
    account: string;
  };
  invoices: {
    title: string;
    createInvoice: string;
    invoiceNumber: string;
    vatAmount: string;
    totalAmount: string;
    dueDate: string;
    issueDate: string;
  };
}

export interface ReportsTranslations {
  title: string;
  reportsSummary: string;
  generateReport: string;
  exportPdf: string;
  dateRange: string;
  reportTypes: {
    revenue: string;
    expenses: string;
    propertyPerformance: string;
    tenantAnalysis: string;
    maintenance: string;
    financial: string;
  };
  statistics: {
    totalReports: string;
    generatedThisMonth: string;
    scheduledReports: string;
    avgGenerationTime: string;
  };
}

export interface MaintenanceTranslations {
  title: string;
  requests: string;
  workOrders: string;
  addRequest: string;
  requestDetails: string;
  priority: {
    low: string;
    medium: string;
    high: string;
    urgent: string;
  };
  status: {
    pending: string;
    approved: string;
    inProgress: string;
    completed: string;
    cancelled: string;
  };
}

export interface NavigationTranslations {
  appTitle: string;
  home: string;
  dashboard: string;
  properties: string;
  tenants: string;
  maintenance: string;
  finance: string;
  reports: string;
  settings: string;
  back: string;
  next: string;
  openMenu: string;
  openMenuHint: string;
  goBack: string;
  goBackHint: string;
  
  ownersAndCustomers: string;
  ownerOrPropertyManager: string;
  tenant: string;
  buyer: string;
  foreignTenants: string;
  customersAndSuppliers: string;
  client: string;
  supplier: string;
  
  propertyManagement: string;
  propertiesList: string;
  rentProperty: string;
  foreignTenantContracts: string;
  listCashProperty: string;
  listInstallmentProperty: string;
  propertyReservationList: string;
  
  accountingAndVoucher: string;
  receiptVoucher: string;
  paymentVoucher: string;
  entryVoucher: string;
  creditNotification: string;
  debitNotification: string;
  vatInvoices: string;
  
  summaryOfReports: string;
  invoicesReport: string;
  
  maintenanceLettersIssues: string;
  maintenanceRequests: string;
  addMaintenanceReport: string;
  listLetters: string;
  addLetter: string;
  listIssues: string;
  addIssue: string;
  archiveDocuments: string;
  
  users: string;
  add: string;
  list: string;
  userTransactionReport: string;
}

export interface SettingsTranslations {
  title: string;
  profile: string;
  notifications: string;
  language: {
    title: string;
    choose: string;
    description: string;
    available: string;
    current: string;
    confirmChange: {
      title: string;
      message: string;
      success: string;
      error: string;
    };
    changeError: string;
  };
  theme: string;
  currency: string;
  support: string;
  termsOfService: string;
  privacyPolicy: string;
  about: string;
  version: string;
  logout: string;
}

// Main translation interface combining all namespaces
export interface Translations {
  common: CommonTranslations;
  navigation: NavigationTranslations;
  dashboard: DashboardTranslations;
  properties: PropertiesTranslations;
  tenants: TenantsTranslations;
  finance: FinanceTranslations;
  reports: ReportsTranslations;
  maintenance: MaintenanceTranslations;
  settings: SettingsTranslations;
}

// Utility types for translation functions
export type TranslationKey = keyof Translations;
export type NestedTranslationKey<T> = T extends object 
  ? {
      [K in keyof T]: T[K] extends object 
        ? `${K & string}.${NestedTranslationKey<T[K]> & string}`
        : K & string
    }[keyof T]
  : never;

// Type for accessing nested translation keys
export type TranslationPath = NestedTranslationKey<Translations>;

// Language codes
export type SupportedLanguage = 'en' | 'ar';

// i18n configuration types
export interface I18nConfig {
  lng: SupportedLanguage;
  fallbackLng: SupportedLanguage;
  debug: boolean;
  interpolation: {
    escapeValue: boolean;
  };
  resources: {
    [key in SupportedLanguage]: {
      [namespace in TranslationKey]: any;
    };
  };
} 