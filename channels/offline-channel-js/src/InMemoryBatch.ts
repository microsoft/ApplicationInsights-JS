// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { IDiagnosticLogger, ITelemetryItem, isNullOrUndefined } from "@microsoft/applicationinsights-core-js";
import { IInMemoryBatch, IPostTransmissionTelemetryItem } from "./Interfaces/IInMemoryBatch";

export class InMemoryBatch implements IInMemoryBatch {


    constructor(logger: IDiagnosticLogger, endpoint: string, evts?: IPostTransmissionTelemetryItem[], evtsLimitInMem?: number) {
        let _buffer: IPostTransmissionTelemetryItem[] = evts ? [].concat(evts) : [];

        dynamicProto(InMemoryBatch, this, (_self) => {


            _self.endpoint = () =>{
                return endpoint;
            }

            
            _self.addEvent = (payload: IPostTransmissionTelemetryItem | ITelemetryItem) => {
                if (!isNullOrUndefined(evtsLimitInMem) && _self.count() >= evtsLimitInMem) {
                    return false;
                }
                _buffer.push(payload);
                return true;
            };

            _self.count = (): number => {
                return _buffer.length;
            };

            _self.clear = () => {
                _buffer = [];
            };

            _self.getItems = () => {
                return _buffer.slice(0);
            };

            _self.split = (fromEvt: number, numEvts?: number) => {
                // Create a new batch with the same endpointUrl
                let theEvts: IPostTransmissionTelemetryItem[];
                if (fromEvt < _buffer.length) {
                    let cnt = _buffer.length - fromEvt;
                    if (!isNullOrUndefined(numEvts)) {
                        cnt = numEvts < cnt ? numEvts : cnt;
                    }
    
                    theEvts = _buffer.splice(fromEvt, cnt);
                }
    
                return new InMemoryBatch(logger, endpoint, theEvts, evtsLimitInMem);
            };

            _self.createNew = (newEndpoint: string, evts?: IPostTransmissionTelemetryItem[] | ITelemetryItem[], newEvtsLimitInMem?: number) => {
                return new InMemoryBatch(logger, newEndpoint, evts, newEvtsLimitInMem);
            }

        });
    }

    public addEvent(payload: IPostTransmissionTelemetryItem | ITelemetryItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
    public endpoint() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public count(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
    }

    public clear() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getItems(): IPostTransmissionTelemetryItem[] | ITelemetryItem[] {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Split this batch into 2 with any events > fromEvent returned in the new batch and all other
     * events are kept in the current batch.
     * @param fromEvt - The first event to remove from the current batch.

     * @param numEvts - The number of events to be removed from the current batch and returned in the new one. Defaults to all trailing events
     */
    public split(fromEvt: number, numEvts?: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * create current buffer to a new endpoint
     * @param endpoint - if not defined, current endpoint will be used
     * @param evts - new events to be added
     * @param addCurEvts - if it is set to true, current itemss will be transferred to the new batch
     */
    public createNew(endpoint: string, evts?: IPostTransmissionTelemetryItem[] | ITelemetryItem[], evtsLimitInMem?: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}
