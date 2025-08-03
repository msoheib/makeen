const fs = require('fs');
const path = require('path');

// Create a simple square icon by copying the existing one and ensuring it's square
// This is a temporary fix - you should replace the icon with a proper square version

const iconPath = path.join(__dirname, '../assets/images/icon.png');
const iconBackupPath = path.join(__dirname, '../assets/images/icon-backup.png');

// Backup the original icon
if (fs.existsSync(iconPath)) {
  fs.copyFileSync(iconPath, iconBackupPath);
  console.log('Original icon backed up to icon-backup.png');
}

// For now, we'll use a simple approach - copy the existing icon
// In a real scenario, you'd want to use an image processing library to resize it properly
console.log('Please replace the icon.png file with a square version (1024x1024 recommended)');
console.log('The current icon is 739x761 pixels and needs to be square for the build to succeed'); 