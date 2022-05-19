# Microsoft Application Insights JavaScript SDK - Web Snippet

[![Build Status](https://travis-ci.org/microsoft/ApplicationInsights-JS.svg?branch=master)](https://travis-ci.org/microsoft/ApplicationInsights-JS)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web-snippet.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web-snippet)

Web Snippet for the Application Insights Javascript SDK

This project exists to publish latest Application Insights Javascript Web Snippet.

## Basic Usage

Add the Application Insights Web Snippet to your app's dependencies and package.json.
```
npm i @microsoft/applicationinsights-web-snippet
```


Import web snippet from the package.
```
import { webSnippet } from "@microsoft/applicationinsights-web-snippet";
```


Replace "INSTRUMENTATION_KEY" with valid Instrumentation Key.
```
webSnippet.replace("INSTRUMENTATION_KEY", your_valid_ikey);
```

More details on web snippet, see [Web Snippet](https://github.com/microsoft/ApplicationInsights-JS#snippet-setup-ignore-if-using-npm-setup).

## Build
```
npm install -g grunt-cli
npm install
npm run build --silent
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