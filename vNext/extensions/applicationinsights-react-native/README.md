# Microsoft Application Insights JavaScript SDK - React Native Plugin

React Native Plugin for the Application Insights Javascript SDK

## Getting Started
This plugin relies on [`react-native-device-info`](https://github.com/rebeccahughes/react-native-device-info). You must install and link this package. Update `react-native-device-info` to support collecting the latest device names.
```zsh
npm install --save @microsoft/applicationinsights-react-native
npm install --save react-native-device-info
react-native link react-native-device-info
```

## Initializing the Plugin
To use this plugin, you only need to construct the plugin and add it as an extension to your existing Application Insights instance.
```ts
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactNativePlugin } from '@microsoft/applicationinsights-react-native';

var RNPlugin = new ReactNativePlugin();
var appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: 'YOUR_INSTRUMENTATION_KEY_GOES_HERE'
    },
    extensions: [RNPlugin]
});
appInsights.loadAppInsights();
```

## Device Information Collected
By default, this plugin automatically collects
 - Unique Device ID (also known as Installation ID)
 - Device Model Name (iPhone XS, etc.)
 - Device Type (Handset, Tablet, etc.)

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
