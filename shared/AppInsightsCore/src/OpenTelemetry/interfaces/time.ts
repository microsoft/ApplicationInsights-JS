
export type OTelHrTimeBase = [number, number];

export interface IOTelHrTime extends OTelHrTimeBase {
    0: number;
    1: number;
    unixNano?: number;
}

export type OTelTimeInput = IOTelHrTime | number | Date;
