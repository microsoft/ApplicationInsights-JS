# Microsoft Application Insights JavaScript SDK - Tee Channel

This Channel is used to support multiple channel queues as defined by the `channels` configuration, this channel will execute
all of the channels as defined in the `channels` array from index 1 onwards (`channels[1..X]`). The main ApplicationInsights
Core will process the channels as defined in the `channels[0]`.

[![GitHub Workflow Status (main)](https://img.shields.io/github/actions/workflow/status/microsoft/ApplicationInsights-JS/ci.yml?branch=main)](https://github.com/microsoft/ApplicationInsights-JS/tree/main)
[![Build Status](https://dev.azure.com/mseng/AppInsights/_apis/build/status%2FAppInsights%20-%20DevTools%2F1DS%20JavaScript%20SDK%20web%20SKU%20(main%3B%20master)?branchName=main)](https://dev.azure.com/mseng/AppInsights/_build/latest?definitionId=8184&branchName=main)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-channel-js.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-channel-js)

## Getting Started

## NPM Setup (ignore if using Snippet Setup)

Install npm package:

```bash
npm install --save @microsoft/applicationinsights-teechannel-js @microsoft/applicationinsights-web
```

```js

import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { TeeChannel } from '@microsoft/applicationinsights-teechannel-js';

const teeChannel = new TeeChannel();

// TeeChannel configuration
const teeChannelConfig = {
    teeChannels: [[]],
    ignoreCoreChannels: false
};

// Application Insights Configuration passing the tee Channel via extensions
const configObj = {
  instrumentationKey: "YOUR INSTRUMENTATION KEY",
  extensions: [teeChannel],
  extensionConfig: {
    [teeChannel.identifier]: teeChannelConfig
  },
};

const appInsights = new ApplicationInsights({ config: configObj });
appInsights.loadAppInsights();
```

## [Configuration](https://microsoft.github.io/ApplicationInsights-JS/webSdk/interfaces/ITeeChannelConfig.html)

| Name                  | Type                               | Default    | Description
| --------------------- | -----------------------------------| -----------| ----------------------------------------------------------------------------------------------------------------
| [teeChannels](https://microsoft.github.io/ApplicationInsights-JS/webSdk/interfaces/ITeeChannelConfig.html#teeChannels)           | `IChannelControls`[][]             | undefined  | Defines the Channels specific to the TeeChannel
| [ignoreCoreChannels](https://microsoft.github.io/ApplicationInsights-JS/webSdk/interfaces/ITeeChannelConfig.html#ignoreCoreChannels)    | boolean                            | false      |By default the TeeChannel will use the core configuration `channels` (starting at index 1 `channels[1.xxx]`) as separate tee'd channel chains for processing events. This configuration allow you to ignore any additional core channels and only use the `teeChannels`

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
