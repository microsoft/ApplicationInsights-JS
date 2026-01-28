# Migrating from @microsoft/applicationinsights-common to @microsoft/applicationinsights-core-js

## Overview

As of version 3.4.0, the `@microsoft/applicationinsights-common` package has been merged into 
`@microsoft/applicationinsights-core-js`. This consolidation simplifies the dependency tree 
and improves tree-shaking capabilities while maintaining full backward compatibility.

## What Changed?

- All functionality from `applicationinsights-common` is now exported from `applicationinsights-core-js`
- The `applicationinsights-common` package still exists as a compatibility layer (re-exports from Core)
- No breaking changes to public APIs
- All imports work the same, just from a different package

## Migration Steps

### Step 1: Update Dependencies

In your `package.json`:

```json
{
  "dependencies": {
    // Before
    "@microsoft/applicationinsights-common": "3.3.11",
    "@microsoft/applicationinsights-core-js": "3.3.11"
    
    // After
    "@microsoft/applicationinsights-core-js": "3.4.0"
    // Remove applicationinsights-common dependency
  }
}
```

### Step 2: Update Imports

Find and replace in your source files:

```typescript
// Before
import { IConfig, ContextTagKeys, Event } from "@microsoft/applicationinsights-common";

// After
import { IConfig, ContextTagKeys, Event } from "@microsoft/applicationinsights-core-js";
```

### Automated Migration

You can use a script to automate the migration:

```bash
# Replace imports in TypeScript files
find ./src -name "*.ts" -exec sed -i 's/@microsoft\/applicationinsights-common/@microsoft\/applicationinsights-core-js/g' {} +

# Update package.json manually or with jq
```

## Do I Need to Migrate Immediately?

**No.** The `applicationinsights-common` package will continue to work through version 3.x as a 
compatibility layer. However, we recommend migrating when convenient as:

- The Common package will be removed in version 4.0.0
- Direct Core imports result in smaller bundles (better tree-shaking)
- Future features will only be added to Core

## Timeline

- **Version 3.4.0** (Current): Common merged into Core, compatibility layer introduced
- **Version 3.x** (Ongoing): Both import styles supported
- **Version 4.0.0** (Future): Common package removed, Core imports required

## What If I Can't Migrate Yet?

The compatibility layer ensures your code continues to work without changes. However:

1. Your bundle may be slightly larger (includes the re-export layer)
2. You may see deprecation warnings in development
3. You'll need to migrate before upgrading to version 4.0.0

## Troubleshooting

### TypeScript Type Errors

If you encounter type errors after migration:

1. Ensure `@microsoft/applicationinsights-core-js` is version 3.4.0 or higher
2. Remove `@microsoft/applicationinsights-common` from dependencies
3. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
4. Restart TypeScript server in your IDE

### Import Not Found

If an import can't be found:

1. Verify the export exists in Core 3.4.0+
2. Check for typos in import names
3. Ensure you're importing from `@microsoft/applicationinsights-core-js`

### Bundle Size Increased

If your bundle size increased after migration:

1. Ensure you're using `@microsoft/applicationinsights-core-js` 3.4.0+
2. Remove `@microsoft/applicationinsights-common` from package.json
3. Rebuild with tree-shaking enabled
4. Check for unused imports and remove them

## Need Help?

- 📖 [Full Documentation](https://github.com/microsoft/ApplicationInsights-JS)
- 🐛 [Report Issues](https://github.com/microsoft/ApplicationInsights-JS/issues)
- 💬 [Discussions](https://github.com/microsoft/ApplicationInsights-JS/discussions)
