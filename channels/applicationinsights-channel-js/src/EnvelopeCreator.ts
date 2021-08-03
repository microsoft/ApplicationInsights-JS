import {
    IEnvelope, Data, Envelope,
    RemoteDependencyData, Event, Exception,
    Metric, PageView, Trace, PageViewPerformance, IDependencyTelemetry,
    IPageViewPerformanceTelemetry, CtxTagKeys,
    HttpMethod, IPageViewTelemetryInternal, IWeb,
    IExceptionInternal,
    SampleRate,
} from '@microsoft/applicationinsights-common';
import {
    ITelemetryItem, IDiagnosticLogger, LoggingSeverity, _InternalMessageId, hasJSON, getJSON, objForEachKey, 
    isNullOrUndefined, isNumber, isString, toISOString, setValue, isTruthy, optimizeObject
} from '@microsoft/applicationinsights-core-js';

// these two constants are used to filter out properties not needed when trying to extract custom properties and measurements from the incoming payload
const strBaseType = 'baseType';
const strBaseData = 'baseData';
const strProperties = 'properties';
const strTrue = 'true';

function _setValueIf<T>(target:T, field:keyof T, value:any) {
    return setValue(target, field, value, isTruthy);
}

export abstract class EnvelopeCreator {
    public static Version = "2.6.5";

    protected static extractPropsAndMeasurements(data: { [key: string]: any }, properties: { [key: string]: any }, measurements: { [key: string]: any }) {
        if (!isNullOrUndefined(data)) {
            objForEachKey(data, (key, value) => {
                if (isNumber(value)) {
                    measurements[key] = value;
                } else if (isString(value)) {
                    properties[key] = value;
                } else if (hasJSON()) {
                    properties[key] = getJSON().stringify(value);
                }
            });
        }
    }

    // TODO: Do we want this to take logger as arg or use this._logger as nonstatic?
    protected static createEnvelope<T>(logger: IDiagnosticLogger, envelopeType: string, telemetryItem: ITelemetryItem, data: Data<T>): IEnvelope {
        const envelope = new Envelope(logger, data, envelopeType);

        _setValueIf(envelope, 'sampleRate', telemetryItem[SampleRate]);
        if ((telemetryItem[strBaseData] || {}).startTime) {
            envelope.time = toISOString(telemetryItem[strBaseData].startTime);
        }
        envelope.iKey = telemetryItem.iKey;
        const iKeyNoDashes = telemetryItem.iKey.replace(/-/g, "");
        envelope.name = envelope.name.replace("{0}", iKeyNoDashes);

        // extract all extensions from ctx
        EnvelopeCreator.extractPartAExtensions(telemetryItem, envelope);

        // loop through the envelope tags (extension of Part A) and pick out the ones that should go in outgoing envelope tags
        telemetryItem.tags = telemetryItem.tags || [];

        return optimizeObject(envelope);
    }

    /*
     * Maps Part A data from CS 4.0
     */
    private static extractPartAExtensions(item: ITelemetryItem, env: IEnvelope) {
        // todo: switch to keys from common in this method
        let envTags = env.tags = env.tags || {};
        let itmExt = item.ext = item.ext || {};
        let itmTags = item.tags = item.tags || [];

        let extUser = itmExt.user;
        if (extUser) {
            _setValueIf(envTags, CtxTagKeys.userAuthUserId, extUser.authId);
            _setValueIf(envTags, CtxTagKeys.userId, extUser.id || extUser.localId);
        }

        let extApp = itmExt.app;
        if (extApp) {
            _setValueIf(envTags, CtxTagKeys.sessionId, extApp.sesId);
        }

        let extDevice = itmExt.device;
        if (extDevice) {
            _setValueIf(envTags, CtxTagKeys.deviceId, extDevice.id || extDevice.localId);
            _setValueIf(envTags, CtxTagKeys.deviceType, extDevice.deviceClass);
            _setValueIf(envTags, CtxTagKeys.deviceIp, extDevice.ip);
            _setValueIf(envTags, CtxTagKeys.deviceModel, extDevice.model);
            _setValueIf(envTags, CtxTagKeys.deviceType, extDevice.deviceType);
        }

        const web: IWeb = item.ext.web as IWeb;
        if (web) {
            _setValueIf(envTags, CtxTagKeys.deviceLanguage, web.browserLang);
            _setValueIf(envTags, CtxTagKeys.deviceBrowserVersion, web.browserVer);
            _setValueIf(envTags, CtxTagKeys.deviceBrowser, web.browser);

            let envData = env.data = env.data || {};
            let envBaseData = envData[strBaseData] = envData[strBaseData] || {};
            let envProps = envBaseData[strProperties] = envBaseData[strProperties] || {};

            _setValueIf(envProps, 'domain', web.domain);
            _setValueIf(envProps, 'isManual', web.isManual ? strTrue : null);
            _setValueIf(envProps, 'screenRes', web.screenRes);
            _setValueIf(envProps, 'userConsent', web.userConsent ? strTrue : null);
        }

        let extOs = itmExt.os;
        if (extOs) {
            _setValueIf(envTags, CtxTagKeys.deviceOS, extOs.name);
        }

        // No support for mapping Trace.traceState to 2.0 as it is currently empty

        let extTrace = itmExt.trace;
        if (extTrace) {
            _setValueIf(envTags, CtxTagKeys.operationParentId, extTrace.parentID);
            _setValueIf(envTags, CtxTagKeys.operationName, extTrace.name);
            _setValueIf(envTags, CtxTagKeys.operationId, extTrace.traceID);
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
        for(let i = itmTags.length - 1; i >= 0; i--){
            const tg = itmTags[i];
            objForEachKey(tg, (key, value) => {
                tgs[key] = value;
            });

            itmTags.splice(i, 1);
        }

        // deals with tags[key]=value (and handles hasOwnProperty)
        objForEachKey(itmTags, (tg, value) => {
            tgs[tg] = value;
        });

        let theTags = { ...envTags, ...tgs };
        if(!theTags[CtxTagKeys.internalSdkVersion]) {
            // Append a version in case it is not already set
            theTags[CtxTagKeys.internalSdkVersion] = `javascript:${EnvelopeCreator.Version}`;
        }
        
        env.tags = optimizeObject(theTags);
    }

    protected _logger: IDiagnosticLogger;

    abstract Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope;

    protected Init(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem) {
        this._logger = logger;
        if (isNullOrUndefined(telemetryItem[strBaseData])) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
        }
    }
}

export class DependencyEnvelopeCreator extends EnvelopeCreator {
    static DependencyEnvelopeCreator = new DependencyEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        super.Init(logger, telemetryItem);

        const customMeasurements = telemetryItem[strBaseData].measurements || {};
        const customProperties = telemetryItem[strBaseData][strProperties] || {};
        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
        const bd = telemetryItem[strBaseData] as IDependencyTelemetry;
        if (isNullOrUndefined(bd)) {
            logger.warnToConsole("Invalid input for dependency data");
            return null;
        }

        const method = bd[strProperties] && bd[strProperties][HttpMethod] ? bd[strProperties][HttpMethod] : "GET";
        const remoteDepData = new RemoteDependencyData(logger, bd.id, bd.target, bd.name, bd.duration, bd.success, bd.responseCode, method, bd.type, bd.correlationContext, customProperties, customMeasurements);
        const data = new Data<RemoteDependencyData>(RemoteDependencyData.dataType, remoteDepData);
        return EnvelopeCreator.createEnvelope<RemoteDependencyData>(logger, RemoteDependencyData.envelopeType, telemetryItem, data);
    }
}

export class EventEnvelopeCreator extends EnvelopeCreator {
    static EventEnvelopeCreator = new EventEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        super.Init(logger, telemetryItem);

        let customProperties = {};
        let customMeasurements = {};
        if (telemetryItem[strBaseType] !== Event.dataType) {
            customProperties['baseTypeSource'] = telemetryItem[strBaseType]; // save the passed in base type as a property
        }

        if (telemetryItem[strBaseType] === Event.dataType) { // take collection
            customProperties = telemetryItem[strBaseData][strProperties] || {};
            customMeasurements = telemetryItem[strBaseData].measurements || {};
        } else { // if its not a known type, convert to custom event
            if (telemetryItem[strBaseData]) {
                EnvelopeCreator.extractPropsAndMeasurements(telemetryItem[strBaseData], customProperties, customMeasurements);
            }
        }

        // Extract root level properties from part C telemetryItem.data
        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
        const eventName = telemetryItem[strBaseData].name;
        const eventData = new Event(logger, eventName, customProperties, customMeasurements);
        const data = new Data<Event>(Event.dataType, eventData);
        return EnvelopeCreator.createEnvelope<Event>(logger, Event.envelopeType, telemetryItem, data);
    }
}

export class ExceptionEnvelopeCreator extends EnvelopeCreator {
    static ExceptionEnvelopeCreator = new ExceptionEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        super.Init(logger, telemetryItem);

        // Extract root level properties from part C telemetryItem.data
        const customMeasurements = telemetryItem[strBaseData].measurements || {};
        const customProperties = telemetryItem[strBaseData][strProperties] || {};
        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);

        const bd = telemetryItem[strBaseData] as IExceptionInternal;
        const exData = Exception.CreateFromInterface(logger, bd, customProperties, customMeasurements);
        const data = new Data<Exception>(Exception.dataType, exData);
        return EnvelopeCreator.createEnvelope<Exception>(logger, Exception.envelopeType, telemetryItem, data);
    }
}

export class MetricEnvelopeCreator extends EnvelopeCreator {
    static MetricEnvelopeCreator = new MetricEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        super.Init(logger, telemetryItem);

        const baseData = telemetryItem[strBaseData];
        const props = baseData[strProperties] || {};
        const measurements = baseData.measurements || {};
        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, props, measurements);
        const baseMetricData = new Metric(logger, baseData.name, baseData.average, baseData.sampleCount, baseData.min, baseData.max, props, measurements);
        const data = new Data<Metric>(Metric.dataType, baseMetricData);
        return EnvelopeCreator.createEnvelope<Metric>(logger, Metric.envelopeType, telemetryItem, data);
    }
}

export class PageViewEnvelopeCreator extends EnvelopeCreator {
    static PageViewEnvelopeCreator = new PageViewEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        super.Init(logger, telemetryItem);

        // Since duration is not part of the domain properties in Common Schema, extract it from part C
        let strDuration = "duration";
        let duration;
        let baseData = telemetryItem[strBaseData];
        if (!isNullOrUndefined(baseData) &&
            !isNullOrUndefined(baseData[strProperties]) &&
            !isNullOrUndefined(baseData[strProperties][strDuration])) { // from part B properties
            duration = baseData[strProperties][strDuration];
            delete baseData[strProperties][strDuration];
        } else if (!isNullOrUndefined(telemetryItem.data) &&
            !isNullOrUndefined(telemetryItem.data[strDuration])) { // from custom properties
            duration = telemetryItem.data[strDuration];
            delete telemetryItem.data[strDuration];
        }

        const bd = telemetryItem[strBaseData] as IPageViewTelemetryInternal;

         // special case: pageview.id is grabbed from current operation id. Analytics plugin is decoupled from properties plugin, so this is done here instead. This can be made a default telemetry intializer instead if needed to be decoupled from channel
        let currentContextId;
        if (((telemetryItem.ext || {}).trace || {}).traceID) {
            currentContextId = telemetryItem.ext.trace.traceID;
        }
        const id = bd.id || currentContextId
        const name = bd.name;
        const url = bd.uri;
        const properties = bd[strProperties] || {};
        const measurements = bd.measurements || {};

        // refUri is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
        if (!isNullOrUndefined(bd.refUri)) {
            properties["refUri"] = bd.refUri;
        }

        // pageType is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
        if (!isNullOrUndefined(bd.pageType)) {
            properties["pageType"] = bd.pageType;
        }

        // isLoggedIn is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
        if (!isNullOrUndefined(bd.isLoggedIn)) {
            properties["isLoggedIn"] = bd.isLoggedIn.toString();
        }

        // pageTags is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
        if (!isNullOrUndefined(bd[strProperties])) {
            const pageTags = bd[strProperties];
            objForEachKey(pageTags, (key, value) => {
                properties[key] = value;
            });
        }

        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, properties, measurements);
        const pageViewData = new PageView(logger, name, url, duration, properties, measurements, id);
        const data = new Data<PageView>(PageView.dataType, pageViewData);
        return EnvelopeCreator.createEnvelope<PageView>(logger, PageView.envelopeType, telemetryItem, data);
    }
}

export class PageViewPerformanceEnvelopeCreator extends EnvelopeCreator {
    static PageViewPerformanceEnvelopeCreator = new PageViewPerformanceEnvelopeCreator();

    Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope {
        super.Init(logger, telemetryItem);

        const bd = telemetryItem[strBaseData] as IPageViewPerformanceTelemetry;
        const name = bd.name;
        const url = bd.uri || (bd as any).url;
        const properties = bd[strProperties] || {};
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
        super.Init(logger, telemetryItem);

        const message = telemetryItem[strBaseData].message;
        const severityLevel = telemetryItem[strBaseData].severityLevel;
        const props = telemetryItem[strBaseData][strProperties] || {};
        const measurements = telemetryItem[strBaseData].measurements || {};
        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, props, measurements);
        const baseData = new Trace(logger, message, severityLevel, props, measurements);
        const data = new Data<Trace>(Trace.dataType, baseData);
        return EnvelopeCreator.createEnvelope<Trace>(logger, Trace.envelopeType, telemetryItem, data);
    }
}