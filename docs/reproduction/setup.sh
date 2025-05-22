#!/bin/bash

# Create a new directory for the reproduction
echo "Creating directory for the reproduction..."
mkdir -p angular-cloudflare-repro
cd angular-cloudflare-repro

# Create a package.json file to install dependencies
echo "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "angular-cloudflare-repro",
  "version": "0.0.1",
  "description": "Reproduction of ApplicationInsights issue with Angular and Cloudflare Worker",
  "scripts": {
    "start": "npx wrangler dev",
    "build": "npm run build:client && npm run build:server",
    "build:client": "ng build",
    "build:server": "ng run angular-cloudflare-repro:server:production"
  }
}
EOF

# Install Angular CLI
echo "Installing Angular CLI..."
npm install -g @angular/cli@latest

# Create a new Angular project
echo "Creating Angular project..."
ng new --skip-git --skip-tests --style=css --routing=true angular-cloudflare-repro

# Navigate to the project directory
cd angular-cloudflare-repro

# Install ApplicationInsights SDK
echo "Installing ApplicationInsights SDK..."
npm install @microsoft/applicationinsights-web

# Install Cloudflare worker dependencies
echo "Installing Cloudflare worker dependencies..."
npm install @cloudflare/workers-types wrangler

# Add Angular Universal SSR
echo "Adding Angular Universal SSR support..."
ng add @nguniversal/express-engine

# Create the server routes file for Angular SSR
echo "Creating server routes file..."
mkdir -p src/app/server
cat > src/app/server/app.route.server.ts << 'EOF'
import { Routes } from '@angular/router';

export const serverRoutes: Routes = [
  {
    path: '**',
    component: null,
    data: {
      renderMode: 'server'
    }
  }
];
EOF

# Update AppComponent to include ApplicationInsights
echo "Updating AppComponent with ApplicationInsights..."
cat > src/app/app.component.ts << 'EOF'
import { Component, OnInit } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-cloudflare-repro';
  private _appInsights: ApplicationInsights;

  constructor() {
    // This initialization alone will cause the issues
    this._appInsights = new ApplicationInsights({
      config: {
        connectionString: 'PLACEHOLDER_CONNECTION_STRING',
        enableAutoRouteTracking: true,
        enableCorsCorrelation: false,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
      }
    });
    
    // Even commenting out loadAppInsights still produces the error
    // this._appInsights.loadAppInsights();
  }

  ngOnInit() {
    // Empty for now
  }
}
EOF

# Create a Cloudflare Worker configuration
echo "Creating Cloudflare Worker configuration..."
cat > wrangler.toml << 'EOF'
name = "angular-cloudflare-repro"
main = "dist/server/main.js"
compatibility_date = "2023-06-28"
workers_dev = true

[build]
command = "npm run build"
[build.upload]
format = "modules"
EOF

# Create a simple test script to analyze bundle output
echo "Creating bundle analysis script..."
cat > analyze-bundle.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Read the server bundle
const serverBundlePath = path.join(__dirname, 'dist', 'server', 'main.js');
try {
  const bundle = fs.readFileSync(serverBundlePath, 'utf8');
  
  // Look for defineProperty and __name occurrences
  const definePropertyMatches = bundle.match(/defineProperty/g) || [];
  const nameMatches = bundle.match(/__name/g) || [];
  
  console.log(`Found ${definePropertyMatches.length} occurrences of defineProperty`);
  console.log(`Found ${nameMatches.length} occurrences of __name`);
  
  // Look for lines that might be redefining the name property
  const lines = bundle.split('\n');
  const suspiciousLines = lines.filter(line => 
    line.includes('defineProperty') && line.includes('name')
  );
  
  console.log('\nSuspicious lines that might redefine name property:');
  suspiciousLines.forEach((line, i) => {
    console.log(`${i + 1}. ${line.trim()}`);
  });
  
} catch (error) {
  console.error('Failed to read server bundle:', error);
}
EOF

echo "Setup completed! Next steps:"
echo "1. Run 'cd angular-cloudflare-repro'"
echo "2. Run 'npm run build' to build the application"
echo "3. Run 'node analyze-bundle.js' to analyze the server bundle"
echo "4. Run 'npm start' to start the application locally using Wrangler"