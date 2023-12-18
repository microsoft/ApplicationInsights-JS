import { IDiagnosticLogger, _eInternalMessageId, _throwInternal, eLoggingSeverity, isNullOrUndefined } from "@microsoft/applicationinsights-core-js";
import { IInMemoryBatch, IPostTransmissionTelemetryItem } from "./Interfaces/IInMemoryBatch";
import dynamicProto from "@microsoft/dynamicproto-js";

export class InMemoryBatch implements IInMemoryBatch {


    constructor(logger: IDiagnosticLogger, endpoint: string, evts?: IPostTransmissionTelemetryItem[], evtsLimitInMem?: number) {
        let _buffer: IPostTransmissionTelemetryItem[] = evts ? [].concat(evts) : [];
        let _bufferFullMessageSent = false;

        dynamicProto(InMemoryBatch, this, (_self) => {

            _self.endpoint = () =>{
                return endpoint;
            }
            
            _self.addEvent = (payload: IPostTransmissionTelemetryItem) => {
                // evtsLimitInMem can be 0
                // *********************************************************************************************************
                // TODO: should we validate here?
                if (!isNullOrUndefined(evtsLimitInMem) && _self.size() >= evtsLimitInMem) {
                    // sent internal log only once
                    if (!_bufferFullMessageSent) {
                        _throwInternal(logger,
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.InMemoryStorageBufferFull,
                            "Maximum offline in-memory buffer size reached: " + _self.size(),
                            true);
                        _bufferFullMessageSent = true;
                    }

                    return;
                }
                _buffer.push(payload);
            };

            _self.count = (): number => {
                return _buffer.length;
            };

            _self.size = (): number => {
                let size = _buffer.length;
                // *********************************************************************************************************
                // cfg: maxSizePerBatch
                // TODO: add maxBatch, default 64 (should be serializer size)
                // [TODO] serializer do the payload size (size per batch)
                // if batch too large, chop it by serializer
                for (let lp = 0; lp < _buffer.length; lp++) {
                    size += _buffer[lp].data.length;
                }

                return size;
            };

            _self.clear = () => {
                _buffer = [];
                _bufferFullMessageSent = false;
            };

            _self.getItems = (): IPostTransmissionTelemetryItem[] => {
                return _buffer.slice(0)
            };

            _self.split = (fromEvt: number, numEvts?: number) => {
                // Create a new batch with the same iKey
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

            _self.createNew = (newEndpoint: string, evts?: IPostTransmissionTelemetryItem[], evtsLimitInMem?: number) => {
                return new InMemoryBatch(logger, newEndpoint, evts,evtsLimitInMem);
            }

        });
    }

    public addEvent(payload: IPostTransmissionTelemetryItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
    public endpoint() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public count(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
    }

    public size(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
    }

    public clear() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getItems(): IPostTransmissionTelemetryItem[] {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Split this batch into 2 with any events > fromEvent returned in the new batch and all other
     * events are kept in the current batch.
     * @param fromEvt The first event to remove from the current batch.
     * @param numEvts The number of events to be removed from the current batch and returned in the new one. Defaults to all trailing events
     */
    public split(fromEvt: number, numEvts?: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * create current buffer to a new endpoint
     * @param endpoint if not defined, current endpoint will be used
     * @param evts new events to be added
     * @param addCurEvts if it is set to true, current itemss will be transferred to the new batch
     */
    public createNew(endpoint: string, evts?: IPostTransmissionTelemetryItem[], evtsLimitInMem?: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}

