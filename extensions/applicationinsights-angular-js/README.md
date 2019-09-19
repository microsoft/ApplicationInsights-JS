# Microsoft Application Insights JavaScript SDK - Angular Plugin

[![Build Status](https://travis-ci.org/microsoft/ApplicationInsights-JS.svg?branch=master)](https://travis-ci.org/microsoft/ApplicationInsights-JS)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-analytics-js.svg)]()

Angular Plugin for the Application Insights Javascript SDK, enables the following:

- Tracking of router changes

Angular Plugin for the Application Insights Javascript SDK

## Getting Started

Install npm package:

```bash
npm install @microsoft/applicationinsights-angular-js
```

## Basic Usage

```js
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { AngularPlugin } from '@microsoft/applicationinsights-angular-js';

class TelemetryService {

    constructor() {
        this.angularPlugin = new AngularPlugin();
    }

    initialize(angularPluginConfig) {
        let INSTRUMENTATION_KEY = 'INSTRUMENTATION_KEY'; // Enter your instrumentation key here
        
        this.appInsights = new ApplicationInsights({
            config: {
                instrumentationKey: INSTRUMENTATION_KEY,
                extensions: [this.angularPlugin],
                extensionConfig: {
                    [this.angularPlugin.identifier]: angularPluginConfig
                }
            }
        });
        this.appInsights.loadAppInsights();
    }
}

export let ai = new TelemetryService();


import { Router } from '@angular/router';
import { ai } from './TelemetryService';

export class AppComponent {
  constructor(private router: Router, private location: Location) {
    ai.initialize({ router: this.router });
  }
}

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

### Note

Angular plugin is using newer version of typescript, make sure to build and test before you create a pull request. 
Navigate to the oot folder of Angular plugin, under /extensions/applicationinsights-angular-js:
```
npm install
npm run build
npm run test

```

## License

[MIT](LICENSE)

