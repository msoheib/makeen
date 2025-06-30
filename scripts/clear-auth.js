#!/usr/bin/env node

/**
 * Clear Authentication Script
 * 
 * This script helps clear stale authentication tokens and session data
 * that might be causing "Invalid Refresh Token" errors.
 * 
 * Run this script when you encounter authentication issues during development.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Clearing authentication data...\n');

// Web storage (if running in browser environment)
if (typeof window !== 'undefined' && window.localStorage) {
  console.log('📱 Clearing web localStorage...');
  
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('auth') || key.includes('session'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`  ✅ Removed: ${key}`);
  });
  
  console.log(`✅ Cleared ${keysToRemove.length} web storage keys\n`);
}

// Instructions for manual clearing
console.log('📋 Manual Steps to Clear Authentication:');
console.log('\n🌐 For Web Development:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Application/Storage tab');
console.log('3. Under Local Storage, find your localhost entry');
console.log('4. Delete all keys containing "supabase", "auth", or "session"');
console.log('5. Refresh the page');

console.log('\n📱 For Mobile Development:');
console.log('1. Close the Expo app completely');
console.log('2. Clear app data/cache:');
console.log('   - Android: Settings > Apps > Expo Go > Storage > Clear Data');
console.log('   - iOS: Delete and reinstall Expo Go app');
console.log('3. Restart the development server: npm run dev');

console.log('\n🔄 Alternative Quick Fix:');
console.log('1. In your browser, open the app');
console.log('2. Open DevTools Console (F12)');
console.log('3. Run this command:');
console.log('   localStorage.clear(); sessionStorage.clear(); location.reload();');

console.log('\n🛠️  Development Server Reset:');
console.log('1. Stop the development server (Ctrl+C)');
console.log('2. Clear Metro cache: npx expo start --clear');
console.log('3. Or restart with: npm run dev');

console.log('\n⚡ Quick Browser Fix:');
console.log('1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)');
console.log('2. Or incognito/private browsing mode');

console.log('\n✅ After clearing, try these steps:');
console.log('1. Navigate to the login page');
console.log('2. Sign in with your credentials');
console.log('3. The authentication should work normally');

console.log('\n🔍 If the problem persists:');
console.log('1. Check if your Supabase project is running');
console.log('2. Verify your environment variables');
console.log('3. Check Supabase dashboard for any authentication settings');
console.log('4. Consider regenerating API keys if necessary');

console.log('\n✨ Script completed! Try signing in again.');