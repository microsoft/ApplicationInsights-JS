# Application Insights JavaScript SDK

<properties
    pageTitle="Application Insights SDK JavaScript API"
    description="Reference doc"
    services="application-insights"
    documentationCenter=".net"
/>

<tags
    ms.service="application-insights"
    ms.workload="tbd"
    ms.tgt_pltfrm="ibiza"
    ms.devlang="na"
    ms.topic="article"
    ms.date="08/24/2015"/>

[![GitHub Workflow Status (main)](https://img.shields.io/github/actions/workflow/status/microsoft/ApplicationInsights-JS/ci.yml?branch=main)](https://github.com/microsoft/ApplicationInsights-JS/tree/main)
[![Build Status](https://dev.azure.com/mseng/AppInsights/_apis/build/status%2FAppInsights%20-%20DevTools%2F1DS%20JavaScript%20SDK%20web%20SKU%20(main%3B%20master)?branchName=main)](https://dev.azure.com/mseng/AppInsights/_build/latest?definitionId=8184&branchName=main)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web)
[![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js)
[![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js.gzip.svg)](https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js)

## Before Getting Started

This SDK is not for non-browser environments, for example, the Node.js applications.

For instrumenting a Node.js app, the recommended SDK is the [ApplicationInsights-node.js repository](https://github.com/microsoft/ApplicationInsights-node.js).

ES3 support has been removed from the latest version (v3.x), if required [see for ES3/IE8 Support](https://microsoft.github.io/ApplicationInsights-JS/es3_Support.html
)

## Release Versions

| Version | Details
|---------|--------------------------
| <b>[3.x](https://github.com/microsoft/ApplicationInsights-JS/tree/main)<br/><sub>(main)</sub> </b>| Current supported release from April '2023.<br/>Supports dynamic configuration changes/updates after initialization. Supports all features of v2 except with the known <b>[Breaking changes from previous versions](https://microsoft.github.io/ApplicationInsights-JS/upgrade/v3_BreakingChanges.html)</b> and does NOT support the previous v1.x compatible API proxy layer, it also removes support for ES3 / IE8. Minimum supported Runtime is now ES5 (IE9+).
| [2.x](https://github.com/microsoft/ApplicationInsights-JS/tree/master)<br/><sub>(master)</sub> | Feature freeze from March '2023, security fixes and critical bugs only.<br />Supports adding / removing extensions and full unloading/removal of the SDK after initialization. Last version to support ES3 (IE8+), also provides a v1.x compatible API proxy layer for upgrading from V1.x.
| [1.0.x](https://github.com/microsoft/ApplicationInsights-JS/tree/legacy-v1)<br/><sub>(legacy-v1)</sub> | No longer actively maintained -- please Upgrade. The documentation for `applicationinsights-js@1.0.x` has moved [here](https://github.com/microsoft/ApplicationInsights-JS/tree/master/legacy/README.md). If you are looking to upgrade to the new version of the SDK, please see the [Upgrade Guide](https://microsoft.github.io/ApplicationInsights-JS/upgrade/v2_UpgradeGuide.html). | Not actively maintained, please upgrade.


### Docs

- [Performance Monitoring](./PerformanceMonitoring.md)
- [Dependency Listeners](./Dependency.md)
- [SDK Load Failure](./SdkLoadFailure.md)

### FAQ

- [Create an Issue](https://github.com/microsoft/ApplicationInsights-JS/issues/new/choose)
- [Using Azure API Management as a proxy for Application Insights Telemetry](https://techcommunity.microsoft.com/blog/azureobservabilityblog/using-azure-api-management-as-a-proxy-for-application-insights-telemetry/4422236)
- [ES3 Support](./es3_Support.md)
- [Page Unload Event Handling](./PageUnloadEvents.md)
- [V2 Upgrade Guide](./upgrade/v2_UpgradeGuide.md)
- [V3 Breaking Changes](./upgrade/v3_BreakingChanges.md)

[Back to GitHub](https://github.com/Microsoft/ApplicationInsights-JS)