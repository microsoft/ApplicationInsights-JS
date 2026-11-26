# Page Unload Event Handling

## Overview

Application Insights Web SDK uses page lifecycle events to flush buffered telemetry during page navigation, browser closure, and visibility changes. This is best effort: browsers can terminate a page before its handlers run or its requests complete.

## Unload Events

The SDK listens to the following events to detect when a page is being unloaded:

1. **beforeunload** - Fired when the window, document, and its resources are about to be unloaded
2. **unload** - Fired when the document or a child resource is being unloaded. This deprecated event is only used as a fallback when neither `beforeunload` nor `pagehide` could be hooked (or both have been disabled via `disablePageUnloadEvents`).
3. **pagehide** - Fired when the browser hides the current page in the process of navigating to another page
4. **visibilitychange** (with 'hidden' state) - Fired when the content of a tab has become visible or hidden

## Modern Browser Compatibility

Modern browsers and frameworks are deprecating or changing how some page unload events work:

- **Chrome on desktop and Android** no longer runs `unload` handlers by default unless a site explicitly opts out of the deprecation. Registering a listener does not establish that it will run. See [Deprecating the unload event](https://developer.chrome.com/docs/web-platform/deprecating-unload).
- **jQuery 3.7.1+** has deprecated the use of the `unload` event, showing warning messages when it's used.
- Some modern browsers are changing the behavior of `beforeunload` event for better performance and reduced tracking potential.
- The `pagehide` event and `visibilitychange` events are becoming the recommended alternatives.
- The SDK retries listener registration when its preferred events cannot be registered.
- **By default the SDK no longer hooks the `unload` event**, it is only used as a fallback when neither `beforeunload` nor `pagehide` could be hooked.

## Configuration Options

The SDK provides configuration options to control which page lifecycle events are used:

### disablePageUnloadEvents

This configuration option allows you to specify which page unload events should not be used by the SDK.

**TypeScript Example:**
```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    disablePageUnloadEvents: ["unload"],
    /* ...Other Configuration Options... */
  }
});
```

**Important notes**:

- The SDK tries to register at least one unload-related listener for page-exit flushing.
- If the exclusions prevent all listener registrations, the SDK retries without those exclusions. Registration can still fail if the environment cannot attach any listeners.
- This option is especially useful for avoiding jQuery 3.7.1+ deprecation warnings by excluding the "unload" event.

### disablePageShowEvents

Similarly, this configuration option controls which page show events are not used by the SDK. Page show events include:

1. **pageshow** - Fired when a page is shown, or when navigating to a page using browser's back/forward functionality
2. **visibilitychange** (with 'visible' state) - Fired when a tab becomes visible

**TypeScript Example:**
```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    disablePageShowEvents: ["pageshow"],
    /* ...Other Configuration Options... */
  }
});
```

## Fallback Mechanism

The fallback mechanism responds to listener registration failures:

1. The SDK first tries `beforeunload` and `pagehide`, respecting `disablePageUnloadEvents`.
2. If neither listener can be registered, it tries `unload`, still respecting the exclusions.
3. If registration still fails and exclusions were provided, it retries without them, preferring `beforeunload` and `pagehide` before `unload`.
4. For hidden-page flushing, the SDK separately tries `pagehide` and `visibilitychange` with the `hidden` state. These listeners also retry without exclusions if neither can be registered.

Successful registration does not guarantee that an event will fire or that telemetry will reach the server. A browser can accept a listener for an event it does not dispatch, or discard the page without running a final handler. See the [Page Lifecycle API guidance](https://developer.chrome.com/docs/web-platform/page-lifecycle-api).

## Use Cases

### Avoiding jQuery 3.7.1+ Deprecation Warnings

If you're using jQuery 3.7.1 or newer, you'll encounter deprecation warnings when the 'unload' event is used. Configure the SDK to not use this deprecated event:

**TypeScript Example:**
```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    // Disable the deprecated 'unload' event to avoid jQuery deprecation warnings
    disablePageUnloadEvents: ["unload"],
  }
});
```

### Optimizing for Modern Browsers

For the best experience in modern browsers, you might want to prioritize newer events:

**TypeScript Example:**
```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    // Prefer modern events
    disablePageUnloadEvents: ["unload", "beforeunload"],
  }
});
```

If no preferred listener can be registered, the fallback may retry without the exclusions. Successful registration does not confirm that the browser will dispatch the event.

### Using Both Configuration Options Together

You can configure both unload and show events simultaneously for fine-grained control:

**TypeScript Example:**
```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    // Disable specific unload events
    disablePageUnloadEvents: ["unload"],
    // Disable specific show events
    disablePageShowEvents: ["pageshow"],
  }
});
```

### Progressive Enhancement

The SDK's approach to page lifecycle events reflects a progressive enhancement strategy, ensuring that telemetry works across diverse browser environments while offering configuration options for optimal behavior in modern contexts.
