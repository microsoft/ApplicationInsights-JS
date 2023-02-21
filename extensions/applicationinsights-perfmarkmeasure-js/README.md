# Microsoft Application Insights JavaScript SDK - Performance Mark and Measure Plugin

[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-perfmarkmeasure-js.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-perfmarkmeasure-js)

Performance Mark and Measure Manager Plugin for the Application Insights Javascript SDK is a replacement for the default Performance manager to 
use the ```window.performance```, ```mark``` and ```measure``` api calls for the browsers.

It is intended that this plugin is to be used during development/testing only as enabling performance monitoring can affect the performance of the system.
And there is a limit on the number of performance events that browsers will retain.

## Getting Started

See the [basic documentation](https://github.com/microsoft/ApplicationInsights-JS/blob/master/docs/PerformanceMonitoring.md) on the performance monitoring support helpers and interfaces, this extension builds on top of the basic support.

## NPM Setup

Install npm package:

```bash
npm install --save @microsoft/applicationinsights-applicationinsights-perfmarkmeasure-js @microsoft/applicationinsights-web
```

```js

import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { PerfMarkMeasureManager } from '@microsoft/applicationinsights-perfmarkmeasure-js';

const perfManager = new PerfMarkMeasureManager();

// Application Insights Configuration
const configObj = {
  connectionString: 'YOUR CONNECTION STRING",
};

const appInsights = new ApplicationInsights({ config: configObj });
appInsights.loadAppInsights();
appInsights.core.setPerfMgr(perfManager);
```

### Direct usage with the doPerf() helper

```js
import { doPerf, PerfMarkMeasureManager } from '@microsoft/applicationinsights-applicationinsights-perfmarkmeasure-js';

const perfManager = new PerfMarkMeasureManager();

doPerf(perfManager, () => "code", (perfEvent) => {
    // Code to run that will have a mark and measure
});

// window.performance will now contain 
// - a mark called 'ai.prfmrk.code'
// - a measure called 'ai.prf.msr.code'
```

### Direct usage with the doPerf() helper and a notification manager

```js
import { INotificationManager  } from '@microsoft/applicationinsights-core-js';
import { doPerf, IPerfEvent, PerfMarkMeasureManager } from '@microsoft/applicationinsights-applicationinsights-perfmarkmeasure-js';

let perfEvents: IPerfEvent[] = [];
const perfManager = new PerfMarkMeasureManager(
    {
        // config
    },
    {
        perfEvent: (perfEvent) => {
            // Called after the doPerf() function finishes
            perfEvents.push(perfEvent);
        }
    } as INotificationManager);

doPerf(perfManager, () => "code", (perfEvent) => {
    // Code to run that will have a mark and measure
});

// window.performance will now contain 
// - a mark called 'ai.prfmrk.code'
// - a measure called 'ai.prf.msr.code'
// perfEvents.length === 1 with perfEvents[0].name === "code"

```

## CDN Usage

```html
<script src="https://js.monitor.azure.com/scripts/b/ext/ai.prfmm-mgr.2.min.js"></script>
<script type="application/javascript">
    const perfManager = new Microsoft.ApplicationInsights.PerfMarkMeasureManager();

    Microsoft.ApplicationInsights.doPerf(perfManager, () => "code", (perfEvent) => {
        // Code to run that will have a mark and measure
    });

    // window.performance will now contain 
    // - a mark called 'ai.prfmrk.code'
    // - a measure called 'ai.prf.msr.code'
</script>
```

Also see the [Example Html Usage](./example/cdn-usage.html)

## Configuration Options

All of the configuration options are optional

### IPerfMarkMeasureConfiguration

| Name | Type | Description
|------|-----------|--------------------
| useMarks | boolean | Should the Performance manager create and use window.performance.mark(), defaults to true
| markPrefix | string | Identifies the prefix for the mark, defaults to "ai.prfmrk.", the event name is appended for the mark
| uniqueNames | boolean | Make the marks and measures unique by appending a numeric value to the prefix value, defaults to false. Marks and measure for the same perfEvent will be assigned the same unique numeric value
| markNameMap | { [key: string]: string } | Provides a mapping between the internal perf names and the value used to create the mark, when a map is provided but no mapping is present that event will be ignored.
| useEndMarks | boolean | Should the Performance manager create a mark when the event is fired, defaults to false
| markEndPrefix | string | Identifies the prefix for the "end" mark of a perf event, defaults to "ai.prfmrk.end.", the event name is appended for the mark
| useMeasures | boolean | Should the Performance manager create and use window.performance.measure(), defaults to true
| measurePrefix | string | Identifies the prefix for the mark, defaults to "ai.prfmsr.", the event name is appended for the measure name
| measureNameMap | { [key: string]: string } | Provides a mapping between the internal perf names and the value used to create the measure, when no measureNameMap is provided this will default to using the markNameMap and when a map is provided but no mapping is present that event will be ignored.

Example with config

```typescript
import { doPerf } from '@microsoft/applicationinsights-core-js';
import { PerfMarkMeasureManager } from '@microsoft/applicationinsights-applicationinsights-perfmarkmeasure-js';

const perfManager = new PerfMarkMeasureManager({
    useMarks: true,
    useEndMarks: true,
    markPrefix: "tst.mark.",
    markEndPrefix: "tst.markend.",
    measurePrefix: "tst.measure.",
    markNameMap: {
        "test": "mapped1",
        "test3": "mapped3"
    },
    measureNameMap: {
        "test": "measure1",
        "test2": "measure2"
    }
});

doPerf(manager, () => "test", (perfEvent) => {
    // A mark has been added to window.performance called 'tst.mark.test'
});

// Another mark has been added to window.performance called 'tst.markend.test'
// And a measure will also exist in window.performance called 'tst.measure.test'

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
