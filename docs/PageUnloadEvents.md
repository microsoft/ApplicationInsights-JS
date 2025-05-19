# Page Unload Event Handling

## Overview

Application Insights Web SDK tracks several page lifecycle events to ensure that telemetry data is sent before a page is unloaded, helping to prevent data loss during page navigation or browser closure. The SDK hooks into different unload and visibility change events depending on the browser environment.

## Unload Events

The SDK listens to the following events to detect when a page is being unloaded:

1. **beforeunload** - Fired when the window, document, and its resources are about to be unloaded
2. **unload** - Fired when the document or a child resource is being unloaded
3. **pagehide** - Fired when the browser hides the current page in the process of navigating to another page
4. **visibilitychange** (with 'hidden' state) - Fired when the content of a tab has become visible or hidden

## Modern Browser Compatibility

Modern browsers and frameworks are deprecating or changing how some page unload events work:

- **jQuery 3.7.1+** has deprecated the use of the `unload` event, showing warning messages when it's used.
- Some modern browsers are changing the behavior of `beforeunload` event for better performance and reduced tracking potential.
- The `pagehide` event and `visibilitychange` events are becoming the recommended alternatives.
- The SDK is designed to handle cases where certain events are unavailable or behave differently across browsers, gracefully adapting to the environment to ensure telemetry is sent.

## Configuration Options

The SDK provides configuration options to control which page lifecycle events are used:

### disablePageUnloadEvents

This configuration option allows you to specify which page unload events should not be used by the SDK.

**JavaScript Example:**
```javascript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    disablePageUnloadEvents: ["unload"],
    /* ...Other Configuration Options... */
  }
});
```

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

- The SDK requires at least one functioning page unload event to ensure telemetry is sent when the page is closed.
- If all events are listed in `disablePageUnloadEvents` or if the only working events in the current browser environment are the ones you've disabled, the SDK will still use one of them to ensure functionality.
- This option is especially useful for avoiding jQuery 3.7.1+ deprecation warnings by excluding the "unload" event.

### disablePageShowEvents

Similarly, this configuration option controls which page show events are not used by the SDK. Page show events include:

1. **pageshow** - Fired when a page is shown, or when navigating to a page using browser's back/forward functionality
2. **visibilitychange** (with 'visible' state) - Fired when a tab becomes visible

**JavaScript Example:**
```javascript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    disablePageShowEvents: ["pageshow"],
    /* ...Other Configuration Options... */
  }
});
```

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

The SDK implements a robust fallback mechanism to ensure that telemetry can be sent before the page unloads:

1. The SDK first tries to use all available unload events except those listed in `disablePageUnloadEvents`.
2. If no events can be registered (either because all are disabled or not supported), the SDK will ignore the `disablePageUnloadEvents` setting and force registration of at least one event.
3. Even when the SDK attempts to hook events that may be missing in certain browsers, it's designed to gracefully handle these cases without errors.
4. The SDK includes internal logic to detect when hooked events aren't firing as expected and will utilize alternative approaches to send telemetry.
5. This ensures that critical telemetry data is always sent, even in constrained environments or when browser implementations change.

## Use Cases

### Avoiding jQuery 3.7.1+ Deprecation Warnings

If you're using jQuery 3.7.1 or newer, you'll encounter deprecation warnings when the 'unload' event is used. Configure the SDK to not use this deprecated event:

**JavaScript Example:**
```javascript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    // Disable the deprecated 'unload' event to avoid jQuery deprecation warnings
    disablePageUnloadEvents: ["unload"],
  }
});
```

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

**JavaScript Example:**
```javascript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    // Use only modern events
    disablePageUnloadEvents: ["unload", "beforeunload"],
  }
});
```

**TypeScript Example:**
```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'YOUR_CONNECTION_STRING_GOES_HERE',
    // Use only modern events
    disablePageUnloadEvents: ["unload", "beforeunload"],
  }
});
```

Note that the SDK will still use an older event if none of the modern events are supported in the browser environment.

### Using Both Configuration Options Together

You can configure both unload and show events simultaneously for fine-grained control:

**JavaScript Example:**
```javascript
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