import {
    IEnvelope, Data, Envelope, SampleRate,
    RemoteDependencyData, Event, Exception,
    Metric, PageView, Trace, PageViewPerformance, IDependencyTelemetry,
    IPageViewPerformanceTelemetry, IPageViewTelemetry, CtxTagKeys,
    UnmappedKeys, AppExtensionKeys, DeviceExtensionKeys,
    IngestExtKeys, WebExtensionKeys, OSExtKeys, HttpMethod, UserExtensionKeys
} from '@microsoft/applicationinsights-common';
import {
    ITelemetryItem, CoreUtils,
    IDiagnosticLogger, LoggingSeverity, _InternalMessageId
} from '@microsoft/applicationinsights-core-js';

export const ContextTagKeys: string[] = [
    "ai.application.ver",
    "ai.application.build",
    "ai.application.typeId",
    "ai.application.applicationId",
    "ai.application.layer",
    "ai.device.id",
    "ai.device.ip",
    "ai.device.language",
    "ai.device.locale",
    "ai.device.model",
    "ai.device.friendlyName",
    "ai.device.network",
    "ai.device.networkName",
    "ai.device.oemName",
    "ai.device.os",
    "ai.device.osVersion",
    "ai.device.roleInstance",
    "ai.device.roleName",
    "ai.device.screenResolution",
    "ai.device.type",
    "ai.device.machineName",
    "ai.device.vmName",
    "ai.device.browser",
    "ai.device.browserVersion",
    "ai.location.ip",
    "ai.location.country",
    "ai.location.province",
    "ai.location.city",
    "ai.operation.id",
    "ai.operation.name",
    "ai.operation.parentId",
    "ai.operation.rootId",
    "ai.operation.syntheticSource",
    "ai.operation.correlationVector",
    "ai.session.id",
    "ai.session.isFirst",
    "ai.session.isNew",
    "ai.user.accountAcquisitionDate",
    "ai.user.accountId",
    "ai.user.userAgent",
    "ai.user.id",
    "ai.user.storeRegion",
    "ai.user.authUserId",
    "ai.user.anonUserAcquisitionDate",
    "ai.user.authUserAcquisitionDate",
    "ai.cloud.name",
    "ai.cloud.role",
    "ai.cloud.roleVer",
    "ai.cloud.roleInstance",
    "ai.cloud.environment",
    "ai.cloud.location",
    "ai.cloud.deploymentUnit",
    "ai.internal.sdkVersion",
    "ai.internal.agentVersion",
    "ai.internal.nodeName",
];

// these two constants are used to filter out properties not needed when trying to extract custom properties and measurements from the incoming payload
const baseType: string = "baseType";
const baseData: string = "baseData";

export abstract class EnvelopeCreator {
    protected _logger: IDiagnosticLogger;

    abstract Create(logger: IDiagnosticLogger, telemetryItem: ITelemetryItem): IEnvelope;

    protected static extractProperties(data: { [key: string]: any }): { [key: string]: any } {
        let customProperties: { [key: string]: any } = null;
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                let value = data[key];
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
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    let value = data[key];
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
        let envelope = new Envelope(logger, data, envelopeType);
        envelope.iKey = telemetryItem.iKey;
        let iKeyNoDashes = telemetryItem.iKey.replace(/-/g, "");
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
            env.tags = [];
        }

        if (!item.ext) {
            item.ext = {};
        }

        if (!item.tags) {
            item.tags = [];
        }

        if (item.tags[UnmappedKeys.applicationVersion]) {
            env.tags[CtxTagKeys.applicationVersion] = item.tags[UnmappedKeys.applicationVersion];
        }

        if (item.tags[UnmappedKeys.applicationBuild]) {
            env.tags[CtxTagKeys.applicationBuild] = item.tags[UnmappedKeys.applicationBuild];
        }

        if (item.ext.user) {
            if (item.ext.user.authId) {
                env.tags[CtxTagKeys.userAuthUserId] = item.ext.user.authId;
            }

            if (item.ext.user.localId) {
                env.tags[CtxTagKeys.userId] = item.ext.user.localId;
            }
        }

        if (item.ext.app) {
            if (item.ext.app.sesId) {
                env.tags[CtxTagKeys.sessionId] = item.ext.app.sesId;
            }
        }

        if (item.tags[CtxTagKeys.sessionIsFirst]) {
            env.tags[CtxTagKeys.sessionIsFirst] = item.tags[CtxTagKeys.sessionIsFirst];
        }

        if (item.ext.device) {
            if (item.ext.device.localId) {
                env.tags[CtxTagKeys.deviceId] = item.ext.device.localId;
            }
        }

        if (item.ext.ingest) {
            if (item.ext.ingest.clientIp) {
                env.tags[CtxTagKeys.deviceIp] = item.ext.ingest.clientIp;
            }
        }

        if (item.ext.web) {
            if (item.ext.web.browserLang) {
                env.tags[CtxTagKeys.deviceLanguage] = item.ext.web.browserLang;
            }
        }

        if (item.tags[UnmappedKeys.deviceLocale]) {
            env.tags[CtxTagKeys.deviceLocale] = item.tags[UnmappedKeys.deviceLocale];
        }

        if (item.ext.device) {
            if (item.ext.device.model) {
                env.tags[CtxTagKeys.deviceModel] = item.ext.device.model;
            }
        }

        if (item.tags[UnmappedKeys.deviceNetwork]) {
            env.tags[CtxTagKeys.deviceNetwork] = item.tags[UnmappedKeys.deviceNetwork];
        }

        if (item.tags[UnmappedKeys.deviceOEMName]) {
            env.tags[CtxTagKeys.deviceOEMName] = item.tags[UnmappedKeys.deviceOEMName];
        }

        if (item.tags[UnmappedKeys.deviceOSVersion]) {
            env.tags[CtxTagKeys.deviceOSVersion] = item.tags[UnmappedKeys.deviceOSVersion];
        }

        if (item.ext.os) {
            if (item.ext.os.deviceOS) {
                env.tags[CtxTagKeys.deviceOS] = item.ext.os.deviceOS;
            }
        }

        if (item.tags[UnmappedKeys.deviceNetwork]) {
            env.tags[CtxTagKeys.deviceNetwork] = item.tags[UnmappedKeys.deviceNetwork];
        }
        if (item.ext.device) {
            if (item.ext.device.deviceType) {
                env.tags[CtxTagKeys.deviceType] = item.ext.device.deviceType;
            }
        }

        if (item.tags[UnmappedKeys.deviceOSVersion]) {
            env.tags[CtxTagKeys.deviceOSVersion] = item.tags[UnmappedKeys.deviceOSVersion];
        }

        if (item.ext.web) {
            if (item.ext.web.screenRes) {
                env.tags[CtxTagKeys.deviceScreenResolution] = item.ext.web.screenRes;
            }
        }

        if (item.tags[SampleRate]) {
            env.tags.sampleRate = item.tags[SampleRate];
        }

        if (item.tags[CtxTagKeys.locationIp]) {
            env.tags[CtxTagKeys.locationIp] = item.tags[CtxTagKeys.locationIp];
        }

        if (item.tags[CtxTagKeys.internalSdkVersion]) {
            env.tags[CtxTagKeys.internalSdkVersion] = item.tags[CtxTagKeys.internalSdkVersion];
        }

        if (item.tags[CtxTagKeys.internalAgentVersion]) {
            env.tags[CtxTagKeys.internalAgentVersion] = item.tags[CtxTagKeys.internalAgentVersion];
        }
        
        // No support for mapping Trace.traceState to 2.0 as it is currently empty

        if (item.ext.trace) {
            if (item.ext.trace.parentID) {
                env.tags[CtxTagKeys.operationParentId] = item.ext.trace.parentID;
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
          
        // remaining items in tags, attempt to map to 2.0 schema
        item.tags.forEach(tag => {
            for (let key in tag) {
                if (env.tags.key) {
                    continue; // already added
                }
                ContextTagKeys.forEach(ct => {
                    if (ct.indexOf(key) > 0) { // if field exists in 2.0
                        env.tags[ct] = tag[key];
                    }
                });
            }
        });
    }
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

        let customMeasurements = {};
        let customProperties = {};
        EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
        let bd = telemetryItem.baseData as IDependencyTelemetry;
        if (CoreUtils.isNullOrUndefined(bd)) {
            logger.warnToConsole("Invalid input for dependency data");
            return null;
        }

        let id = bd.id;
        let absoluteUrl = bd.target;
        let command = bd.name;
        let duration = bd.duration;
        let success = bd.success;
        let resultCode = bd.responseCode;
        let requestAPI = bd.type;
        let method = bd.properties && bd.properties[HttpMethod] ? bd.properties[HttpMethod] : "GET";
        let baseData = new RemoteDependencyData(logger, id, absoluteUrl, command, duration, success, resultCode, method, requestAPI, customProperties, customMeasurements);
        let data = new Data<RemoteDependencyData>(RemoteDependencyData.dataType, baseData);
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
        let eventName = telemetryItem.baseData.name;
        let baseData = new Event(logger, eventName, customProperties, customMeasurements);
        let data = new Data<Event>(Event.dataType, baseData);
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

        let baseData = telemetryItem.baseData as Exception;
        let data = new Data<Exception>(Exception.dataType, baseData);
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

        let customProperties = EnvelopeCreator.extractProperties(telemetryItem.data);
        let name = telemetryItem.baseData.name;
        let average = telemetryItem.baseData.average;
        let sampleCount = telemetryItem.baseData.sampleCount;
        let min = telemetryItem.baseData.min;
        let max = telemetryItem.baseData.max;
        let baseData = new Metric(logger, name, average, sampleCount, min, max, customProperties);
        let data = new Data<Metric>(Metric.dataType, baseData);
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
        let duration = undefined;
        if (!CoreUtils.isNullOrUndefined(telemetryItem.baseData) &&
            !CoreUtils.isNullOrUndefined(telemetryItem.baseData.measurements)) {
            duration = telemetryItem.baseData.measurements.duration;
            delete telemetryItem.baseData.measurements.duration;
        }

        let bd = telemetryItem.baseData as IPageViewTelemetry;
        let name = bd.name;
        let url = bd.uri;
        let properties = bd.properties || {};
        let measurements = bd.measurements || {};

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
            let pageTags = bd.properties;
            for (let key in pageTags) {
                if (pageTags.hasOwnProperty(key)) {
                    properties[key] = pageTags[key];
                }
            }
        }

        let baseData = new PageView(logger, name, url, duration, properties, measurements);
        let data = new Data<PageView>(PageView.dataType, baseData);
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
        let name = bd.name;
        let url = bd.url;
        let properties = bd.properties;
        let measurements = bd.measurements;
        let baseData = new PageViewPerformance(logger, name, url, undefined, properties, measurements);
        let data = new Data<PageViewPerformance>(PageViewPerformance.dataType, baseData);
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

        let message = telemetryItem.baseData.message;
        let severityLevel = telemetryItem.baseData.severityLevel;
        let customProperties = EnvelopeCreator.extractProperties(telemetryItem.data);
        let baseData = new Trace(logger, message, severityLevel, customProperties);
        let data = new Data<Trace>(Trace.dataType, baseData);
        return EnvelopeCreator.createEnvelope<Trace>(logger, Trace.envelopeType, telemetryItem, data);
    }
}
