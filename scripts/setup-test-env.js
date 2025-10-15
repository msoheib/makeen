#!/usr/bin/env node

/**
 * Quick setup script for testing the web application
 * Checks dependencies, environment, and provides guidance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 Makeen Web App - Test Environment Setup\n');

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function warning(msg) {
  console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

function info(msg) {
  console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);
}

// Check 1: Node version
console.log('📋 Checking prerequisites...\n');

try {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (major >= 18) {
    success(`Node.js ${nodeVersion} (meets requirement: ≥18)`);
  } else {
    error(`Node.js ${nodeVersion} is too old. Please upgrade to v18 or higher.`);
    process.exit(1);
  }
} catch (err) {
  error('Could not determine Node.js version');
  process.exit(1);
}

// Check 2: Git branch
try {
  const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();

  if (branch === 'web-react') {
    success(`On correct branch: ${branch}`);
  } else {
    warning(`Currently on branch: ${branch}`);
    info('You should be on "web-react" branch. Run: git checkout web-react');
  }
} catch (err) {
  warning('Could not determine git branch (not a git repository?)');
}

// Check 3: node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  success('Dependencies installed (node_modules found)');
} else {
  warning('Dependencies not installed');
  info('Run: npm install');
}

// Check 4: .env file
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (fs.existsSync(envPath)) {
  success('.env file exists');

  // Check if it has required variables
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasUrl = envContent.includes('VITE_SUPABASE_URL=');
  const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=');

  if (hasUrl && hasKey) {
    success('Supabase credentials configured');
  } else {
    warning('Supabase credentials may be incomplete');
    info('Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
} else {
  warning('.env file not found');

  if (fs.existsSync(envExamplePath)) {
    info('Run: cp .env.example .env');
    info('Then edit .env with your Supabase credentials');
  } else {
    error('.env.example file not found');
  }
}

// Check 5: Required files exist
console.log('\n📁 Checking project structure...\n');

const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'index.html',
  'src/main.tsx',
  'src/App.tsx',
  'src/theme/theme.ts',
];

let allFilesExist = true;

requiredFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    success(`${file}`);
  } else {
    error(`Missing: ${file}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n');
  error('Some required files are missing. You may not be in the project root directory.');
  process.exit(1);
}

// Summary and next steps
console.log('\n' + '='.repeat(60));
console.log('📊 Summary');
console.log('='.repeat(60) + '\n');

if (!fs.existsSync(nodeModulesPath)) {
  console.log('⚙️  Next steps:');
  console.log('   1. npm install');
  console.log('   2. Create/edit .env file with Supabase credentials');
  console.log('   3. npm run dev');
} else if (!fs.existsSync(envPath)) {
  console.log('⚙️  Next steps:');
  console.log('   1. cp .env.example .env');
  console.log('   2. Edit .env with Supabase credentials');
  console.log('   3. npm run dev');
} else {
  console.log('🎉 Environment is ready!');
  console.log('\n⚙️  To start testing:');
  console.log('   npm run dev');
  console.log('\n📖 For detailed testing guide:');
  console.log('   See TESTING-GUIDE.md');
}

console.log('\n' + '='.repeat(60) + '\n');

console.log('📚 Useful commands:');
console.log('   npm run dev       - Start development server');
console.log('   npm run build     - Build for production');
console.log('   npm run preview   - Preview production build');
console.log('   npm run lint      - Check code quality');
console.log('\n');
