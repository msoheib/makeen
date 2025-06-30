import { Tables } from './database.types';

export type Account = Tables<'accounts'>;
export type VoucherType = 'receipt' | 'payment' | 'journal';
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface AccountValidationRule {
  voucherType: VoucherType;
  entryType: 'debit' | 'credit';
  allowedAccountTypes: AccountType[];
  description: string;
}

// Double-entry accounting validation rules
export const ACCOUNT_VALIDATION_RULES: AccountValidationRule[] = [
  // Receipt Voucher Rules
  {
    voucherType: 'receipt',
    entryType: 'debit',
    allowedAccountTypes: ['asset'], // Cash, Bank, Accounts Receivable
    description: 'Debit accounts for receipts must be asset accounts (Cash, Bank, etc.)'
  },
  {
    voucherType: 'receipt',
    entryType: 'credit',
    allowedAccountTypes: ['revenue'], // Revenue accounts
    description: 'Credit accounts for receipts must be revenue accounts'
  },
  
  // Payment Voucher Rules
  {
    voucherType: 'payment',
    entryType: 'debit',
    allowedAccountTypes: ['expense', 'asset'], // Expense accounts or Asset accounts
    description: 'Debit accounts for payments must be expense or asset accounts'
  },
  {
    voucherType: 'payment',
    entryType: 'credit',
    allowedAccountTypes: ['asset'], // Cash, Bank accounts
    description: 'Credit accounts for payments must be asset accounts (Cash, Bank, etc.)'
  },
  
  // Journal Entry Rules (more flexible)
  {
    voucherType: 'journal',
    entryType: 'debit',
    allowedAccountTypes: ['asset', 'expense'], // Any debit-nature accounts
    description: 'Debit entries can use asset or expense accounts'
  },
  {
    voucherType: 'journal',
    entryType: 'credit',
    allowedAccountTypes: ['liability', 'equity', 'revenue'], // Any credit-nature accounts
    description: 'Credit entries can use liability, equity, or revenue accounts'
  }
];

// Account type classification for double-entry
export const DEBIT_NATURE_ACCOUNTS: AccountType[] = ['asset', 'expense'];
export const CREDIT_NATURE_ACCOUNTS: AccountType[] = ['liability', 'equity', 'revenue'];

/**
 * Validates if an account is allowed for a specific voucher type and entry type
 */
export function validateAccountForVoucher(
  account: Account,
  voucherType: VoucherType,
  entryType: 'debit' | 'credit'
): { isValid: boolean; message?: string } {
  if (!account.is_active) {
    return {
      isValid: false,
      message: `Account ${account.account_code} - ${account.account_name} is inactive`
    };
  }

  const rule = ACCOUNT_VALIDATION_RULES.find(
    r => r.voucherType === voucherType && r.entryType === entryType
  );

  if (!rule) {
    return { isValid: true }; // No specific rule found, allow it
  }

  const isValidAccountType = rule.allowedAccountTypes.includes(account.account_type as AccountType);

  if (!isValidAccountType) {
    return {
      isValid: false,
      message: `${rule.description}. Selected account is ${account.account_type} type.`
    };
  }

  return { isValid: true };
}

/**
 * Suggests appropriate accounts for a voucher type and entry type
 */
export function suggestAccountsForVoucher(
  accounts: Account[],
  voucherType: VoucherType,
  entryType: 'debit' | 'credit'
): Account[] {
  const rule = ACCOUNT_VALIDATION_RULES.find(
    r => r.voucherType === voucherType && r.entryType === entryType
  );

  if (!rule) {
    return accounts.filter(account => account.is_active);
  }

  return accounts.filter(account => 
    account.is_active && 
    rule.allowedAccountTypes.includes(account.account_type as AccountType)
  );
}

/**
 * Validates if journal entry debits equal credits
 */
export function validateJournalEntryBalance(
  entries: Array<{ account: Account; amount: number; type: 'debit' | 'credit' }>
): { isValid: boolean; message?: string; totalDebits: number; totalCredits: number } {
  const totalDebits = entries
    .filter(entry => entry.type === 'debit')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalCredits = entries
    .filter(entry => entry.type === 'credit')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.01; // Allow for small rounding differences

  if (!isBalanced) {
    return {
      isValid: false,
      message: `Journal entry is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      totalDebits,
      totalCredits
    };
  }

  if (totalDebits === 0 && totalCredits === 0) {
    return {
      isValid: false,
      message: 'Journal entry must have at least one debit and one credit entry',
      totalDebits,
      totalCredits
    };
  }

  return { isValid: true, totalDebits, totalCredits };
}

/**
 * Gets the natural balance type for an account type
 */
export function getAccountNatureBalance(accountType: AccountType): 'debit' | 'credit' {
  return DEBIT_NATURE_ACCOUNTS.includes(accountType) ? 'debit' : 'credit';
}

/**
 * Filters accounts by type and search criteria
 */
export function filterAccounts(
  accounts: Account[],
  filters: {
    search?: string;
    accountType?: AccountType;
    isActive?: boolean;
    parentAccountId?: string;
  }
): Account[] {
  return accounts.filter(account => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        account.account_code.toLowerCase().includes(searchLower) ||
        account.account_name.toLowerCase().includes(searchLower) ||
        (account.description && account.description.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Account type filter
    if (filters.accountType && account.account_type !== filters.accountType) {
      return false;
    }

    // Active status filter
    if (filters.isActive !== undefined && account.is_active !== filters.isActive) {
      return false;
    }

    // Parent account filter
    if (filters.parentAccountId && account.parent_account_id !== filters.parentAccountId) {
      return false;
    }

    return true;
  });
}

/**
 * Builds account hierarchy from flat account list
 */
export function buildAccountHierarchy(accounts: Account[]): Account[] {
  const accountMap = new Map<string, Account & { children: Account[] }>();
  const rootAccounts: (Account & { children: Account[] })[] = [];

  // Initialize accounts with children array
  accounts.forEach(account => {
    accountMap.set(account.id, { ...account, children: [] });
  });

  // Build hierarchy
  accounts.forEach(account => {
    const accountWithChildren = accountMap.get(account.id)!;
    
    if (account.parent_account_id) {
      const parent = accountMap.get(account.parent_account_id);
      if (parent) {
        parent.children.push(accountWithChildren);
      }
    } else {
      rootAccounts.push(accountWithChildren);
    }
  });

  // Sort accounts by code
  const sortAccounts = (accounts: (Account & { children: Account[] })[]) => {
    accounts.sort((a, b) => a.account_code.localeCompare(b.account_code));
    accounts.forEach(account => {
      if (account.children.length > 0) {
        sortAccounts(account.children);
      }
    });
  };

  sortAccounts(rootAccounts);
  return rootAccounts;
}

/**
 * Gets account breadcrumb path
 */
export function getAccountBreadcrumb(
  account: Account,
  accounts: Account[]
): Account[] {
  const breadcrumb: Account[] = [];
  let currentAccount: Account | undefined = account;

  while (currentAccount) {
    breadcrumb.unshift(currentAccount);
    currentAccount = accounts.find(a => a.id === currentAccount?.parent_account_id);
  }

  return breadcrumb;
}

/**
 * Validates account code format
 */
export function validateAccountCode(code: string): { isValid: boolean; message?: string } {
  if (!code || code.trim().length === 0) {
    return { isValid: false, message: 'Account code is required' };
  }

  // Check if code contains only alphanumeric characters and hyphens
  if (!/^[A-Za-z0-9-]+$/.test(code)) {
    return { isValid: false, message: 'Account code can only contain letters, numbers, and hyphens' };
  }

  // Check length (typically 3-10 characters)
  if (code.length < 3 || code.length > 10) {
    return { isValid: false, message: 'Account code must be between 3 and 10 characters' };
  }

  return { isValid: true };
}

/**
 * Gets default accounts for common transactions
 */
export function getDefaultAccounts(accounts: Account[]) {
  return {
    cash: accounts.find(a => a.account_code === '1110' || a.account_name.toLowerCase().includes('cash')),
    bank: accounts.find(a => a.account_code === '1110' || a.account_name.toLowerCase().includes('bank')),
    accountsReceivable: accounts.find(a => a.account_code === '1120' || a.account_name.toLowerCase().includes('receivable')),
    rentalIncome: accounts.find(a => a.account_code === '4100' || a.account_name.toLowerCase().includes('rental')),
    maintenanceExpense: accounts.find(a => a.account_code === '5110' || a.account_name.toLowerCase().includes('maintenance')),
    administrativeExpense: accounts.find(a => a.account_code === '5120' || a.account_name.toLowerCase().includes('administrative')),
  };
} 