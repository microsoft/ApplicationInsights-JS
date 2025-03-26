
# Microsoft Application Insights JavaScript SDK - CfgSync Plugin

[![GitHub Workflow Status (main)](https://img.shields.io/github/actions/workflow/status/microsoft/ApplicationInsights-JS/ci.yml?branch=main)](https://github.com/microsoft/ApplicationInsights-JS/tree/main)
[![Build Status](https://dev.azure.com/mseng/AppInsights/_apis/build/status/AppInsights%20-%20DevTools/1DS%20JavaScript%20SDK%20web%20SKU%20vNext?branchName=main)](https://dev.azure.com/mseng/AppInsights/_build/latest?definitionId=8184&branchName=main)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-cfgsync-js.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-cfgsync-js)

Application Insights CfgSync Plugin enables configuration change communication among mutiple instances.
Refer to [our GitHub page](https://github.com/microsoft/ApplicationInsights-JS) for more details on getting started.

## Configuration

| Name | Type | Default | Description |
|------|------|---------|-------------|
| syncMode | ICfgSyncMode<br>[Optional]| Broadcast | Sync mode of current instance. If set to `None`, current instance will NOT receive or broadcast config changes. If set to `Broadcast`, current instance will ONLY broadcast changes. If set to `Receive`, instance will ONLY receive config changes but NOT broadcast config changes. |
| customEvtName | string<br>[Optional] | ai_cfgsync | Event name for sending or listening to configuration change details. |
| cfgUrl | string<br>[Optional] | null | CDN endpoint for fetching configuration. If cfgUrl is defined, instance will NOT listen to core configuration changes. Details defined in the CDN endpoint should follow `ICfgSyncCdnConfig` interface. |
| blkCdnCfg | boolean<br>[Optional] | false | Determines if fetching the CDN endpoint should be blocked or not. |
| onCfgChangeReceive | function<br>[Optional] | null | Overrides callback function to handle event details when changes are received via event listener. |
| overrideSyncFn | function<br>[Optional] | null | Overrides sync() function to broadcast changes. |
| overrideFetchFn | function<br>[Optional] | null | Overrides fetch function to get config from cfgUrl when cfgUrl is defined. |
| nonOverrideConfigs | NonOverrideCfg<br>[Optional] | {instrumentationKey: true, connectionString: true, endpointUrl: true } | When current instance is set with syncMode: `Receive`, config fields under nonOverrideConfigs will NOT be changed by any confif details sent out from other instances. NOTE: this config will be ONLY applied during initialization, so it won't be changed dynamically. |
| scheduleFetchTimeout | number<br>[Optional] | 30 mins | Identifies the time interval (in milliseconds) for fetching config details from cfgUrl when cfgUrl is defined. If set to 0, the fetch operation will only be called once during initialization. |


## Contributing

This project welcomes contributions and suggestions. Most contributions require you to
agree to a Contributor License Agreement (CLA) declaring that you have the right to,
and actually do, grant us the rights to use your contribution. For details, visit
<https://cla.microsoft.com>.

When you submit a pull request, a CLA-bot will automatically determine whether you need
to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the
instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/)
or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at <https://go.microsoft.com/fwlink/?LinkID=824704>. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## License

[MIT](LICENSE)
