# Microsoft Application Insights JavaScript SDK - React Plugin

[![Build Status](https://travis-ci.org/microsoft/ApplicationInsights-JS.svg?branch=master)](https://travis-ci.org/microsoft/ApplicationInsights-JS)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-react-js.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-react-js)

React Plugin for the Application Insights Javascript SDK, enables the following:

- Tracking of router changes
- React components usage statistics

React Plugin for the Application Insights Javascript SDK

## Getting Started

Install npm package:

```bash
npm install @microsoft/applicationinsights-react-js
```

## Basic Usage

```js
import React from 'react';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin, withAITracking } from '@microsoft/applicationinsights-react-js';
import { createBrowserHistory } from "history";

const browserHistory = createBrowserHistory({ basename: '' });
var reactPlugin = new ReactPlugin();
var appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: 'YOUR_INSTRUMENTATION_KEY_GOES_HERE',
        extensions: [reactPlugin],
        extensionConfig: {
          [reactPlugin.identifier]: { history: browserHistory }
        }
    }
});
appInsights.loadAppInsights();

// To instrument various React components usage tracking, apply the `withAITracking` higher-order
// component function.

class MyComponent extends React.Component {
    ...
}

export default withAITracking(reactPlugin, MyComponent);
```

## Configuration

| Name | Default | Description |
|------|---------|-------------|
| history | null | React router history for more information see the [documentation][react-router] of the `react-router` package. |

#### React components usage tracking

To instrument various React components usage tracking, apply the `withAITracking` higher-order
component function.


It will measure time from the `ComponentDidMount` event through the `ComponentWillUnmount` event.
However, in order to make this more accurate, it will subtract the time in which the user was idle.
In other words, `React Component Engaged Time = ComponentWillUnmount timestamp - ComponentDidMount timestamp - idle time`.

To see this metric in the Azure portal you need to navigate to the Application Insights resource, select "Metrics" tab and configure the empty charts to display Custom metric named "React Component Engaged Time (seconds)", select aggregation (sum, avg, etc.) of your liking and apply split by "Component Name".

![image](https://user-images.githubusercontent.com/1005174/51357010-c168ac80-1a71-11e9-8df9-348febd2d6dd.png)

You can also run custom queries to slice and dice AI data to generate reports and visualizations as per your requirements. In the Azure portal, navigate to the Application Insights resource, select "Analytics" from the top menu of the Overview tab and run your query.

![image](https://user-images.githubusercontent.com/1005174/51356821-e872ae80-1a70-11e9-9e12-e56a1edcde68.png)

Please note that it can take up to 10 minutes for new custom metric to appear in the Azure Portal.


## Sample App

[Azure-Samples/application-insights-react-demo](https://github.com/Azure-Samples/application-insights-react-demo).



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

[react-router]: https://github.com/ReactTraining/react-router/blob/master/FAQ.md#how-do-i-access-the-history-object-outside-of-components
