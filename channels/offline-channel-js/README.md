# Microsoft Application Insights JavaScript SDK - Offline Channel

## [Beta]

## Description

The Offline Channel supports the saving of events when your application is offline and resending those events when the application is online.

### Note

- A post or sender channel is required for processing online events.
- Request header details will be stored in local/session storage or IndexedDB based on your configuration.
- If you are using the default endpoint `https://dc.services.visualstudio.com` for Application Insights, partial success is currently considered as success and events not sent in partial success will be dropped.

## Configuration

[`IOfflineChannelConfiguration`](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html)

| Name | Type | Default | Description |
|------|------|---------|-------------|
| [maxStorageSizeInBytes](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#maxStorageSizeInBytes) | [Optional]| 5000000 | The max size in bytes that should be used for storing events in local/session storage. |
| [storageKeyPrefix](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#storageKeyPrefix) | [Optional] | AIOffline | The storage key prefix that should be used when storing events in persistent storage. |
| [minPersistenceLevel](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#minPersistenceLevel) | [Optional] | `EventPersistence.Normal` or 1 | Identifies the minimum level that will be cached in the offline channel. Valid values of this setting are defined by the `EventPersistence` enum, currently Normal (1) and Critical (2) with the default value being Normal (1), which means all events without a persistence level set or with invalid persistence level will be marked as Normal(1) events.|
| [providers](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#providers) | [Optional] | [`eStorageProviders.LocalStorage, eStorageProviders.IndexedDB`]|  Identifies the StorageProviders that should be used by the system if available, the first available provider will be used. Valid available values are defined by the `eStorageProviders` enum. </br> Note: LocalStorage will be used to save unload events even if it is not in the providers list. |
| [eventsLimitInMem](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#eventsLimitInMem) | [Optional] | null | Identifies the maximum number of events to store in memory before sending to persistent storage. |
| [autoClean](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#autoClean) | [Optional] | false | Identifies if events that have existed in storage longer than the maximum allowed time (configured in inStorageMaxTime) should be cleaned after connection with storage. |
| [inMemoMaxTime](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#inMemoMaxTime) | [Optional] | 15000 | Identifies the maximum time in ms that items should be in memory before being saved into storage. |
| [inStorageMaxTime](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#inStorageMaxTime) | [Optional] | 10080000 (around 7days) | Identifies the maximum time in ms that items should be in the configured persistent storage. |
| [maxRetry](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#maxRetry) | [Optional] | 1 | Identifies the maximum retry times for an event batch. |
| [primaryOnlineChannelId](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#primaryOnlineChannelId) | [Optional] | `[AppInsightsChannelPlugin, PostChannel]` | Identifies online channel IDs in order. The first available one will be used. |
| [maxBatchsize](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#maxBatchsize) | [Optional] | 63000 | Identifies the maximum size per batch in bytes that is saved in persistent storage. |
| [senderCfg](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#senderCfg) | [Optional] | `IOfflineSenderConfig` | Identifies offline sender properties. |
| [maxSentBatchInterval](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#maxSentBatchInterval) | [Optional] | 15000 | Identifies the interval time in ms that previously stored offline event batches should be sent under online status. |
| [EventsToDropPerTime](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#EventsToDropPerTime) | [Optional] | 10 | Identifies the maximum event batch count when cleaning or releasing space for persistent storage per time. |
| [maxCriticalEvtsDropCnt](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#maxCriticalEvtsDropCnt) | [Optional] | 2 | Identifies the maximum critical events count for an event batch to be able to drop when releasing space for persistent storage per time. |
| [overrideInstrumentationKey](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineChannelConfiguration.html#overrideInstrumentationKey) | [Optional] | null | Identifies overridden for the Instrumentation key when the offline channel calls `processTelemetry`. |

### [IOfflineSenderConfig](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineSenderConfig.html)

| Name | Type | Default | Description |
|------|------|---------|-------------|
| [retryCodes](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineSenderConfig.html#retryCodes) | [Optional] | `[401, 403, 408, 429, 500, 502, 503, 504]` | Identifies status codes for re-sending event batches. |
| [transports](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineSenderConfig.html#transports) | [Optional] | null | Either an array or single value identifying the requested TransportType type(s) that should be used for sending events. If not defined, the same transports will be used in the channel with the `primaryOnlineChannelI`. |
| [httpXHROverride](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineSenderConfig.html#httpXHROverride) | [Optional] | null | The HTTP override that should be used to send requests, as an `IXHROverride` object. |
| [alwaysUseXhrOverride](https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-offlinechannel-js/interfaces/IOfflineSenderConfig.html#alwaysUseXhrOverride) | [Optional] | false | Identifies if provided httpXhrOverride will always be used. |

## Basic Usage

### NPM Setup

```js
import { OfflineChannel, eStorageProviders } from "@microsoft/applicationinsights-offlinechannel-js";

let offlineChannel = new OfflineChannel();
let coreConfig = {
    connectionString: "YOUR_CONNECTION_STRING",
    extensionConfig: {
        [offlineChannel.identifier]: {
            providers: [eStorageProviders.LocalStorage, eStorageProviders.IndexedDb],
            minPersistenceLevel:  2, // only events with PersistenceLevel >=2 will be saved/sent
        } // Add config for offline support channel
    }
};
let appInsights = new ApplicationInsights({config: coreConfig});
appInsights.loadAppInsights();
// this is to make sure offline channel is initialized after sender channel
appInsights.addPlugin(offlineChannel);

// get offlineListener to set online/offline status
let offlineListener = offlineChannel.getOfflineListener();


// set application status to online 
offlineListener.setOnlineState(1);
// offline channel will not process events when the status is online
appInsights.track({ name:"onlineEvent" }); // sender channel will send this event

// set application status to offline
offlineListener.setOnlineState(2);
// offline channel will process and save this event to the configured persistent storage
// the event will be sent when the application status is online again
appInsights.track({ name:"offlineEvent" });

```

## Contributing

Read our [contributing guide](./CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Application Insights.

## Data Collection

As this SDK is designed to enable applications to perform data collection which is sent to the Microsoft collection endpoints the following is required to identify our privacy statement.

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft's privacy statement. Our privacy statement is located at <https://go.microsoft.com/fwlink/?LinkID=824704>. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party's policies.

## License

[MIT](./LICENSE.TXT)
