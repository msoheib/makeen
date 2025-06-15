#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Expo with Node.js 22 compatibility...');

// Set environment variables to bypass TypeScript issues
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.EXPO_NO_TYPESCRIPT_CHECK = '1';
process.env.SKIP_PREFLIGHT_CHECK = 'true';

// Start Expo directly without TypeScript preprocessing
const expoPath = join(__dirname, 'node_modules', '.bin', 'expo');
const args = ['start', '--web', '--no-dev', '--minify'];

console.log('📱 Starting Expo development server...');
console.log('🔧 Bypassing TypeScript checks for Node.js 22 compatibility');

const expo = spawn('node', [expoPath, ...args], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    EXPO_NO_TYPESCRIPT_CHECK: '1',
    SKIP_PREFLIGHT_CHECK: 'true'
  }
});

expo.on('error', (error) => {
  console.error('❌ Failed to start Expo:', error.message);
  process.exit(1);
});

expo.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Expo server stopped successfully');
  } else {
    console.log(`❌ Expo server stopped with code ${code}`);
  }
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Expo server...');
  expo.kill('SIGINT');
});

process.on('SIGTERM', () => {
  expo.kill('SIGTERM');
}); 