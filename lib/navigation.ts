import { router } from 'expo-router';

/**
 * Smart back navigation that goes to the previous page in the navigation stack
 * Falls back to appropriate section if no previous page exists
 */
export const navigateBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    // Fallback to home if no previous page
    router.push('/(tabs)/');
  }
};

/**
 * Navigate back with confirmation for unsaved changes
 */
export const navigateBackWithConfirmation = (
  hasUnsavedChanges: boolean,
  isSubmitting: boolean,
  onConfirm: () => void,
  confirmationTitle: string = 'تأكيد الخروج',
  confirmationMessage: string = 'هل تريد الخروج دون حفظ التغييرات؟'
) => {
  if (hasUnsavedChanges && !isSubmitting) {
    // This would need to be implemented with a proper alert system
    // For now, just call the confirm callback
    onConfirm();
  } else if (isSubmitting) {
    // Show message that operation is in progress
    console.warn('Operation in progress, cannot navigate back');
  } else {
    navigateBack();
  }
};

/**
 * Navigate to a specific section with proper back navigation
 */
export const navigateToSection = (section: string) => {
  router.push(section);
};

/**
 * Navigate back to the appropriate section based on current path
 */
export const navigateBackToSection = (currentPath?: string) => {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  // Fallback to appropriate section based on current path
  const path = currentPath || '';
  
  if (path.includes('/tenants') || path.includes('/people')) {
    router.push('/(tabs)/tenants');
  } else if (path.includes('/properties') || path.includes('/buildings')) {
    router.push('/(tabs)/properties');
  } else if (path.includes('/maintenance')) {
    router.push('/(tabs)/maintenance');
  } else if (path.includes('/finance') || path.includes('/payments')) {
    router.push('/(tabs)/finance');
  } else if (path.includes('/documents')) {
    router.push('/(tabs)/documents');
  } else if (path.includes('/reports')) {
    router.push('/(tabs)/reports');
  } else {
    router.push('/(tabs)/');
  }
};
