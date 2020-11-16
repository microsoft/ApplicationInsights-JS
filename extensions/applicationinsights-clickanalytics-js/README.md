# Microsoft Application Insights JavaScript SDK - Click Analytics Plugin

Click Analytics Plugin for the Application Insights Javascript SDK, enables the following:

- Automatic tracking of the click events on web pages based on data meta tags.

## Getting Started

## NPM Setup (ignore if using Snippet Setup)

Install npm package:

```bash
npm install --save @microsoft/applicationinsights-clickanalytics-js @microsoft/applicationinsights-web
```

```js
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { DebugPlugin } from ' @microsoft/applicationinsights-clickanalytics-js';

const clickPluginInstance = new ClickAnalyticsPlugin();
// Click Analytics configuration
const clickPluginConfig = {
    autoCapture : true
}
// Application Insights Configuration
const configObj = {
    instrumentationKey: "YOUR INSTRUMENTATION KEY",
    extensions: [
      clickPluginInstance
    ],
    extensionConfig: {
        [clickPluginInstance.identifier] : clickPluginConfig
    },
};

const appInsights = new ApplicationInsights({ config: configObj });
appInsights.loadAppInsights();
```

## Consuming via the CDN using the Snippet Setup (Ignore if using NPM Setup)

```html
<script type="text/javascript" src="https://js.monitor.azure.com/scripts/b/ai.2.min.js"></script>
<script type="text/javascript" src="cdnPathToCLickAnalyticsJS"></script>

<script type="text/javascript">

var clickPluginInstance = new Microsoft.ApplicationInsights.ClickAnalyticsPlugin();
// Click Analytics configuration
var clickPluginConfig = {
    autoCapture : true
}
// Application Insights Configuration
var configObj = {
    instrumentationKey: "YOUR INSTRUMENTATION KEY",
    extensions: [
      clickPluginInstance
    ],
    extensionConfig: {
        [clickPluginInstance.identifier] : clickPluginConfig
    },
};

var appInsights = new Microsoft.ApplicationInsights.ApplicationInsights({ config: configObj });
appInsights.loadAppInsights();

</script>
```

## Configuration

| Name | Type | Default | Description |
|------|------|---------|-------------|
| autoCapture | boolean | true | Automatic capture configuration. |
| callback | IValueCallback | null | Callbacks configuration |
| pageTags | string | null | Page tags |
| dataTags | ICustomDataTags | null | Custom Data Tags provided to ovverride default tags used to capture click data. |
| urlCollectHash | boolean | false | Enables the logging of values after a "#" character of the URL. |
| urlCollectQuery | boolean | false | Enables the logging of the query string of the URL. |
| behaviorValidator | Function | null | Callback function to use for the data-bhvr value validation. Documentation still in progress for this feature.|
| defaultRightClickBhvr | string (or) number | '' | Default Behavior value when Right Click event has occured. This value will be overriden if the element has the data-*-bhvr attribute.|

## IValueCallback

| Name | Type | Default | Description |
|------|------|---------|-------------|
| pageName | Function | null | Function to override the default pageName capturing behavior. |
| pageActionPageTags | Function | null | A callback function to augument the default pageTags collected during pageAction event. |
| contentName | Function | null | A callback function to populate customized contentName. |

## ICustomDataTags

| Name | Type | Default | Description |
|------|------|---------|-------------|
| useDefaultContentName | boolean | false | When a particular element is not tagged with default customDataPrefix or customDataPrefix is not provided by user, this flag is used to collect standard HTML attribute for contentName. |
| customDataPrefix | string | data- | Automatic capture content name and value of elements which are tagged with provided prefix. |
| aiBlobAttributeTag | string | ai-blob | Click Analytics supports a JSON blob content meta data tagging instead of individual data-* attributes. |
| metaDataPrefix | string | null | Automatic capture metadata name and content with provided prefix. |
| captureAllMetaDataContent | string | null | Automatic capture all metadata names and content. Default is false. If enabled this will override provided metaTagPrefix. |
| parentDataTag | string | null | Stop traversing up the DOM to capture content name and value of elements when encountered with this tag. |
| dntDataTag | string | ai-dnt | Custom attribute Tag to not track telemetry data. |

## Usage with Example Config (JS)

```html
<script type="text/javascript" src="https://js.monitor.azure.com/scripts/b/ai.2.min.js"></script>
<script type="text/javascript" src="cdnPathToCLickAnalyticsJS"></script>

<script type="text/javascript">

var clickPluginInstance = new Microsoft.ApplicationInsights.ClickAnalyticsPlugin();
// Click Analytics configuration
var clickPluginConfig = {
    autoCapture : true
}
// Application Insights Configuration
var configObj = {
    instrumentationKey: "YOUR INSTRUMENTATION KEY",
    extensions: [
      clickPluginInstance
    ],
    extensionConfig: {
        [clickPluginInstance.identifier] : clickPluginConfig
    },
};

var appInsights = new Microsoft.ApplicationInsights.ApplicationInsights({ config: configObj });
appInsights.loadAppInsights();

</script>



```

## Sample App

[Simple Web App with Click Analytics Plugin Enabled](https://github.com/kryalama/application-insights-clickanalytics-demo)

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