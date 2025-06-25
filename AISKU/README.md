<properties
	pageTitle="Application Insights JavaScript SDK - AISKU"
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
	ms.date="10/8/2019"/>

# Microsoft Application Insights JavaScript SDK - Web

[![GitHub Workflow Status (main)](https://img.shields.io/github/actions/workflow/status/microsoft/ApplicationInsights-JS/ci.yml?branch=main)](https://github.com/microsoft/ApplicationInsights-JS/tree/main)
[![Build Status](https://dev.azure.com/mseng/AppInsights/_apis/build/status/AppInsights%20-%20DevTools/1DS%20JavaScript%20SDK%20web%20SKU%20vNext?branchName=main)](https://dev.azure.com/mseng/AppInsights/_build/latest?definitionId=8184&branchName=main)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-web)

Application Insights SDK is a package that combines commonly used packages for Web scenarios.
Refer to [our GitHub page](https://github.com/microsoft/applicationinsights-js) for more details on getting started.

## V3.x Release Breaking changes

- Removed ES3 / IE8 Support
- Removed V1 API Backward Compatibility (Upgrading V1 -> V3)

See [Breaking Changes](https://microsoft.github.io/ApplicationInsights-JS/upgrade/v3_BreakingChanges.html)

## CDN Version Release Summary (with Size tracking)

| Version | Full Size | Raw Minified | GZip Size
|---------|-----------|--------------|-------------
| [&lt;nightly3&gt;](https://github.com/microsoft/ApplicationInsights-JS/tree/main/AISKU)  | [![full size size](https://js.monitor.azure.com/nightly/ai.3-nightly3.js.svg)](https://js.monitor.azure.com/nightly/ai.3-nightly3.js.svg)| ![minified size size](https://js.monitor.azure.com/nightly/ai.3-nightly3.min.js.svg) | ![gzip size](https://js.monitor.azure.com/nightly/ai.3-nightly3.min.js.gzip.svg)
| 3.3.9:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.9.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.9.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.9.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.9.min.js.gzip.svg)
| 3.3.8:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.8.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.8.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.8.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.8.min.js.gzip.svg)
| 3.3.7:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.7.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.7.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.7.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.7.min.js.gzip.svg)
| 3.3.6:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.6.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.6.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.6.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.6.min.js.gzip.svg)
| 3.3.5:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.5.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.5.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.5.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.5.min.js.gzip.svg)
| 3.3.4:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.4.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.4.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.4.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.4.min.js.gzip.svg)
| 3.3.3:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.3.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.3.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.3.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.3.min.js.gzip.svg)
| 3.3.2:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.2.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.2.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.2.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.2.min.js.gzip.svg)
| 3.3.1:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.1.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.1.min.js.gzip.svg)
| 3.3.0:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.3.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.3.0.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.3.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.3.0.min.js.gzip.svg)
| 3.2.2:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.2.2.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.2.2.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.2.2.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.2.2.min.js.gzip.svg)
| 3.2.1:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.2.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.2.1.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.2.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.2.1.min.js.gzip.svg)
| 3.2.0:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.2.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.2.0.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.2.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.2.0.min.js.gzip.svg)
| 3.1.2:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.1.2.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.1.2.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.1.2.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.1.2.min.js.gzip.svg)
| 3.1.1:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.1.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.1.1.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.1.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.1.1.min.js.gzip.svg)
| 3.1.0:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.1.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.1.0.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.1.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.1.0.min.js.gzip.svg)
| 3.0.9:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.9.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.9.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.9.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.8.min.js.gzip.svg)
| 3.0.8:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.8.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.8.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.8.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.8.min.js.gzip.svg)
| 3.0.7:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.7.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.7.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.7.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.7.min.js.gzip.svg)
| 3.0.6:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.6.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.6.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.6.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.5.min.js.gzip.svg)
| 3.0.5:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.5.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.5.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.5.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.5.min.js.gzip.svg)
| 3.0.4:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.4.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.4.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.4.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.4.min.js.gzip.svg)
| 3.0.3:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.3.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.3.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.3.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.3.min.js.gzip.svg)
| 3.0.2:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.2.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.2.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.2.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.2.min.js.gzip.svg)
| 3.0.1:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.1.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.1.min.js.gzip.svg)
| 3.0.0:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.3.0.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.3.0.0.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.3.0.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.3.0.0.min.js.gzip.svg)
| [<nightly>](https://github.com/microsoft/ApplicationInsights-JS/tree/master/AISKU)  | [![full size size](https://js.monitor.azure.com/nightly/ai.2-nightly.js.svg)](https://js.monitor.azure.com/nightly/ai.2-nightly.js.svg)| ![minified size size](https://js.monitor.azure.com/nightly/ai.2-nightly.min.js.svg) | ![gzip size](https://js.monitor.azure.com/nightly/ai.2-nightly.min.js.gzip.svg)
| 2.8.18:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.18.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.18.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.18.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.18.min.js.gzip.svg)
| 2.8.17:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.17.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.17.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.17.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.17.min.js.gzip.svg)
| 2.8.16:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.16.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.16.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.16.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.16.min.js.gzip.svg)
| 2.8.15:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.15.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.15.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.15.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.15.min.js.gzip.svg)
| 2.8.14:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.14.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.14.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.14.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.14.min.js.gzip.svg)
| 2.8.13:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.13.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.13.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.13.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.13.min.js.gzip.svg)
| [2.8.12](https://github.com/microsoft/ApplicationInsights-JS/tree/master/AISKU):  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.12.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.12.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.12.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.12.min.js.gzip.svg)
| 2.8.11:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.11.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.11.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.11.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.11.min.js.gzip.svg)
| 2.8.10: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.10.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.10.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.10.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.10.min.js.gzip.svg)
| 2.8.9: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.9.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.9.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.9.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.9.min.js.gzip.svg)
| 2.8.8: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.8.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.8.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.8.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.8.min.js.gzip.svg)
| 2.8.7: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.7.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.7.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.7.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.7.min.js.gzip.svg)
| 2.8.6: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.6.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.6.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.6.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.6.min.js.gzip.svg)
| 2.8.5: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.5.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.5.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.5.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.5.min.js.gzip.svg)
| 2.8.4: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.4.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.4.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.4.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.4.min.js.gzip.svg)
| 2.8.3: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.3.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.3.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.3.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.3.min.js.gzip.svg)
| 2.8.2: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.2.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.2.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.2.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.2.min.js.gzip.svg)
| 2.8.1: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.1.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.1.min.js.gzip.svg)
| 2.8.0: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.8.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.8.0.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.8.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.8.0.min.js.gzip.svg)
| 2.7.4: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.7.4.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.7.4.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.7.4.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.7.4.min.js.gzip.svg)
| 2.7.3: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.7.3.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.7.3.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.7.3.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.7.3.min.js.gzip.svg)
| 2.7.2: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.7.2.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.7.2.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.7.2.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.7.2.min.js.gzip.svg)
| 2.7.1: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.7.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.7.1.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.7.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.7.1.min.js.gzip.svg)
| 2.7.0: | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.7.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.7.0.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.7.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.7.0.min.js.gzip.svg)
| 2.6.5:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.6.5.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.6.5.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.6.5.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.6.5.min.js.gzip.svg)
| 2.6.4:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.6.4.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.6.4.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.6.4.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.6.4.min.js.gzip.svg)
| 2.6.3:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.6.3.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.6.3.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.6.3.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.6.3.min.js.gzip.svg)
| 2.6.2:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.6.2.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.6.2.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.6.2.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.6.2.min.js.gzip.svg)
| 2.6.1:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.6.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.6.1.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.6.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.6.1.min.js.gzip.svg)
| 2.6.0:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.6.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.6.0.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.6.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.6.0.min.js.gzip.svg)
| 2.5.11:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.11.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.11.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.11.min.js.gzip.svg)
| 2.5.10:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.10.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.10.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.10.min.js.gzip.svg)
| 2.5.9:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.9.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.9.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.9.min.js.gzip.svg)
| 2.5.8:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.8.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.8.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.8.min.js.gzip.svg)
| 2.5.7:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.7.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.7.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.7.min.js.gzip.svg)
| 2.5.6:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.6.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.6.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.6.min.js.gzip.svg)
| 2.5.5:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.5.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.5.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.5.min.js.gzip.svg)
| 2.5.4:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.4.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.4.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.4.min.js.gzip.svg)
| 2.5.3:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.3.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.3.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.3.min.js.gzip.svg)
| 2.5.2:  | ![full size size](https://js.monitor.azure.com/scripts/b/ai.2.5.2.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.5.2.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.5.2.min.js.gzip.svg)
| 2.5.0 - 2.5.1 | Not Deployed to CDN |  |
| 2.4.4:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.4.4.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.4.4.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.4.4.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.4.4.min.js.gzip.svg)
| 2.4.3:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.4.3.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.4.3.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.4.3.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.4.3.min.js.gzip.svg)
| 2.4.2:  | Not Deployed to CDN
| 2.4.1:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.4.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.4.1.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.4.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.4.1.min.js.gzip.svg)
| 2.4.0:  | Not Deployed to CDN
| 2.3.1:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.3.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.3.1.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.3.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.3.1.min.js.gzip.svg)
| 2.3.0:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.3.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.3.0.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.3.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.3.0.min.js.gzip.svg)
| 2.2.2:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.2.2.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.2.2.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.2.2.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.2.2.min.js.gzip.svg)
| 2.2.1:  | Not Deployed to CDN
| 2.2.0:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.2.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.2.0.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.2.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.2.0.min.js.gzip.svg)
| 2.1.0:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.1.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.1.0.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.1.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.1.0.min.js.gzip.svg)
| 2.0.1:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.0.1.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.0.1.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.0.1.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.0.1.min.js.gzip.svg)
| 2.0.0:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.2.0.0.js.svg)](https://js.monitor.azure.com/scripts/b/ai.2.0.0.js.svg) | ![minified size size](https://js.monitor.azure.com/scripts/b/ai.2.0.0.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.2.0.0.min.js.gzip.svg)


## Contributing

This project welcomes contributions and suggestions. Most contributions require you to
agree to a Contributor License Agreement (CLA) declaring that you have the right to,
and actually do, grant us the rights to use your contribution. For details, visit
https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need
to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the
instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/)
or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## License

[MIT](LICENSE)
