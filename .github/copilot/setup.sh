#!/bin/bash

# This script sets up the environment for GitHub Copilot before the firewall is enabled

# Update package lists
apt-get update -y

# Install any required system dependencies
apt-get install -y curl wget gnupg

# Install Node.js dependencies that might need external access
npm install -g npm@latest
npm install -g rollup grunt-cli

# Pre-download required files that might be blocked by firewall
# This ensures they are available when needed

# Pre-download Chrome for Testing if needed (puppeteer depends on this)
if [ ! -f /tmp/chrome-linux64.zip ]; then
  echo "Pre-downloading Chrome for Testing..."
  wget -q -O /tmp/chrome-linux64.zip https://storage.googleapis.com/chrome-for-testing-public/136.0.7103.92/linux64/chrome-linux64.zip || echo "Failed to download Chrome for Testing, but continuing..."
fi

# Run firmware updater once before firewall is enabled
fwupdmgr refresh || echo "Failed to refresh fwupdmgr, but continuing..."

echo "GitHub Copilot setup completed successfully"