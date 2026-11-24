# Microsoft Application Insights JavaScript SDK - Operating System Plugin

[![GitHub Workflow Status (main)](https://img.shields.io/github/actions/workflow/status/microsoft/ApplicationInsights-JS/ci.yml?branch=main)](https://github.com/microsoft/ApplicationInsights-JS/tree/main)
[![Build Status](https://dev.azure.com/mseng/AppInsights/_apis/build/status%2FAppInsights%20-%20DevTools%2F1DS%20JavaScript%20SDK%20web%20SKU%20(main%3B%20master)?branchName=main)](https://dev.azure.com/mseng/AppInsights/_build/latest?definitionId=8184&branchName=main)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-osplugin-js.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-osplugin-js)

Microsoft Application Insights OS Plugin

## Description
1DS OS Plugin provides the functionality to retrieve customers system version, such as "Windows 11".

The full Application Insights web SDK also bundles this plugin as an opt-in feature. Set `extensionConfig.OsPlugin.enabled: true`
without installing or manually registering this package; see [full SDK setup](../../AISKU/README.md#optional-os-detection).
Automatic registration remains off by default, and the lightweight SDK is unchanged. The standalone package remains available.

## NPM Setup (ignore if using Snippet Setup)

Install npm package:

```bash
npm install --save @microsoft/applicationinsights-osplugin-js @microsoft/applicationinsights-web
```

```js

import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import {OsPlugin} from '@microsoft/applicationinsights-osplugin-js';

const osPlugin = new OsPlugin();
const appInsights = new ApplicationInsights({
  config: {
    connectionString: "YOUR_CONNECTION_STRING",
    extensionConfig:{
      [osPlugin.identifier]: {
        maxTimeout: 10000,
        mergeOsNameVersion: true
      }},
    extensions: [osPlugin]
  }
});
appInsights.loadAppInsights();
appInsights.trackEvent({name: "testEvent", properties: {testProperty: "testValue"}});

```
## [Configuration](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-osplugin-js/interfaces/IOSPluginConfiguration.html)

| Name | Type | Default | Description |
|------|------|---------|-------------|
| enabled | boolean[Optional] | undefined | `true` opts into automatic registration in the full web SDK. Unset preserves existing manual-registration behavior. `false` stops collection, releases pending telemetry without detected OS enrichment, and ignores pending lookup results. Existing cache entries are not deleted. |
| [maxTimeout](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-osplugin-js/interfaces/IOSPluginConfiguration.html#maxTimeout) | number[Optional]| 200 | Maximum time to wait for the OS plugin to return the OS information |
| [mergeOsNameVersion](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-osplugin-js/interfaces/IOSPluginConfiguration.html#mergeOsNameVersion) | boolean[Optional] | undefined | Whether to merge OS name and version. Defaults to merged `ext.os.osVer` when the Application Insights Sender is present, otherwise separate `ext.os.name` and `ext.os.ver` fields. |

Configuration changes are supported at runtime. Setting `enabled` to `false` prevents Client Hints lookups, plugin cache access, and
detected OS enrichment. Setting it to `true` resumes collection. For manually registered instances, resetting it to `undefined` also
resumes collection for backward compatibility. `isStorageUseDisabled` controls caching only and does not disable OS collection.

Browsers without the User-Agent Client Hints API continue without OS enrichment. Initial telemetry can wait up to `maxTimeout` while
detection is pending; timeout, failure, page exit, or disabling collection releases queued events. Results arriving after disable or
unload are ignored. In merged mode detected information replaces `osVer` but leaves an existing OS `name` intact; in split mode detected
values replace `name` and `ver`. Other customer-supplied fields are retained. The Application Insights Sender maps `osVer` to its OS
version tag, so use the default merged mode for that channel.

## Run unit tests:
```
npm run test
```

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