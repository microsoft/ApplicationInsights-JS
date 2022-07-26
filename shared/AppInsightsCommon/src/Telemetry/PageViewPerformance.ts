// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";
import { strNotSpecified } from "../Constants";
import { FieldType } from "../Enums";
import { IPageViewPerfData } from "../Interfaces/Contracts/IPageViewPerfData";
import { IPageViewPerformanceTelemetry } from "../Interfaces/IPageViewPerformanceTelemetry";
import { ISerializable } from "../Interfaces/Telemetry/ISerializable";
import { dataSanitizeMeasurements, dataSanitizeProperties, dataSanitizeString, dataSanitizeUrl } from "./Common/DataSanitizer";

export class PageViewPerformance implements IPageViewPerfData, ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.PageviewPerformance";
    public static dataType = "PageviewPerformanceData";

    public aiDataContract = {
        ver: FieldType.Required,
        name: FieldType.Default,
        url: FieldType.Default,
        duration: FieldType.Default,
        perfTotal: FieldType.Default,
        networkConnect: FieldType.Default,
        sentRequest: FieldType.Default,
        receivedResponse: FieldType.Default,
        domProcessing: FieldType.Default,
        properties: FieldType.Default,
        measurements: FieldType.Default
    };

    /**
     * Schema version
     */
    public ver: number; // = 2;

    /**
     * Event name. Keep it low cardinality to allow proper grouping and useful metrics.
     */
    public name: string;
  
    /**
     * Collection of custom properties.
     */
    public properties: any; // = {};
  
    /**
     * Collection of custom measurements.
     */
    public measurements: any; // = {};
  
    /**
     * Request URL with all query string parameters
     */
    public url: string;
 
    /**
     * Request duration in format: DD.HH:MM:SS.MMMMMM. For a page view (PageViewData), this is the duration. For a page view with performance information (PageViewPerfData), this is the page load time. Must be less than 1000 days.
     */
    public duration: string;
  
    /**
     * Identifier of a page view instance. Used for correlation between page view and other telemetry items.
     */
    public id: string;
  
    /**
     * Performance total in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    public perfTotal: string;

    /**
     * Network connection time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    public networkConnect: string;
  
    /**
     * Sent request time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    public sentRequest: string;
  
    /**
     * Received response time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    public receivedResponse: string;
  
    /**
     * DOM processing time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    public domProcessing: string;
  
    /**
     * Constructs a new instance of the PageEventTelemetry object
     */
    constructor(logger: IDiagnosticLogger, name: string, url: string, unused: number, properties?: { [key: string]: string }, measurements?: { [key: string]: number }, cs4BaseData?: IPageViewPerformanceTelemetry) {
        let _self = this;

        _self.ver = 2;
        _self.url = dataSanitizeUrl(logger, url);
        _self.name = dataSanitizeString(logger, name) || strNotSpecified;

        _self.properties = dataSanitizeProperties(logger, properties);
        _self.measurements = dataSanitizeMeasurements(logger, measurements);

        if (cs4BaseData) {
            _self.domProcessing = cs4BaseData.domProcessing;
            _self.duration = cs4BaseData.duration;
            _self.networkConnect = cs4BaseData.networkConnect;
            _self.perfTotal = cs4BaseData.perfTotal;
            _self.receivedResponse = cs4BaseData.receivedResponse;
            _self.sentRequest = cs4BaseData.sentRequest;
        }
    }
}
