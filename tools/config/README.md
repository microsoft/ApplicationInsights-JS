# 1DS JavaScript Web Config

1DS JavaScript Web Config CDN.

## Current Version

V1

## Endpoints

### Next

https://js.monitor.azure.com/next/ai.config.1.cfg.json

New releases and release candidates are published to `next`. Dev and nightly builds retain the
`ai_test.config.*` prefix and their corresponding folders. Unsupported release types fail validation;
beta release/channel options are no longer supported. Existing CDN files remain untouched.

### Public

https://js.monitor.azure.com/scripts/b/ai.config.1.cfg.json

### Nightly

https://js.monitor.azure.com/nightly/ai_test.config.1-nightly3.cfg.json

### **Note**

For `config.json` changes:

**whenever cfg changes, incoming new undefined fields will NOT replace previous values, so make sure that new configs have each field set as expected.**
