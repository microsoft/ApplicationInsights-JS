# Reproducing ApplicationInsights Issues with Angular SSR in Cloudflare Workers

This document outlines steps to reproduce the issues reported in [issue #2523](https://github.com/microsoft/ApplicationInsights-JS/issues/2523), where the ApplicationInsights SDK breaks Angular Server-Side Rendering in Cloudflare Workers environments.

> **Note:** We've created automated reproduction scripts in this directory. These scripts set up a test environment and provide tools to analyze the issue in depth.

## Issues Reported

1. Property redefinition error for 'name' property:
   ```
   Cannot redefine property: name
       at defineProperty (<anonymous>)
       at __name (server.js:7:33)
   ```

2. Rendering hanging or being extremely slow without error messages

## Prerequisites

- Node.js v16+ and npm/pnpm
- Cloudflare account (for deployment testing)
- Wrangler CLI tool (`npm i -g wrangler`)

## Reproduction Steps

### 1. Create Basic Angular + Cloudflare Project

```bash
# Using the Cloudflare template for Angular
pnpm create cloudflare@latest my-angular-app --framework=angular

# Navigate to the created project
cd my-angular-app
```

### 2. Add ApplicationInsights SDK

```bash
# Install ApplicationInsights
npm install @microsoft/applicationinsights-web
```

### 3. Configure ApplicationInsights in Angular

Update `app.component.ts` to initialize ApplicationInsights:

```typescript
import { Component, OnInit } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
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
  }

  ngOnInit() {
    // Even without calling loadAppInsights(), the issue occurs
    // this._appInsights.loadAppInsights();
  }
}
```

### 4. Configure Server-Side Rendering

Ensure the application is configured for server-side rendering in `app.route.server.ts`:

```typescript
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
```

### 5. Build and Test

```bash
# Build the Angular application
npm run build

# Run the application locally using Wrangler
npx wrangler dev
```

## Observed Errors

When running the application, we observe:

1. Error in the Cloudflare Worker logs:
   ```
   Cannot redefine property: name
       at defineProperty (<anonymous>)
       at __name (server.js:7:33)
   ```

2. The page load hangs indefinitely or is extremely slow.

## Testing Workarounds

### 1. Using esbuild with preserveNames=false

To test the workaround mentioned in the issue, we can modify the esbuild configuration:

```bash
# Create a custom esbuild config
npx esbuild server.js --bundle --outfile=server.custom.js --platform=neutral --target=es2020 --preserve-names=false
```

### 2. Dynamically Importing ApplicationInsights in Client-Side Only

Modify `app.component.ts` to conditionally import and initialize ApplicationInsights:

```typescript
export class AppComponent implements OnInit {
  private _appInsights: any;
  
  constructor() {
    this.lazyLoadAppInsights('PLACEHOLDER_CONNECTION_STRING');
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
      }
    } catch (error) {
      console.error('Failed to initialize ApplicationInsights:', error);
    }
  }
}
```

## Analyzing the Built Bundle

To understand what causes the property redefinition error, we can examine the built bundle:

```bash
# Find occurrences of property name definition in the bundle
grep -n "defineProperty" server.js
grep -n "__name" server.js
```

## Findings and Conclusions

(This section will be updated after successfully reproducing and analyzing the issue)