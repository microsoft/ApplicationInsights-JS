# ApplicationInsights with Angular SSR in Cloudflare Workers - Issue Reproduction

This repository contains scripts and tools to reproduce and analyze the issue reported in [ApplicationInsights-JS issue #2523](https://github.com/microsoft/ApplicationInsights-JS/issues/2523), where the ApplicationInsights SDK breaks Angular Server-Side Rendering in Cloudflare Workers.

## Setup and Reproduction

This reproducer includes several scripts to help diagnose the issue:

### 1. Basic Setup (`setup.sh`)

This script creates a simple Angular application with Cloudflare Worker integration and ApplicationInsights. It:

- Creates a new Angular project
- Adds Angular Universal for SSR
- Installs ApplicationInsights SDK
- Configures server routes for SSR
- Sets up AppComponent with ApplicationInsights initialization
- Creates a Wrangler configuration for Cloudflare Workers
- Adds a bundle analysis script

Usage:
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Testing Workarounds (`test-workarounds.sh`)

This script implements and tests the workarounds mentioned in the issue:

- Using esbuild with `preserveNames=false`
- Using dynamic imports to load ApplicationInsights only in client-side context

Usage:
```bash
chmod +x test-workarounds.sh
./test-workarounds.sh
```

### 3. Analyzing the ApplicationInsights SDK (`analyze-appinsights.js`)

This script scans the ApplicationInsights SDK code to identify patterns that might cause issues with esbuild in Cloudflare Workers:

- Looks for `Object.defineProperty` calls
- Checks for `.name` property access or assignment
- Identifies use of `__name` metadata
- Scans for dynamic function creation and property redefinition

Usage:
```bash
node analyze-appinsights.js
```

### 4. Testing esbuild Configurations (`test-esbuild.js`)

This script tests different esbuild configurations to understand how they process function names and properties:

- Creates test code with various function types
- Builds with different esbuild configurations
- Analyzes the output for `__name` helper functions and property definitions

Usage:
```bash
node test-esbuild.js
```

## Expected Results

After running these scripts, you should be able to:

1. Reproduce the "Cannot redefine property: name" error in Cloudflare Workers
2. Understand how esbuild processes function names and properties
3. Identify patterns in the ApplicationInsights SDK that trigger esbuild to add property redefinition code
4. Test workarounds to see if they resolve the issue

## Key Findings

(This section will be updated after running the reproduction scripts and analyzing the results)

## Recommendations

Based on the reproduction and analysis, potential solutions might include:

1. Modifying the esbuild configuration when bundling for Cloudflare Workers
2. Adding specific detection for Cloudflare Workers environments in the SDK
3. Providing guidance to users on how to properly initialize the SDK in SSR contexts
4. Restructuring specific parts of the SDK to avoid triggering esbuild's property redefinition

## References

- [ApplicationInsights-JS Issue #2523](https://github.com/microsoft/ApplicationInsights-JS/issues/2523)
- [Cloudflare Worker documentation](https://developers.cloudflare.com/workers/)
- [Angular SSR with Cloudflare](https://developers.cloudflare.com/workers/frameworks/framework-guides/angular/)