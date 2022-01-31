# Microsoft Application Insights JavaScript SDK - Shims

[![Build Status](https://travis-ci.org/microsoft/ApplicationInsights-JS.svg?branch=master)](https://travis-ci.org/microsoft/ApplicationInsights-JS)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-shims.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-shims)

Shims for the Application Insights Javascript SDK

This project exists to break the dependency on the version of tslib that is used during the build and deploy, this is
mostly due to several breaking changes that have reduced our ability to publish fixes.

While the Application Insights JS SDK will use the stubs defined in this packaging for the browser instances (those that are
uploaded to the CDN) they are built using the polyfill pattern, so if a global implementation of __extends() and __assign() already exist
those versions will be used.

## Global __extends() and __assign() changes - v2.0.0 or greater

From v2.0.0 or greater the globally defined ```__extends()``` and ```__assign()``` methods are no longer exposed as global by default.

If you need to expose the TsLib helpers globally (which occurred by default for v1.x.x) you now will need to import and call the ```__exposeGlobalTsLib()``` function.

```javascript
import { __exposeGlobalTsLib } from "@microsoft/applicationinsights-shims";

__exposeGlobalTsLib();
```

## Build:
```
npm install -g grunt-cli
npm install
npm run build --silent
```

## Run unit tests:
```
npm run test
```

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## License

[MIT](LICENSE)