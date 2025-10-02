
// Language Reset Script for Browser Console
// Copy and paste this into your browser's developer console

console.log('🔄 Resetting language to English...');

// Clear localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  window.localStorage.removeItem('app-language');
  console.log('✅ localStorage cleared');
}

// Force document direction to LTR
if (typeof document !== 'undefined') {
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = 'en';
  console.log('✅ Document direction set to LTR');
}

// Reload the page to apply changes
console.log('🔄 Reloading page...');
window.location.reload();
