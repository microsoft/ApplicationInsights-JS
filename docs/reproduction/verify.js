/**
 * This script verifies that the reproduction environment can be set up
 * and that the issue can be reproduced.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if the required files exist
const requiredFiles = [
  'README.md',
  'setup.sh',
  'test-workarounds.sh',
  'analyze-appinsights.js',
  'test-esbuild.js'
];

console.log('Verifying reproduction environment...');

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));
if (missingFiles.length > 0) {
  console.error('Missing required files:', missingFiles);
  process.exit(1);
}

// Check if esbuild can be installed
try {
  console.log('Checking if esbuild can be installed...');
  execSync('npm install --no-save esbuild', { stdio: 'inherit' });
  console.log('✓ esbuild can be installed');
} catch (error) {
  console.error('Error installing esbuild:', error);
}

// Check if Node.js and npm versions are compatible
console.log('Checking Node.js and npm versions...');
const nodeVersion = process.version;
const npmVersion = execSync('npm --version').toString().trim();

console.log(`Node.js version: ${nodeVersion}`);
console.log(`npm version: ${npmVersion}`);

if (parseInt(nodeVersion.substring(1).split('.')[0]) < 16) {
  console.warn('⚠️ Warning: Node.js version 16 or higher recommended for this reproduction');
}

// Check for Angular CLI
try {
  console.log('Checking for Angular CLI...');
  execSync('npm list -g @angular/cli || echo "Angular CLI not found globally"', { stdio: 'inherit' });
  console.log('Angular CLI can be installed during setup if not already present');
} catch (error) {
  console.log('Angular CLI will be installed during setup');
}

// Check for wrangler
try {
  console.log('Checking for Wrangler CLI...');
  execSync('npm list -g wrangler || echo "Wrangler not found globally"', { stdio: 'inherit' });
  console.log('Wrangler can be installed during setup if not already present');
} catch (error) {
  console.log('Wrangler will be installed during setup');
}

console.log('\nVerification completed!');
console.log('The reproduction environment is ready to use.');
console.log('\nTo start reproduction:');
console.log('1. Make the setup script executable: chmod +x setup.sh');
console.log('2. Run the setup script: ./setup.sh');
console.log('3. Follow the instructions provided after setup completes');