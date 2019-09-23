import {
    IEnvelope, Data, Envelope,
    RemoteDependencyData, Event, Exception,
    Metric, PageView, Trace, PageViewPerformance, IDependencyTelemetry,
    IPageViewPerformanceTelemetry, CtxTagKeys,
    HttpMethod, IPageViewTelemetryInternal, IWeb,
    Util,
    IExceptionTelemetry,
    IExceptionInternal
} from '@microsoft/applicationinsights-common';
import {
    ITelemetryItem, CoreUtils,
    IDiagnosticLogger, LoggingSeverity, _InternalMessageId
} from '@microsoft/applicationinsights-core-js';

// these two constants are used to filter out properties not needed when trying to extract custom properties and measurements from the incoming payload
const baseType: string = "baseType";
const baseData: string = "baseData";

export abstract class EnvelopeCreator {
    public static Version = "2.2.4";

    protected static extractProperties(data: { [key: string]: any }): { [key: string]: any } {
        let customProperties: { [key: string]: any } = null;
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                if (typeof value !== "number") {
                    if (!customProperties) {
                        customProperties = {};
                    }
                    customProperties[key] = value;
                }
            }
        }

        return customProperties;
    }

    protected static extractPropsAndMeasurements(data: { [key: string]: any }, properties: { [key: string]: any }, measurements: { [key: string]: any }) {
        if (!CoreUtils.isNullOrUndefined(data)) {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    if (typeof value === "number") {
                        measurements[key] = value;
                    } else if (typeof value === "string") {
                        properties[key] = value;
                    } else {
                        properties[key] = JSON.stringify(value);
                    }
                }
            }
        }
    }

    // TODO: Do we want this to take logger as arg or use this._logger as nonstatic?
    protected static createEnvelope<T>(logger: IDiagnosticLogger, envelopeType: string, telemetryItem: ITelemetryItem, data: Data<T>): IEnvelope {
        const envelope = new Envelope(logger, data, envelopeType);
        envelope.iKey = telemetryItem.iKey;
        const iKeyNoDashes = telemetryItem.iKey.replace(/-/g, "");
        envelope.name = envelope.name.replace("{0}", iKeyNoDashes);

        // extract all extensions from ctx
        EnvelopeCreator.extractPartAExtensions(telemetryItem, envelope);

        // loop through the envelope tags (extension of Part A) and pick out the ones that should go in outgoing envelope tags
        if (!telemetryItem.tags) {
            telemetryItem.tags = [];
        }

        return envelope;
    }

    /*
     * Maps Part A data from CS 4.0
     */
    private static extractPartAExtensions(item: ITelemetryItem, env: IEnvelope) {
        // todo: switch to keys from common in this method
        if (!env.tags) {
            env.tags = {};
        }

        if (!item.ext) {
            item.ext = {};
        }

        if (!item.tags) {
            item.tags = [];
        }

        if (item.ext.user) {
            if (item.ext.user.authId) {
                env.tags[CtxTagKeys.userAuthUserId] = item.ext.user.authId;
            }

            const userId = item.ext.user.id || item.ext.user.localId;
            if (userId) {
                env.tags[CtxTagKeys.userId] = userId;
            }
        }

        if (item.ext.app) {
            if (item.ext.app.sesId) {
                env.tags[CtxTagKeys.sessionId] = item.ext.app.sesId;
            }
        }

        if (item.ext.device) {
            if (item.ext.device.id || item.ext.device.localId) {
                env.tags[CtxTagKeys.deviceId] = item.ext.device.id || item.ext.device.localId;
            }

            if (item.ext.device.deviceClass) {
                env.tags[CtxTagKeys.deviceType] = item.ext.device.deviceClass;
            }

            if (item.ext.device.ip) {
                env.tags[CtxTagKeys.deviceIp] = item.ext.device.ip;
            }
        }


        if (item.ext.web) {
            const web: IWeb = item.ext.web as IWeb;

            if (web.browserLang) {
                env.tags[CtxTagKeys.deviceLanguage] = web.browserLang;
            }
            if (web.browserVer) {
                env.tags[CtxTagKeys.deviceBrowserVersion] = web.browserVer;
            }

            if (web.browser) {
                env.tags[CtxTagKeys.deviceBrowser] = web.browser;
            }
            env.data = env.data || {};
            env.data.baseData = env.data.baseData || {};
            env.data.baseData.properties = env.data.baseData.properties || {};

            if (web.domain) {
                env.data.baseData.properties['domain'] = web.domain;
            }

            if (web.isManual) {
                env.data.baseData.properties['isManual'] = web.isManual.toString();
            }

            if (web.screenRes) {
                env.data.baseData.properties['screenRes'] = web.screenRes;
            }

            if (web.userConsent) {
                env.data.baseData.properties['userConsent'] = web.userConsent.toString();
            }
        }

        if (item.ext.device) {
            if (item.ext.device.model) {
                env.tags[CtxTagKeys.deviceModel] = item.ext.device.model;
            }
        }

        if (item.ext.os && item.ext.os.name) {
            env.tags[CtxTagKeys.deviceOS] = item.ext.os.name;
        }

        if (item.ext.device) {
            if (item.ext.device.deviceType) {
                env.tags[CtxTagKeys.deviceType] = item.ext.device.deviceType;
            }
        }

        // No support for mapping Trace.traceState to 2.0 as it is currently empty

        if (item.ext.trace) {
            if (item.ext.trace.parentID) {
                env.tags[CtxTagKeys.operationParentId] = item.ext.trace.parentID;
            }

            if (item.ext.trace.name) {
                env.tags[CtxTagKeys.operationName] = item.ext.trace.name;
            }

            if (item.ext.trace.traceID) {
                env.tags[CtxTagKeys.operationId] = item.ext.trace.traceID;
            }
        }

        // Sample 4.0 schema
        //  {
        //     "time" : "2018-09-05T22:51:22.4936Z",
        //     "name" : "MetricWithNamespace",
        //     "iKey" : "ABC-5a4cbd20-e601-4ef5-a3c6-5d6577e4398e",
        //     "ext": {  "cloud": {
        //          "role": "WATSON3",
        //          "roleInstance": "CO4AEAP00000260"
        //      },
        //      "device": {}, "correlation": {} },
        //      "tags": [
        //        { "amazon.region" : "east2" },
        //        { "os.expid" : "wp:02df239" }
        //     ]
        //   }

        const tgs = {};
        // deals with tags.push({object})
        for(let i = item.tags.length - 1; i >= 0; i--){
            const tg = item.tags[i];
            // Object.keys returns an array of keys
            Object.keys(tg).forEach(key => {
                tgs[key] = tg[key];
            })
            item.tags.splice(i, 1);
        }
        // deals with tags[key]=value
        for(const tg in item.tags){
            tgs[tg] = item.tags[tg];
        }

        env.tags = { ...env.tags, ...tgs };
        if(!env.tags[CtxTagKeys.internalSdkVersion]) {
            // Append a version in case it is not already set
            env.tags[CtxTagKeys.internalSdkVersion] = `javascript:${EnvelopeCreator.Version}`;
        }
    }
    protected _logger: IDiagnosticLogger;

    abstract Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope;
}

export class DependencyEnvelopeCreator extends EnvelopeCreator {
    static DependencyEnvelopeCreator = new DependencyEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        this._logger = logger;
        if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
        }

        const customMeasurements = telemetryItem.baseData.measurements || {};
        const customProperties = telemetryItem.baseData.properties || {};
        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
        const bd = telemetryItem.baseData as IDependencyTelemetry;
        if (CoreUtils.isNullOrUndefined(bd)) {
            logger.warnToConsole("Invalid input for dependency data");
            return null;
        }

        const id = bd.id;
        const absoluteUrl = bd.target;
        const command = bd.name;
        const duration = bd.duration;
        const success = bd.success;
        const resultCode = bd.responseCode;
        const requestAPI = bd.type;
        const correlationContext = bd.correlationContext;
        const method = bd.properties && bd.properties[HttpMethod] ? bd.properties[HttpMethod] : "GET";
        const baseData = new RemoteDependencyData(logger, id, absoluteUrl, command, duration, success, resultCode, method, requestAPI, correlationContext, customProperties, customMeasurements);
        const data = new Data<RemoteDependencyData>(RemoteDependencyData.dataType, baseData);
        return EnvelopeCreator.createEnvelope<RemoteDependencyData>(logger, RemoteDependencyData.envelopeType, telemetryItem, data);
    }
}

export class EventEnvelopeCreator extends EnvelopeCreator {
    static EventEnvelopeCreator = new EventEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        this._logger = logger;
        if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
        }

        let customProperties = {};
        let customMeasurements = {};
        if (telemetryItem.baseType !== Event.dataType) {
            customProperties['baseTypeSource'] = telemetryItem.baseType; // save the passed in base type as a property
        }

        if (telemetryItem.baseType === Event.dataType) { // take collection
            customProperties = telemetryItem.baseData.properties || {};
            customMeasurements = telemetryItem.baseData.measurements || {};
        } else { // if its not a known type, convert to custom event
            if (telemetryItem.baseData) {
                EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.baseData, customProperties, customMeasurements);
            }
        }

        // Exract root level properties from part C telemetryItem.data
        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
        const eventName = telemetryItem.baseData.name;
        const baseData = new Event(logger, eventName, customProperties, customMeasurements);
        const data = new Data<Event>(Event.dataType, baseData);
        return EnvelopeCreator.createEnvelope<Event>(logger, Event.envelopeType, telemetryItem, data);
    }
}

export class ExceptionEnvelopeCreator extends EnvelopeCreator {
    static ExceptionEnvelopeCreator = new ExceptionEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        this._logger = logger;
        if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
        }
        const bd = telemetryItem.baseData as IExceptionInternal;
        const baseData = Exception.CreateFromInterface(logger, bd);
        const data = new Data<Exception>(Exception.dataType, baseData);
        return EnvelopeCreator.createEnvelope<Exception>(logger, Exception.envelopeType, telemetryItem, data);
    }
}

export class MetricEnvelopeCreator extends EnvelopeCreator {
    static MetricEnvelopeCreator = new MetricEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        this._logger = logger;
        if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
        }

        const props = telemetryItem.baseData.properties || {};
        let customProperties = EnvelopeCreator.extractProperties(telemetryItem.data);
        customProperties = { ...props, ...customProperties };
        const name = telemetryItem.baseData.name;
        const average = telemetryItem.baseData.average;
        const sampleCount = telemetryItem.baseData.sampleCount;
        const min = telemetryItem.baseData.min;
        const max = telemetryItem.baseData.max;
        const baseData = new Metric(logger, name, average, sampleCount, min, max, customProperties);
        const data = new Data<Metric>(Metric.dataType, baseData);
        return EnvelopeCreator.createEnvelope<Metric>(logger, Metric.envelopeType, telemetryItem, data);
    }
}

export class PageViewEnvelopeCreator extends EnvelopeCreator {
    static PageViewEnvelopeCreator = new PageViewEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        this._logger = logger;
        if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
        }

        // Since duration is not part of the domain properties in Common Schema, extract it from part C
        let duration;
        if (!CoreUtils.isNullOrUndefined(telemetryItem.baseData) &&
            !CoreUtils.isNullOrUndefined(telemetryItem.baseData.properties) &&
            !CoreUtils.isNullOrUndefined(telemetryItem.baseData.properties.duration)) { // from part B properties
            duration = telemetryItem.baseData.properties.duration;
            delete telemetryItem.baseData.properties.duration;
        } else if (!CoreUtils.isNullOrUndefined(telemetryItem.data) &&
            !CoreUtils.isNullOrUndefined(telemetryItem.data["duration"])) { // from custom properties
            duration = telemetryItem.data["duration"];
            delete telemetryItem.data["duration"];
        }

        const bd = telemetryItem.baseData as IPageViewTelemetryInternal;

         // special case: pageview.id is grabbed from current operation id. Analytics plugin is decoupled from properties plugin, so this is done here instead. This can be made a default telemetry intializer instead if needed to be decoupled from channel
        let currentContextId;
        if (telemetryItem.ext && telemetryItem.ext.trace && telemetryItem.ext.trace.traceID) {
            currentContextId = telemetryItem.ext.trace.traceID;
        }
        const id = bd.id || currentContextId
        const name = bd.name;
        const url = bd.uri;
        const properties = bd.properties || {};
        const measurements = bd.measurements || {};

        // refUri is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
        if (!CoreUtils.isNullOrUndefined(bd.refUri)) {
            properties["refUri"] = bd.refUri;
        }

        // pageType is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
        if (!CoreUtils.isNullOrUndefined(bd.pageType)) {
            properties["pageType"] = bd.pageType;
        }

        // isLoggedIn is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
        if (!CoreUtils.isNullOrUndefined(bd.isLoggedIn)) {
            properties["isLoggedIn"] = bd.isLoggedIn.toString();
        }

        // pageTags is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
        if (!CoreUtils.isNullOrUndefined(bd.properties)) {
            const pageTags = bd.properties;
            for (const key in pageTags) {
                if (pageTags.hasOwnProperty(key)) {
                    properties[key] = pageTags[key];
                }
            }
        }

        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, properties, measurements);
        const baseData = new PageView(logger, name, url, duration, properties, measurements, id);
        const data = new Data<PageView>(PageView.dataType, baseData);
        return EnvelopeCreator.createEnvelope<PageView>(logger, PageView.envelopeType, telemetryItem, data);
    }
}

export class PageViewPerformanceEnvelopeCreator extends EnvelopeCreator {
    static PageViewPerformanceEnvelopeCreator = new PageViewPerformanceEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        this._logger = logger;
        if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
        }

        const bd = telemetryItem.baseData as IPageViewPerformanceTelemetry;
        const name = bd.name;
        const url = bd.uri || (bd as any).url;
        const properties = bd.properties || {};
        const measurements = bd.measurements || {};
        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, properties, measurements);
        const baseData = new PageViewPerformance(logger, name, url, undefined, properties, measurements, bd);
        const data = new Data<PageViewPerformance>(PageViewPerformance.dataType, baseData);
        return EnvelopeCreator.createEnvelope<PageViewPerformance>(logger, PageViewPerformance.envelopeType, telemetryItem, data);
    }
}

export class TraceEnvelopeCreator extends EnvelopeCreator {
    static TraceEnvelopeCreator = new TraceEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        this._logger = logger;
        if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
        }

        const message = telemetryItem.baseData.message;
        const severityLevel = telemetryItem.baseData.severityLevel;
        const customProperties = EnvelopeCreator.extractProperties(telemetryItem.data);
        const props = { ...customProperties, ...telemetryItem.baseData.properties };
        const baseData = new Trace(logger, message, severityLevel, props);
        const data = new Data<Trace>(Trace.dataType, baseData);
        return EnvelopeCreator.createEnvelope<Trace>(logger, Trace.envelopeType, telemetryItem, data);
    }
}
