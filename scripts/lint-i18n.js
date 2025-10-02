const fs = require('fs');
const path = require('path');

const arabicDir = path.join(__dirname, '..', 'lib', 'translations', 'ar');
const files = fs.readdirSync(arabicDir).filter((file) => file.endsWith('.json'));

const issues = [];

files.forEach((file) => {
  const fullPath = path.join(arabicDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');

  if (content.includes('\uFFFD')) {
    issues.push(`${file}: contains Unicode replacement characters (\uFFFD)`);
    return;
  }

  try {
    const data = JSON.parse(content);
    const flattened = JSON.stringify(data);
    if (!/[\u0600-\u06FF]/.test(flattened)) {
      issues.push(`${file}: does not contain Arabic characters`);
    }
  } catch (error) {
    issues.push(`${file}: invalid JSON (${error.message})`);
  }
});

if (issues.length > 0) {
  console.error('[lint-i18n] Issues found in Arabic translation files:');
  issues.forEach((issue) => console.error(` - ${issue}`));
  process.exit(1);
}

console.log('[lint-i18n] Arabic translation files look good.');
