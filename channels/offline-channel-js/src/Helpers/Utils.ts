import { ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { IPostTransmissionTelemetryItem } from "../Interfaces/IInMemoryBatch";

export function getEndpointDomian(endpoint: string) {
    //TODO: add mapping
    return endpoint;

}

export function getEndpointFromDomian(domain: string) {
    //TODO: add mapping
    return domain;

}

export function isGreaterThanZero(value: number) {
    return value > 0;
}


