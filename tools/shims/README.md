# Microsoft Application Insights JavaScript SDK - Shims

![GitHub Workflow Status (main)](https://img.shields.io/github/actions/workflow/status/microsoft/ApplicationInsights-JS/ci.yml?branch=master)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-shims.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-shims)

Shims for the Application Insights Javascript SDK

This project exists to break the dependency on the version of tslib that is used during the build and deploy, this is
mostly due to several breaking changes that have reduced our ability to publish fixes.

While the Application Insights JS SDK will use the stubs defined in this packaging for the browser instances (those that are
uploaded to the CDN) they are built using the polyfill pattern, so if a global implementation of __extends() and __assign() already exist
those versions will be used.

## ES3 Support removed from v3.x

ES3 support has been removed from the latest version (v3.x) which is also consumed by ApplicationInsights v3.x, if required [see for ES3/IE8 Support](https://microsoft.github.io/ApplicationInsights-JS/es3_Support.html) and you will need to remain on v2.x versions

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

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## License

[MIT](LICENSE)