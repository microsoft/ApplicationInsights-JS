# Microsoft Application Insights JavaScript SDK - Debug Plugin

## [BETA]


[![Build Status](https://travis-ci.org/microsoft/ApplicationInsights-JS.svg?branch=master)](https://travis-ci.org/microsoft/ApplicationInsights-JS)
[![npm version](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-debugplugin-js.svg)](https://badge.fury.io/js/%40microsoft%2Fapplicationinsights-debugplugin-js)
[![gzip size](https://img.badgesize.io/https://az416426.vo.msecnd.net/scripts/b/ext/ai.dbg.2.min.js.svg?compression=gzip&softmax=30000&max=35000)](https://img.badgesize.io/https://az416426.vo.msecnd.net/scripts/b/ext/ai.dbg.2.min.js.svg?compression=gzip&softmax=20000&max=25000)
[![minified size size](https://img.badgesize.io/https://az416426.vo.msecnd.net/scripts/b/ext/ai.dbg.2.min.js.svg?label=minified%20size)](https://img.badgesize.io/https://az416426.vo.msecnd.net/scripts/b/ext/ai.dbg.2.min.js.svg?label=minified%20size)


This README is broken down into several parts:

- **Who** should use this plugin
- **What** this plugin does
- **When** to use this plugin
- **Where** to get more information
- **Why** this plugin exists
- **Getting Started**
- **Supported Browsers**
- **Breaking Changes**
- **Contributing**

these parts go together to explain the reasoning for this plugin's existance and provides
an explaination as to how everything works. Each of these sections will finish with a
bullet-point list that summarizes the section

## Who Should Use This Plugin

This plugin is tailored towards *developers* that utilize or are familiar with this
Application Insights Javascript SDK. This can also be used by various customer support services,
or those that just wish to dig into things to get a better understanding of how it all works.

This plugin should **not** be included in a finalized website. This is not for the end-user.

In short:

- Developers
- Customer Support services
- **not** the end-user

## What This Plugin Does

### The Bubble

This plugin dynamically injects dynamic components into the webpage to provice a rich debugging
experience for Application Insights JS. Upon initialization, there will be a semi-transparent
bubble with a number in the bottom-right corner of the screen:

![closed bubble](./readme-res/bubble_closed.png)

this will reach full opacity upon hover, at which point it will also append "AppInsights"
to before the number:

![bubble on hover](readme-res/bubble_hover.png)

This number is here to indicate the total number of calls to tracked functions, such as
`trackEvent` or `trackPageView`. By default, every useful function is tracked.

When there's an error (`trackException`), a `(!)` will be appended to the number within the
bubble like so:

![bubble on exception](readme-res/bubble_error.png)

When this bubble is clicked, it will expand to a more detailed view, showing the frequency
of each tracked function call. It will also get rid of the error indicator:

![expanded bubble](readme-res/bubble_expanded.png)

This bubble can be clicked once more to minimize it.

### The Detailed View

When the bubble is open, clicking the "toggle detailed view" button will bring down a view
that shows a list of event objects. By clicking on one of these objects, you can open it up
in tree-view fasion:

![tree view](readme-res/tree_view.png)

This is modeled after the developer tools of Chrome/Edge to keep things familiar.

Each node that can be opened further has a `[+]` before it, whereas ones that can be minimized will
have a `[-]` before it. Nodes like this also have their type, that being object or array, denoted
next to them with `{}` or `[]` respectively. Between these braces/brackets will be a number.
This number shows the number of entries within that object or array.

There a button above these entries that says "copy current node." This button will, if a node is
selected, copy the node and its children up to a certain depth to the clipboard as a JSON string.
This will also handle circular references.

## When Should This Plugin Be Used

This plugin is used when:
- data isn't reaching azure
- things don't appear to be tracked
- something is crashing and developers are unsure if the plugin is causing it

## Where to get More Information

TBD

## Why This Plugin Exists

ApplicationInsights-js has lacked a solid way to debug issues for awhile now. Often, developers
had to dig through code and go to a multitude of different areas to even begin diagnosing an issue.

The impact of all of these will bring about a much better development experience for those using
ApplicationInsights-js. Just the fact that they are able to see when a function is fired will
dramatically cut-down on time spent diagnosing and eliminating bugs. The tree view will foster
communication between developers and testers, allowing them to copy and send important pieces of data
elsewhere.

Instead of needing to come to the ApplicationInsights-js team with every bug encountered, in many
cases developers will be able to use these tools to diagnose things that are going wrong on their own
thanks to this new layer of transparency.

## Getting Started

run the following console command to install appInsights and the debug plugin:

```zsh
npm install --save @microsoft/applicationinsights-debugplugin @microsoft/applicationinsights-web
```

## Basic Usage

### NPM Setup (ignore if using Snippet Setup)

```js
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { DebugPlugin } from '@microsoft/applicationinsights-debugplugin-js';

const toTrack = [
    'trackEvent',
    'trackPageView',
    'trackPageViewPerformance',
    'trackException',
    'trackTrace',
    'trackMetric',
    'trackDependencyData',
    'throwInternal',        // called when a message is logged internally
    'logInternalMessage',   // called when a message is logged internally
    'triggerSend',          // called when data is queued to be sent to the server
    '_sender',              // called when data is sent to the server
];

const debugPluginInstance = new DebugPlugin();
const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: 'YOUR_INSTRUMENTATION_KEY_GOES_HERE',
        extensions: [debugPluginInstance],
        extensionConfig: {
            [DebugPlugin.identifier]: {
                trackers: toTrack
            }
        }
    }
});
appInsights.loadAppInsights();
appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
```

### Consuming via the CDN using the Snippet Setup (Ignore if using NPM Setup)

```html
<script type="text/javascript" src="https://az416426.vo.msecnd.net/scripts/b/ext/ai.dbg.2.min.js"></script>

<script type="text/javascript">
<!-- Snippet code removed for brevity -- copy from main readme --!> {
src: "https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js", // The SDK URL Source
cfg: { // Application Insights Configuration
    instrumentationKey: "INSTRUMENTATION_KEY",
    extensions: [new Microsoft.ApplicationInsights.DebugPlugin()],
        extensionConfig: {
            ["DebugPlugin"]: {
                trackers: [
                    'trackEvent',
                    'trackPageView',
                    'trackPageViewPerformance',
                    'trackException',
                    'trackTrace',
                    'trackMetric',
                    'trackDependencyData',
                    'throwInternal',        // called when a message is logged internally
                    'logInternalMessage',   // called when a message is logged internally
                    'triggerSend',          // called when data is queued to be sent to the server
                    '_sender',              // called when data is sent to the server
                ]
            }
        }
}});
</script>
```

## Configuration

TBD.

| Name | Default | Description |
|------|---------|-------------|
| trackers | string[] | TBD.

## Supported Browsers

Our goal for the Application Insights Javascript SDK is to at least ensure that older, browsers
running ES3 (IE7) don't crash when this plugin is loaded. **However,** because this is a
*UI-based* plugin tailored for **developers** that is **not** meant to be used in a finalized
website, there is an expectation that developers would be testing and debugging this particular
data in modern browsers with modern tooling.

As such, supporting Internet Explorer 7 and other browsers running ES3 is no-longer a priority
for this plugin.

This can be expected to work in:

- Firefox
- Chrome
- Edge (new and old)
- Internet Explorer 11 (under construction)

## Known Potential Breaking Changes

- Configuration options

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

---

[MIT](LICENSE)
