// Test file to check path alias resolution
try {
  const store = require('./lib/store');
  console.log('✅ Store import successful');
  console.log('Available exports:', Object.keys(store));
} catch (error) {
  console.log('❌ Store import failed:', error.message);
}

try {
  const theme = require('./lib/theme');
  console.log('✅ Theme import successful');
} catch (error) {
  console.log('❌ Theme import failed:', error.message);
} 