# Angular Compatibility Guide

This document provides guidance for using the Microsoft Application Insights JavaScript SDK with Angular applications, including workarounds for known compatibility issues.

## Angular 20.3.* Compatibility Issue

### Problem Description

Angular 20.3.* introduced stricter bundling behavior that can cause the error "Cannot redefine property: name" when using `@microsoft/applicationinsights-web`. This occurs because Angular's bundler generates `__name` helper functions that attempt to redefine the non-configurable `name` property on SDK functions.

**Error Example:**
```
Uncaught TypeError: Cannot redefine property: name
    at defineProperty (<anonymous>)
    at __name (chunk-TJFVSI2U.js:20:33)
    at AnalyticsPlugin.js:57:10
```

### Workarounds

Since this is a bundler configuration issue on the Angular side, the SDK cannot be safely modified without potentially breaking other consumers. Users experiencing this issue can try the following workarounds:

#### Option 1: Disable Function Name Optimization

Add custom webpack configuration to your Angular project:

**angular.json:**
```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "builder": "@angular-builders/custom-webpack:browser",
          "options": {
            "customWebpackConfig": {
              "path": "./webpack.config.js"
            }
          }
        },
        "serve": {
          "builder": "@angular-builders/custom-webpack:dev-server",
          "options": {
            "customWebpackConfig": {
              "path": "./webpack.config.js"
            }
          }
        }
      }
    }
  }
}
```

**webpack.config.js:**
```javascript
module.exports = {
  optimization: {
    concatenateModules: false,
    minimize: false // for development only
  }
};
```

#### Option 2: Disable Build Optimizations (Development Only)

Modify your `angular.json` build configuration:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "configurations": {
            "development": {
              "optimization": {
                "scripts": false,
                "styles": false
              }
            }
          }
        }
      }
    }
  }
}
```

#### Option 3: TypeScript Configuration

Update your `tsconfig.json` to use newer JavaScript targets:

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "ES2015"
  }
}
```

#### Option 4: Use Angular CLI Serve Options

For development, you can try disabling optimizations via CLI flags:

```bash
ng serve --optimization=false
```

### Installation Dependencies

If using Option 1, you'll need to install the custom webpack builder:

```bash
npm install --save-dev @angular-builders/custom-webpack
```

## General Angular Integration

For general Angular integration best practices, consider using the official Angular plugin:

```bash
npm install @microsoft/applicationinsights-angularplugin-js
```

## Reporting Issues

If you encounter compatibility issues with specific Angular versions, please report them with:

1. Angular version (`ng version`)
2. Application Insights SDK version
3. Complete error stack trace
4. Minimal reproduction steps
5. Angular CLI configuration details

## Contributing

If you have working solutions for Angular compatibility issues, please contribute them to this documentation by submitting a pull request.

## Related Links

- [Angular Plugin Repository](https://github.com/microsoft/applicationinsights-angularplugin-js)
- [Tree Shaking Recommendations](../TreeShakingRecommendations.md)
- [Issue #2643](https://github.com/microsoft/ApplicationInsights-JS/issues/2643) - Angular 20.3.* compatibility