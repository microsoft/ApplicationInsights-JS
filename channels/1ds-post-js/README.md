# Microsoft 1DS Web SDK Post Plugin

## Description
1DS Web SDK Post Channel main functionality is to send data to OneCollector using POST, currently supporting XMLHttpRequest, fetch API and XDomainRequest.

## npm

Packages available [here](https://www.npmjs.com/package/@microsoft/1ds-post-js).

## Basic Usage

### Setup

```js
import { AppInsightsCore, IExtendedConfiguration } from '@microsoft/1ds-core-js';
import { PostChannel, IChannelConfiguration } from '@microsoft/1ds-post-js';
```

```js
var appInsightsCore: AppInsightsCore = new AppInsightsCore();
var postChannel: PostChannel = new PostChannel();
var coreConfig: IExtendedConfiguration = {
      instrumentationKey: "YOUR_TENANT_KEY",
      extensions: [
        postChannel
      ],
      extensionConfig: {}
};
var postChannelConfig: IChannelConfiguration = {
    eventsLimitInMem: 5000
};
coreConfig.extensionConfig[postChannel.identifier] = postChannelConfig;
//Initialize SDK
appInsightsCore.initialize(coreConfig, []);
```

## Configuration

### [IChannelConfiguration](https://microsoft.github.io/ApplicationInsights-JS/webSdk/1ds-post-js/interfaces/IChannelConfiguration.html)

| Config | Description | Type
|----------------|--------------|----
| eventsLimitInMem     | The number of events that can be kept in memory before the SDK starts to drop events. By default, this is 10,000.|number
| immediateEventLimit | [Optional] Sets the maximum number of immediate latency events that will be cached in memory before the SDK starts to drop other immediate events only, does not drop normal and real time latency events as immediate events have their own internal queue. Under normal situations immediate events are scheduled to be sent in the next Javascript execution cycle, so the typically number of immediate events is small (~1), the only time more than one event may be present is when the channel is paused or immediate send is disabled (via manual transmit profile). By default max number of events is 500 and the default transmit time is 0ms. Added in v3.1.1 | number
|  autoFlushEventsLimit | [Optional] If defined, once this number of events has been queued the system perform a flush() to send the queued events without waiting for the normal schedule timers. Default is undefined | number
|  httpXHROverride      |The HTTP override that should be used to send requests, request properties and headers should be added to the request to maintain correct functionality with other plugins.|IXHROverride
|  overrideInstrumentationKey     |Override for Instrumentation key.|string
|  overrideEndpointUrl     |Override for Endpoint where telemetry data is sent.|string
|  disableTelemetry     |The master off switch.  Do not send any data if set to TRUE.|boolean
|  ignoreMc1Ms0CookieProcessing     |MC1 and MSFPC cookies will not be provided. Default is false.|boolean
|  payloadPreprocessor |POST channel preprocessing function. Can be used to gzip the payload (and set appropriate HTTP headers) before transmission. |[Function](./src/DataModels.ts)
|  payloadListener |POST channel function hook to listen to events being sent, called after the batched events have been committed to be sent. Also used by Remote DDV Channel to send requests. |[Function](./src/DataModels.ts)
| disableEventTimings | [Optional] By default additional timing metrics details are added to each event after they are sent to allow you to review how long it took to create serialized request. As not all users require this level of detail and it's now possible to get the same metrics via the IPerfManager and IPerfEvent, so you can now disabled this previous level. Default value is false to retain the previous behavior, if you are not using these metrics and performance is a concern then it is recommended to set this value to true. | boolean
| valueSanitizer | [Optional] The value sanitizer to use while constructing the envelope, if not provided the default sanitizeProperty() method is called to validate and convert the fields for serialization. The path / fields names are based on the format of the envelope (serialized object) as defined via the [Common Schema 4.0](https://aka.ms/CommonSchema) specification. | IValueSanitizer
| stringifyObjects | [Optional] During serialization, when an object is identified should the object serialized by true => JSON.stringify(theObject); otherwise theObject.toString(). Defaults to false. | boolean
| enableCompoundKey | [Optional] Enables support for objects with compound keys which indirectly represent an object eg. event: { "somedata.embeddedvalue": 123 }  where the "key" of the object contains a "." as part of it's name.  Defaults to false. | boolean
| disableOptimizeObj | [Optional] Switch to disable the v8 `optimizeObject()` calls used to provide better serialization performance. Defaults to false. | boolean
| transports | [Optional] Either an array or single value identifying the requested `TransportType` (const enum) type that should be used. This is used during initialization to identify the requested send transport, it will be ignored if a httpXHROverride is provided. | number or number[]
| useSendBeacon | [Optional] A flag to enable or disable the usage of the sendBeacon() API if available by the runtime. If running on ReactNative this defaults to `false` for all other cases it defaults to `true`.
| disableFetchKeepAlive | [Optional] A flag to disable the usage of the [fetch with keep-alive](https://javascript.info/fetch-api#keepalive) support.
| unloadTransports | [Optional] Either an array or single value identifying the requested TransportType type(s) that should be used during unload or events marked as sendBeacon. This is used during initialization to identify the requested send transport, it will be ignored if a httpXHROverride is provided and alwaysUseXhrOverride is true.
| avoidOptions<br/><sub><i>(Since 3.1.10+)</i></sub><br /><sub>Default: false (Since 3.2.0)<br />Previously true</sub> | [Optional] Avoid adding request headers to the outgoing request that would cause a pre-flight (OPTIONS) request to be sent for each request. | boolean
| xhrTimeout<br/><sub><i>(Since 3.1.11+)</i></sub>  | [Optional] Specify a timeout (in ms) to apply to requests when sending requests using XHR or fetch() requests only, does not affect sendBeacon() or XDR (XDomainRequest) usage. Defaults to undefined and therefore the runtime defaults (normally zero for browser environments) | number
| disableXhrSync<br/><sub><i>(Since 3.1.11+)</i></sub> | [Optional] When using [Xhr](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) for sending requests disable sending as synchronous during unload or synchronous flush. __You should enable this feature for IE (when there is no sendBeacon() or fetch (with keep-alive) support) and you have clients that end up blocking the UI during page unloading__. <span style="color:red">This will cause ALL XHR requests to be sent asynchronously which during page unload may result in the lose of telemetry</span>. This does not affect any other request type (fetch(), sendBeacon() or XDR (XDomainRequest)) | boolean<br/>Default: undefined
| alwaysUseXhrOverride<br /><sub><i>(Since 3.1.11+)</i></sub> | [Optional] By default during unload (or when you specify to use sendBeacon() or sync fetch (with keep-alive) for an event) the SDK ignores any provided httpXhrOverride and attempts to use sendBeacon() or fetch(with keep-alive) when they are available. When this configuration option is true any provided httpXhrOverride will always be used, so any provided httpXhrOverride will also need to "handle" the synchronous unload scenario. | boolean<br /> Default: false
| maxEventRetryAttempts<br /><sub><i>(Since 3.1.11+)</i></sub> | [Optional] Identifies the number of times any single event will be retried if it receives a failed (retirable) response, this  causes the event to be internally "requeued" and resent in the next batch. As each normal batched send request is retried at least once before starting to increase the internal backoff send interval, normally batched events will generally be attempted the next nearest even number of times. This means that the total number of actual send attempts will almost always be even (setting to 5 will cause 6 requests), unless using manual synchronous flushing (calling flush(false)) which is not subject to request level retry attempts. | number<br/>Default: 6
| maxUnloadEventRetryAttempts<br /><sub><i>(Since 3.1.11+)</i></sub> | [Optional] Identifies the number of times any single event will be retried if it receives a failed (retriable) response as part of processing / flushing events once a page unload state has been detected, this causes the event to be internally "requeued" and resent in the next batch, which during page unload. Unlike the normal batching process, send requests are never retried, so the value listed here is always the maximum number of attempts for any single event.<br/>Notes: The SDK by default will use the sendBeacon() API if it exists which is treated as a fire and forget successful response, so for environments that support or supply this API the events won't be retried (because they will be deeded to be successfully sent). When an environment (IE) doesn't support sendBeacon(), this will cause multiple synchronous (by default) XMLHttpRequests to be sent, which will block the UI until a response is received. You can disable ALL synchronous XHR requests by setting the 'disableXhrSync' configuration setting and/or changing this value to 0 or 1. | number<br/>Default: 2
| addNoResponse <br /><sub><i>(Since 3.2.8+)</i></sub> | [Optional] flag to indicate whether the sendBeacon and fetch (with keep-alive flag) should add the "NoResponseBody" query string value to indicate that the server should return a 204 for successful requests. | boolean<br/>Default: true

### [IXHROverride](https://microsoft.github.io/ApplicationInsights-JS/webSdk/1ds-post-js/interfaces/IXHROverride.html)

|  Config   | Description | Type
|----------------|----------------------------------------|----|
|  sendPOST     |This method sends data to the specified URI using a POST request. If sync is true then the request is sent synchronously. The <i>oncomplete</i> function should always be called after the request is completed (either successfully or timed out or failed due to errors).|function

### Payload Preprocessors

```ts
interface IPayloadData {
    urlString: string;
    data: Uint8Array | string;
    headers?: { [name: string]: string };
    timeout?: number;            // Optional value supplied by the xhrTimeout configuration option
    disableXhrSync?: boolean;    // Optional value supplied by the disableXhrSync configuration option
}

type PayloadPreprocessorFunction = (payload: IPayloadData, callback: (modifiedBuffer: IPayloadData) => void) => void;
```

To perform some preprocessing operation on your payload before it is sent over the wire, you can supply the POST channel config with a `payloadPreprocessor` function. A typical usage of it would be to gzip your payloads.

```ts
const zlib = require('zlib');
const gzipFn: PayloadPreprocessorFunction = (payload: IPayloadData, cb) => {
  zlib.gzip(payload.data, (err, dataToSend) => {
    if (err) return cb(payload); // send original payload on error
    const payloadToSend = {
      ...payload,
      headers: { ...payload.headers, 'Content-Encoding': 'gzip' };
      data: dataToSend,
    };
    cb(payloadToSend);
  });
}
```

### XHR Override

```ts
/**
 * SendPOSTFunction type defines how an HTTP POST request is sent to an ingestion server
 * @param payload - The payload object that should be sent, contains the url, bytes/string and headers for the request
 * @param oncomplete - The function to call once the request has completed whether a success, failure or timeout
 * @param sync - A boolean flag indicating whether the request should be sent as a synchronous request.
 */
export type SendPOSTFunction = (payload: IPayloadData, oncomplete: (status: number, headers: { [headerName: string]: string; }, response?: string) => void, sync?: boolean) => void;

/**
 * The IXHROverride interface overrides the way HTTP requests are sent.
 */
export interface IXHROverride {
    /**
     * This method sends data to the specified URI using a POST request. If sync is true,
     * then the request is sent synchronously. The <i>oncomplete</i> function should always be called after the request is
     * completed (either successfully or timed out or failed due to errors).
     */
    sendPOST: SendPOSTFunction;
}
```

#### Example using node.js Https module

```ts
const oneDs = require('@microsoft/1ds-analytics-js');
const https = require('https');

// XHR override using node.js https module
var customHttpXHROverride= {
  sendPOST: (payload: IPayloadData, oncomplete) => {
    var options = {
      method: 'POST',
      headers: {
        ...payload.headers,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload.data)
      }
    };
    const req = https.request(payload.urlString, options, res => {
      res.on('data', function (responseData) {
        oncomplete(res.statusCode, res.headers, responseData.toString());
      });
    });
    req.write(payload.data);
    req.end();
  }
};

var postChannelConfig: IChannelConfiguration = {
    httpXHROverride: customHttpXHROverride
};

```

#### Example always using fetch API

This example is using the [fetch() API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch) for all requests, include synchronous requests and assumes that the browser environment supports the (currently) experimental keepalive option (for chromium).

```ts
function fetchHttpXHROverride(payload: IPayloadData, onComplete: OnCompleteCallback, sync?: boolean) {
  let ignoreResponse = false;
  let responseHandled = false;
  let requestInit: RequestInit = {
    body: payload.data,
    method: Method,
    headers: payload.headers,
    [DisabledPropertyName]: true,
    credentials: "include"
  };

  if (sync) {
    // You should validate whether the runtime environment supports this flag and if not you should use either sendBeacon or a synchronous XHR request
    requestInit.keepalive = true;
    if (sync) {
      // As a sync request (during unload), it is unlikely that we will get a chance to process the response so
      // just like beacon send assume that the events have been accepted and processed
      ignoreResponse = true;
    }
  }

  fetch(payload.urlString, requestInit).then((response) => {
    let headerMap = {};
    let responseText = "";
    if (response.headers) {
      response.headers.forEach((value: string, name: string) => {
        headerMap[name] = value;
      });
    }
 
    if (response.body) {
      response.text().then(function(text) {
        responseText = text;
      });
    }

    if (!responseHandled) {
      responseHandled = true;
      onComplete(response.status, headerMap, responseText);
    }
  }).catch((error) => {
    // In case there is an error in the request. Set the status to 0
    // so that the events can be retried later.
    if (!responseHandled) {
      responseHandled = true;
      onComplete(0, {});
    }
  });

  // If we are treating this as a synchronous (keepAlive) we need to assume success during unload processing
  if (ignoreResponse && !responseHandled) {
    responseHandled = true;
    onComplete(200, {});
  }

  // Simulate timeout if a timeout was supplied
  if (!responseHandled && payload.timeout > 0) {
    setTimeout(() => {
      if (!responseHandled) {
        // Assume a 500 response (which will cause a retry)
        responseHandled = true;
        onComplete(500, {});
      }
    }, payload.timeout);                    
  }
}

let postChannelConfig: IChannelConfiguration = {
  httpXHROverride: fetchHttpXHROverride,

  // Enable this flag to cause the SDK to ALWAYS call your override otherwise during page unload the SDK will using it's internal
  // sendPost implementation using sendBeacon() or fetch (with keepalive support) whichever is the first supported
  //alwaysUseXhrOverride: true,

  // If you want to specify a timeout this value is passed on the payload object as `payload.timeout`
  //xhrTimeout: 20000,
};

```

## IValueSanitizer Paths / Fields which are excluded

To ensure that the service can continue to accept events that are sent from the SDK, some paths and fields are explicitly blocked and are never processed
via any configured valueSanitizer. These fields are blocked at the serialization level and cannot be overridden.

The path / fields names are based on the format of the envelope (serialized object) as defined via the [Common Schema 4.0](https://aka.ms/CommonSchema) specification, so the path / field names used for the IValueSanitizer are based on how the data is serialized to the service (CS 4.0 location) and not specifically the location
on the event object you pass into the track methods (unless they are the same).

The currently configured set of fields include

### Excluded Part A fields

- All direct top-level fields of the envelope, this includes "ver"; "name"; "time" and "iKey". see [Common Schema 4.0 - Part A](https://aka.ms/CommonSchema/PartA) for all defined fields. Note: This exclusion does does not match sub-keys (objects) like "ext", "data" and "properties".
- All fields of the web extension, this includes all fields and sub keys of "ext.web" (example fields include "ext.web.browser"; "ext.web.domain"; "ext.web.consentDetails"). see [Common Schema 4.0 - Part A Extension - web](https://aka.ms/CommonSchema/PartA/Web) for the complete set of defined fields.
- All fields and paths of the metadata extension, this includes all fields and sub keys of "ext.metadata". see [Common Schema 4.0 - Part A Extension - metadata](https://aka.ms/CommonSchema/PartA/MetaData) for the complete set of defined fields.

## Synchronous Events

By default events are batched and sent asynchronously, there are times when you want to send events immediately during the same JavaScript execution cycle.

To support this you can set the ```sync``` property on an event to tell the PostChannel to skip the normal event batching and send this event now within it's own outbound connection. Because each ```sync``` event will cause a new request / connection (per event) you should use this approach SPARINGLY to avoid creating an excessive number of requests from the users browser which may have a negative impact on their experience.

Note: If the initial synchronous request fails (not the normal case) any sync event will be queued for resending as an asynchronous batch (unless an "unload" event has been detected).

### Supported Sync values

Supported event ```sync``` values to cause an event to be sent immediately during the same JavaScript execution cycle.

In the case of the sendBeacon() and fetch() [with keepalive] (SyncFetch) both of these API's have a maximum payload size defined as 64Kb, as such if the size of the serialized (JSON) events are larger than this the events will be dropped as there is no safe way to send the event. 

| Name     | Value | Description
|----------|-------|-------------------
| Batched  | undefined,<br />false,<br />0 | This is the default situation and will cause the event to be Batched and sent asynchronously.
| Synchronous | true,<br />1 | Attempt to send the request using the default synchronous method.<br />This will use the first available transport option:<br/>- httpXHROverride;<br/>-XMLHttpRequest (with sync flag);<br/>-fetch() [with keepalive] (Since v3.1.3);<br/>-sendBeacon()  (Since v3.1.3)
| SendBeacon | 2 | (Since v3.1.3) Attempt to send the event synchronously with a preference for the sendBeacon() API.<br />This will use the first available transport option:<br/>-sendBeacon();<br/>-fetch() [with keepalive];<br/>-XMLHttpRequest (with sync flag);<br/>-httpXHROverride
| SyncFetch | 3 | (Since v3.1.3) Attempt to send the event synchronously with a preference for the fetch() API with the keepalive flag, the SDK checks to ensure that the fetch() implementation supports the 'keepalive' flag and if not it will skip this transport option.<br />This will use the first available transport option:<br/>-fetch() [with keepalive];<br/>-sendBeacon();<br/>-XMLHttpRequest (with sync flag);<br/>-httpXHROverride

The named values are available in TypeScript via the ```EventSendType``` const enum class since v3.1.3.

> Note: The SDK explicitly checks for ```keepalive``` support for fetch() via the ```Request``` class, so if not available this transport will not be used. [Browsers natively supporting fetch() keepalive](https://caniuse.com/?search=keepalive), as such any polyfill would also need to support this flag for it to be used.

___Special sendBeacon() Note___

As the sendBeacon() API does not provide any response handling, any events sent via this method are considered to have been successfully sent, even if the browser fails to send the requests. The only exception is that if the browser returns false indicating that it can't accept the sendBeacon() request, in this case the SDK will send a dropped event notification.

### When to use 'sync' events

Events that cause a page navigation can cause a race condition that could result in either event loss or duplication. This happens when any previously batched events have been sent (the request is in-flight) and the browser subsequently cancels the request before a response is processed AND it also triggers the JavaScript "cancel" or "abort" event, normally only during the unload process.

The SDK listens to all supported "unload" events (```unload```, ```beforeunload``` and ```pagehide```) and when any one of these are detected it will immediately send all (unsent) batched events via the "SendBeacon" (and fallback) methods above. This successfully mitigates the event loss case above, but it can compound the event duplication case for some scenarios as the SDK works to ensure that all events are sent and acknowledged.

This situation has become more prevalent with the enforcement by modern browsers to disallow, cancel or abort the usage of synchronous Xhr requests during page "unload" event.

There are effectively 2 scenarios where you should consider adding the `sync` property to an event (using the asynchronous SendBeacon and SyncFetch values) to remove the possibility of event duplication (the WebAnalytics extension already handles these cases).

1) You want to send your own event during the page "unload" events and you have hooked the "unload" events yourself (before) initializing the SDK.

- When you listen to the events "before" the SDK initializes, there is a small window of time where any "batched" event may get sent (and therefore become in-flight) before the SDK receives and processes the "unload" events, thus the potential race condition.
- If you attach to the "unload" events "after" the SDK is initialized, it will now (since v3.1.3) automatically convert all received event(s) into "sync" (SendBeacon) events to ensure delivery.

2) You want to send you own telemetry event(s) based on some user action after which a page-navigation immediately occurs, either via an anchor &lt;a /&gt; containing a href and letting the event bubble or by directly causing a navigation via a form Post or location change.

- This is because because the href / post / location change will eventually cause an "unload" event to occur and therefore (potentially) any outbound (in-flight) requests may get canceled and cause event to be duplicated.
- While this situation can occur with any other batched events, it is more likely to occur when events are created during these know situations that are known to directly trigger the "unload" cycle.

## API documentation

[Typedoc generated API reference](https://microsoft.github.io/ApplicationInsights-JS/webSdk/1ds-post-js/index.html)

## Learn More

You can learn more in [1DS First party getting started](https://aka.ms/1dsjs).

## Data Collection

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft's privacy statement. Our privacy statement is located at [https://go.microsoft.com/fwlink/?LinkID=824704](https://go.microsoft.com/fwlink/?LinkID=824704). You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

To turn off sending telemetry to Microsoft, ensure that the POST channel is not configured in the extensions.  See below configuration for example:

```js
var coreConfig: IExtendedConfiguration = {
      instrumentationKey: "YOUR_TENANT_KEY",
      extensions: [
        postChannel  // << REMOVE THIS EXTENSION TO STOP SENDING TELEMETRY TO MICROSOFT
      ],
      extensionConfig: {}
};
```

## Contributing

Read our [contributing guide](./CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Application Insights.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft�s privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft�s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party�s policies.

## License

[MIT](./LICENSE.TXT)
