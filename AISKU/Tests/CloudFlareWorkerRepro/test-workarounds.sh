#!/bin/bash

cd angular-cloudflare-repro

# 1. Testing esbuild with preserveNames=false
echo "Testing esbuild with preserveNames=false..."

# Install esbuild if not already installed
npm install -D esbuild

# Create a custom build script for esbuild
cat > custom-build.js << 'EOF'
const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

async function customBuild() {
  try {
    const serverBundlePath = path.join(__dirname, 'dist', 'server', 'main.js');
    const outputPath = path.join(__dirname, 'dist', 'server', 'main.custom.js');
    
    if (!fs.existsSync(serverBundlePath)) {
      console.error('Server bundle not found. Run "npm run build" first.');
      return;
    }
    
    await build({
      entryPoints: [serverBundlePath],
      bundle: true,
      outfile: outputPath,
      platform: 'neutral',
      target: 'es2020',
      minify: false,
      preserveNames: false,  // This is the key setting we're testing
      format: 'esm',
    });
    
    console.log(`Custom bundle created at ${outputPath}`);
  } catch (error) {
    console.error('Error during custom build:', error);
  }
}

customBuild();
EOF

# Run the custom build script
echo "Running custom build with esbuild..."
node custom-build.js

# 2. Testing dynamic import workaround
echo "Testing dynamic import workaround..."

# Create a version of AppComponent with dynamic import
mkdir -p src/app/workaround
cat > src/app/workaround/app.component.workaround.ts << 'EOF'
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: '../app.component.html',
  styleUrls: ['../app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-cloudflare-repro';
  private _appInsights: any;

  constructor() {
    this.lazyLoadAppInsights('PLACEHOLDER_CONNECTION_STRING');
  }

  ngOnInit() {
    // Empty for now
  }

  private async lazyLoadAppInsights(connectionString: string) {
    try {
      // Check if we're in a browser environment (not SSR)
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const appInsights = await import('@microsoft/applicationinsights-web');
        const ApplicationInsights = appInsights.ApplicationInsights;

        this._appInsights = new ApplicationInsights({
          config: {
            connectionString: connectionString,
            enableAutoRouteTracking: true,
            enableCorsCorrelation: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
          }
        });

        this._appInsights.loadAppInsights();
        console.log('ApplicationInsights loaded in client-side context');
      } else {
        console.log('Skipping ApplicationInsights initialization in server context');
      }
    } catch (error) {
      console.error('Failed to initialize ApplicationInsights:', error);
    }
  }
}
EOF

echo "Workaround implementations are ready. You can:"
echo "1. Test the esbuild custom bundle by renaming dist/server/main.custom.js to dist/server/main.js and running 'npm start'"
echo "2. Test the dynamic import approach by replacing src/app/app.component.ts with the content from src/app/workaround/app.component.workaround.ts, then rebuilding and running"