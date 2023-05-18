import {
    CtxTagKeys, Data, Envelope, Event, Exception, HttpMethod, IDependencyTelemetry, IEnvelope, IExceptionInternal,
    IPageViewPerformanceTelemetry, IPageViewTelemetryInternal, IWeb, Metric, PageView, PageViewPerformance, RemoteDependencyData, SampleRate,
    Trace, dataSanitizeString
} from "@microsoft/applicationinsights-common";
import {
    IDiagnosticLogger, ITelemetryItem, _eInternalMessageId, _throwInternal, _warnToConsole, eLoggingSeverity, getJSON, hasJSON,
    isNullOrUndefined, isNumber, isString, isTruthy, objForEachKey, optimizeObject, setValue, toISOString
} from "@microsoft/applicationinsights-core-js";
import { STR_DURATION } from "./InternalConstants";

// these two constants are used to filter out properties not needed when trying to extract custom properties and measurements from the incoming payload
const strBaseType = "baseType";
const strBaseData = "baseData";
const strProperties = "properties";
const strTrue = "true";

function _setValueIf<T>(target:T, field:keyof T, value:any) {
    return setValue(target, field, value, isTruthy);
}

/*
 * Maps Part A data from CS 4.0
 */
function _extractPartAExtensions(logger: IDiagnosticLogger, item: ITelemetryItem, env: IEnvelope) {
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

        _setValueIf(envProps, "domain", web.domain);
        _setValueIf(envProps, "isManual", web.isManual ? strTrue : null);
        _setValueIf(envProps, "screenRes", web.screenRes);
        _setValueIf(envProps, "userConsent", web.userConsent ? strTrue : null);
    }

    let extOs = itmExt.os;
    if (extOs) {
        _setValueIf(envTags, CtxTagKeys.deviceOS, extOs.name);
    }

    // No support for mapping Trace.traceState to 2.0 as it is currently empty

    let extTrace = itmExt.trace;
    if (extTrace) {
        _setValueIf(envTags, CtxTagKeys.operationParentId, extTrace.parentID);
        _setValueIf(envTags, CtxTagKeys.operationName, dataSanitizeString(logger, extTrace.name));
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
        theTags[CtxTagKeys.internalSdkVersion] = dataSanitizeString(logger, `javascript:${EnvelopeCreator.Version}`, 64);
    }
    
    env.tags = optimizeObject(theTags);
}

function _extractPropsAndMeasurements(data: { [key: string]: any }, properties: { [key: string]: any }, measurements: { [key: string]: any }) {
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

function _convertPropsUndefinedToCustomDefinedValue(properties: { [key: string]: any }, customUndefinedValue: any) {
    if (!isNullOrUndefined(properties)) {
        objForEachKey(properties, (key, value) => {
            properties[key] = value || customUndefinedValue;
        });
    }
}

// TODO: Do we want this to take logger as arg or use this._logger as nonstatic?
function _createEnvelope<T>(logger: IDiagnosticLogger, envelopeType: string, telemetryItem: ITelemetryItem, data: Data<T>): IEnvelope {
    const envelope = new Envelope(logger, data, envelopeType);

    _setValueIf(envelope, "sampleRate", telemetryItem[SampleRate]);
    if ((telemetryItem[strBaseData] || {}).startTime) {
        envelope.time = toISOString(telemetryItem[strBaseData].startTime);
    }
    envelope.iKey = telemetryItem.iKey;
    const iKeyNoDashes = telemetryItem.iKey.replace(/-/g, "");
    envelope.name = envelope.name.replace("{0}", iKeyNoDashes);

    // extract all extensions from ctx
    _extractPartAExtensions(logger, telemetryItem, envelope);

    // loop through the envelope tags (extension of Part A) and pick out the ones that should go in outgoing envelope tags
    telemetryItem.tags = telemetryItem.tags || [];

    return optimizeObject(envelope);
}

function EnvelopeCreatorInit(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem) {
    if (isNullOrUndefined(telemetryItem[strBaseData])) {
        _throwInternal(logger,
            eLoggingSeverity.CRITICAL,
            _eInternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
    }
}

export const EnvelopeCreator = {
    Version: "#version#"
};

export function DependencyEnvelopeCreator(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem, customUndefinedValue?: any): IEnvelope {
    EnvelopeCreatorInit(logger, telemetryItem);

    const customMeasurements = telemetryItem[strBaseData].measurements || {};
    const customProperties = telemetryItem[strBaseData][strProperties] || {};
    _extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
    if (!isNullOrUndefined(customUndefinedValue)) {
        _convertPropsUndefinedToCustomDefinedValue(customProperties, customUndefinedValue);
    }
    const bd = telemetryItem[strBaseData] as IDependencyTelemetry;
    if (isNullOrUndefined(bd)) {
        _warnToConsole(logger, "Invalid input for dependency data");
        return null;
    }

    const method = bd[strProperties] && bd[strProperties][HttpMethod] ? bd[strProperties][HttpMethod] : "GET";
    const remoteDepData = new RemoteDependencyData(logger, bd.id, bd.target, bd.name, bd.duration, bd.success, bd.responseCode, method, bd.type, bd.correlationContext, customProperties, customMeasurements);
    const data = new Data<RemoteDependencyData>(RemoteDependencyData.dataType, remoteDepData);
    return _createEnvelope<RemoteDependencyData>(logger, RemoteDependencyData.envelopeType, telemetryItem, data);
}

export function EventEnvelopeCreator(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem, customUndefinedValue?: any): IEnvelope {
    EnvelopeCreatorInit(logger, telemetryItem);

    let customProperties = {};
    let customMeasurements = {};
    if (telemetryItem[strBaseType] !== Event.dataType) {
        customProperties["baseTypeSource"] = telemetryItem[strBaseType]; // save the passed in base type as a property
    }

    if (telemetryItem[strBaseType] === Event.dataType) { // take collection
        customProperties = telemetryItem[strBaseData][strProperties] || {};
        customMeasurements = telemetryItem[strBaseData].measurements || {};
    } else { // if its not a known type, convert to custom event
        if (telemetryItem[strBaseData]) {
            _extractPropsAndMeasurements(telemetryItem[strBaseData], customProperties, customMeasurements);
        }
    }

    // Extract root level properties from part C telemetryItem.data
    _extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
    if (!isNullOrUndefined(customUndefinedValue)) {
        _convertPropsUndefinedToCustomDefinedValue(customProperties, customUndefinedValue);
    }
    const eventName = telemetryItem[strBaseData].name;
    const eventData = new Event(logger, eventName, customProperties, customMeasurements);
    const data = new Data<Event>(Event.dataType, eventData);
    return _createEnvelope<Event>(logger, Event.envelopeType, telemetryItem, data);
}

export function ExceptionEnvelopeCreator(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem, customUndefinedValue?: any): IEnvelope {
    EnvelopeCreatorInit(logger, telemetryItem);

    // Extract root level properties from part C telemetryItem.data
    const customMeasurements = telemetryItem[strBaseData].measurements || {};
    const customProperties = telemetryItem[strBaseData][strProperties] || {};
    _extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
    if (!isNullOrUndefined(customUndefinedValue)) {
        _convertPropsUndefinedToCustomDefinedValue(customProperties, customUndefinedValue);
    }
    const bd = telemetryItem[strBaseData] as IExceptionInternal;
    const exData = Exception.CreateFromInterface(logger, bd, customProperties, customMeasurements);
    const data = new Data<Exception>(Exception.dataType, exData);
    return _createEnvelope<Exception>(logger, Exception.envelopeType, telemetryItem, data);
}

export function MetricEnvelopeCreator(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem, customUndefinedValue?: any): IEnvelope {
    EnvelopeCreatorInit(logger, telemetryItem);

    const baseData = telemetryItem[strBaseData];
    const props = baseData[strProperties] || {};
    const measurements = baseData.measurements || {};
    _extractPropsAndMeasurements(telemetryItem.data, props, measurements);
    if (!isNullOrUndefined(customUndefinedValue)) {
        _convertPropsUndefinedToCustomDefinedValue(props, customUndefinedValue);
    }
    const baseMetricData = new Metric(logger, baseData.name, baseData.average, baseData.sampleCount, baseData.min, baseData.max, baseData.stdDev, props, measurements);
    const data = new Data<Metric>(Metric.dataType, baseMetricData);
    return _createEnvelope<Metric>(logger, Metric.envelopeType, telemetryItem, data);
}

export function PageViewEnvelopeCreator(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem, customUndefinedValue?: any): IEnvelope {
    EnvelopeCreatorInit(logger, telemetryItem);

    // Since duration is not part of the domain properties in Common Schema, extract it from part C
    let duration;
    let baseData = telemetryItem[strBaseData];
    if (!isNullOrUndefined(baseData) &&
        !isNullOrUndefined(baseData[strProperties]) &&
        !isNullOrUndefined(baseData[strProperties][STR_DURATION])) { // from part B properties
        duration = baseData[strProperties][STR_DURATION];
        delete baseData[strProperties][STR_DURATION];
    } else if (!isNullOrUndefined(telemetryItem.data) &&
        !isNullOrUndefined(telemetryItem.data[STR_DURATION])) { // from custom properties
        duration = telemetryItem.data[STR_DURATION];
        delete telemetryItem.data[STR_DURATION];
    }

    const bd = telemetryItem[strBaseData] as IPageViewTelemetryInternal;

    // special case: pageview.id is grabbed from current operation id. Analytics plugin is decoupled from properties plugin, so this is done here instead. This can be made a default telemetry intializer instead if needed to be decoupled from channel
    let currentContextId;
    if (((telemetryItem.ext || {}).trace || {}).traceID) {
        currentContextId = telemetryItem.ext.trace.traceID;
    }
    const id = bd.id || currentContextId;
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

    _extractPropsAndMeasurements(telemetryItem.data, properties, measurements);
    if (!isNullOrUndefined(customUndefinedValue)) {
        _convertPropsUndefinedToCustomDefinedValue(properties, customUndefinedValue);
    }
    const pageViewData = new PageView(logger, name, url, duration, properties, measurements, id);
    const data = new Data<PageView>(PageView.dataType, pageViewData);
    return _createEnvelope<PageView>(logger, PageView.envelopeType, telemetryItem, data);
}

export function PageViewPerformanceEnvelopeCreator(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem, customUndefinedValue?: any): IEnvelope {
    EnvelopeCreatorInit(logger, telemetryItem);

    const bd = telemetryItem[strBaseData] as IPageViewPerformanceTelemetry;
    const name = bd.name;
    const url = bd.uri || (bd as any).url;
    const properties = bd[strProperties] || {};
    const measurements = bd.measurements || {};
    _extractPropsAndMeasurements(telemetryItem.data, properties, measurements);
    if (!isNullOrUndefined(customUndefinedValue)) {
        _convertPropsUndefinedToCustomDefinedValue(properties, customUndefinedValue);
    }
    const baseData = new PageViewPerformance(logger, name, url, undefined, properties, measurements, bd);
    const data = new Data<PageViewPerformance>(PageViewPerformance.dataType, baseData);
    return _createEnvelope<PageViewPerformance>(logger, PageViewPerformance.envelopeType, telemetryItem, data);
}

export function TraceEnvelopeCreator(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem, customUndefinedValue?: any): IEnvelope {
    EnvelopeCreatorInit(logger, telemetryItem);

    const message = telemetryItem[strBaseData].message;
    const severityLevel = telemetryItem[strBaseData].severityLevel;
    const props = telemetryItem[strBaseData][strProperties] || {};
    const measurements = telemetryItem[strBaseData].measurements || {};
    _extractPropsAndMeasurements(telemetryItem.data, props, measurements);
    if (!isNullOrUndefined(customUndefinedValue)) {
        _convertPropsUndefinedToCustomDefinedValue(props, customUndefinedValue);
    }
    const baseData = new Trace(logger, message, severityLevel, props, measurements);
    const data = new Data<Trace>(Trace.dataType, baseData);
    return _createEnvelope<Trace>(logger, Trace.envelopeType, telemetryItem, data);
}
