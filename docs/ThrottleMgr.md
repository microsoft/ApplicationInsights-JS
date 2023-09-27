# Microsoft Application Insights JavaScript SDK - Throttle Manager

Throttle Manager component for the Application Insights Javascript SDK.

## Configuration

[`IThrottleMgrConfig`](https://github.com/microsoft/ApplicationInsights-JS/blob/main/shared/AppInsightsCommon/src/Interfaces/IThrottleMgr.ts)

## Examples

### Initialization

The Throttle Manager component is already integrated into AISKU. If you're using AISKU, simply include your throttle manager configuration `throttleMgrCfg` in your root configuration. Otherwise, you'll need to provide `core` for initialization.

```javascript
import { AppInsightsCore, _eInternalMessageId } from '@microsoft/applicationinsights-core-js"';
import { Sender } from "@microsoft/applicationinsights-channel-js";

let core = new AppInsightsCore();
let sender = new Sender();

let defaultThrottleCfg = {
    disabled: false, /* throttle is enabled. If set to true, no messages will be sent out */
    limit: {
        samplingRate: 100, /* sampling rate is 0.01% */
        maxSendNumber: 1 /* each time, only throttle 1 message */
    }, /*  limit number/percentage of items sent per time */
    interval: {
        monthInterval: 3, /* messages will be sent out every 3 months */
        dayInterval: undefined,
        daysOfMonth: [28] /* on date 28th */
    }, /* frequency of messages that should be sent out  */
};

let iKeyDeprecaredMsgThrottleCfg = {
    disabled: false, /* throttle is enabled. If set to true, no messages will be sent out */
    limit: {
        samplingRate: 10, /* sampling rate is 0.001% */
        maxSendNumber: 1 /* each time, only throttle 1 message */
    }, /*  limit number/percentage of items sent per time */
    interval: {
        monthInterval: undefined,
        dayInterval: 20, /* messages will be sent out every 20 days */
        daysOfMonth: undefined
    }, /* frequency of messages that should be sent out */
};
const defaultThrottleMsgKey = _eInternalMessageId.DefaultThrottleMsgKey;
const instrumentationKeyDeprecation = _eInternalMessageId.InstrumentationKeyDeprecation;
const cdnDeprecation = _eInternalMessageId.CdnDeprecation;

/* if specific message id throttle config is not defined, defaultThrottleMsgKey config will be used */
let throttleCfg = {
    [defaultThrottleMsgKey]: defaultThrottleCfg,
    [instrumentationKeyDeprecation]: iKeyDeprecaredMsgThrottleCfg
};

let coreCfg = {
    connectionString: 'test',
    throttleMgrCfg: throttleCfg
};
core.initialize(coreCfg, [sender]);
const throttleMgr = new ThrottleMgr(core);

throttleMgr.onReadyState(true); /* the actual throttle will only be activated after onReadyState is set to true */
throttleMgr.isReady(); /* return if onReadyState is set to true */

```

### Throttle Message

When calling `sendMessage()`, if throttling should happen based on throttle config, trace telemetry will be sent out. Otherwise, local storage will be updated to log the details.

```javascript
/* return if instrumentationKeyDeprecation message should be throttled or not currently based on throttleCfg[instrumentationKeyDeprecation] */
throttleMgr.canThrottle(instrumentationKeyDeprecation);

/* return if cdnDeprecation message should be throttled or not currently. Since throttle manager config for cdnDeprecation is not defined, defaultThrottleMsgKey config will be used */
throttleMgr.canThrottle(cdnDeprecation);

/* return if the instrumentationKeyDeprecation message has been triggered or not on the current date. For each key, throttling will only be triggered once per day.*/
throttleMgr.isTriggered(instrumentationKeyDeprecation);

/* send instrumentationKeyDeprecation message */
throttleMgr.sendMessage(instrumentationKeyDeprecation, "Instrumentation Key Deprecation Message");

```
