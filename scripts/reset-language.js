#!/usr/bin/env node

/**
 * Language Reset Script
 * 
 * This script resets the application language to English and clears
 * any stored language preferences. Useful for debugging language issues.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Resetting application language to English...');

// Clear localStorage language preference (for web)
const clearWebStorage = () => {
  console.log('   🌐 Clearing web localStorage...');
  
  // This will be executed in the browser context
  const script = `
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('app-language');
      console.log('✅ Web localStorage cleared');
    }
  `;
  
  console.log('   📝 Web storage clear script ready');
  return script;
};

// Clear AsyncStorage language preference (for native)
const clearNativeStorage = () => {
  console.log('   📱 Clearing native AsyncStorage...');
  
  // This would need to be run in the app context
  const script = `
    import AsyncStorage from '@react-native-async-storage/async-storage';
    
    try {
      await AsyncStorage.removeItem('app-language');
      console.log('✅ Native AsyncStorage cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear native storage:', error);
    }
  `;
  
  console.log('   📝 Native storage clear script ready');
  return script;
};

// Create a browser console script
const createBrowserScript = () => {
  const script = `
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
`;

  const scriptPath = path.join(__dirname, '..', 'language-reset-browser.js');
  fs.writeFileSync(scriptPath, script);
  console.log(`   📄 Browser script created: ${scriptPath}`);
};

// Main execution
const main = () => {
  console.log('\n🎯 Language Reset Options:');
  console.log('   1. Clear web localStorage');
  console.log('   2. Clear native AsyncStorage');
  console.log('   3. Create browser console script');
  
  clearWebStorage();
  clearNativeStorage();
  createBrowserScript();
  
  console.log('\n✅ Language reset scripts generated!');
  console.log('\n📋 Next steps:');
  console.log('   1. Open browser developer console');
  console.log('   2. Copy and paste the content of language-reset-browser.js');
  console.log('   3. Press Enter to execute');
  console.log('   4. The page will reload with English language');
  
  console.log('\n🔧 Alternative: Clear browser data');
  console.log('   - Open browser settings');
  console.log('   - Clear browsing data');
  console.log('   - Select "Cookies and other site data"');
  console.log('   - Clear data for localhost:8081');
};

main();

