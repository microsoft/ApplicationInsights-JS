// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { strNotSpecified } from "../../constants/Constants";
import { FieldType } from "../../enums/ai/Enums";
import { IDiagnosticLogger } from "../../interfaces/ai/IDiagnosticLogger";
import { IPageViewData } from "../../interfaces/ai/contracts/IPageViewData";
import { ISerializable } from "../../interfaces/ai/telemetry/ISerializable";
import { msToTimeSpan } from "../../utils/HelperFuncsCore";
import {
    dataSanitizeId, dataSanitizeMeasurements, dataSanitizeProperties, dataSanitizeString, dataSanitizeUrl
} from "./Common/DataSanitizer";
import { PageViewDataType } from "./DataTypes";
import { PageViewEnvelopeType } from "./EnvelopeTypes";

export class PageView implements IPageViewData, ISerializable {
    /**
     * @deprecated Use the constant PageViewEnvelopeType instead.
     */
    public static envelopeType = PageViewEnvelopeType;

    /**
     * @deprecated Use the constant PageViewDataType instead.
     */
    public static dataType = PageViewDataType;

    public aiDataContract = {
        ver: FieldType.Required,
        name: FieldType.Default,
        url: FieldType.Default,
        duration: FieldType.Default,
        properties: FieldType.Default,
        measurements: FieldType.Default,
        id: FieldType.Default
    }
    
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
     * Constructs a new instance of the PageEventTelemetry object
     */
    constructor(logger: IDiagnosticLogger, name?: string, url?: string, durationMs?: number, properties?: {[key: string]: string}, measurements?: {[key: string]: number}, id?: string) {
        let _self = this;
        _self.ver = 2;
        _self.id = dataSanitizeId(logger, id);
        _self.url = dataSanitizeUrl(logger, url);
        _self.name = dataSanitizeString(logger, name) || strNotSpecified;
        if (!isNaN(durationMs)) {
            _self.duration = msToTimeSpan(durationMs);
        }
        _self.properties = dataSanitizeProperties(logger, properties);
        _self.measurements = dataSanitizeMeasurements(logger, measurements);
    }
}
