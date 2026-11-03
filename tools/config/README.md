# 1DS JavaScript Web Config

1DS JavaScript Web Config CDN.

## Current Version

V1

## Endpoints

### Next

https://js.monitor.azure.com/next/ai.config.1.cfg.json

New releases and release candidates are published to `next`; beta prerelease versions retain their
`-beta` filenames and use `next/ai_test.config.<version>.cfg.json`. Activating a beta prerelease in
`next` updates the test configuration aliases, not the release configuration aliases.
Existing `beta` files remain available for legacy consumers and version listing, but are no longer published or activated.

### Public

https://js.monitor.azure.com/scripts/b/ai.config.1.cfg.json

### Nightly

https://js.monitor.azure.com/nightly/ai_test.config.1-nightly3.cfg.json

### **Note**

For `config.json` changes:

**whenever cfg changes, incoming new undefined fields will NOT replace previous values, so make sure that new configs have each field set as expected.**
