/**
* EventBatch.ts
* @author Nev Wylie (newylie)
* @copyright Microsoft 2020
*/
import { isNullOrUndefined, isValueAssigned } from "@microsoft/1ds-core-js";
import { IPostTransmissionTelemetryItem } from "./DataModels";
import { STR_EMPTY, STR_MSFPC } from "./InternalConstants";

function _getEventMsfpc(theEvent: IPostTransmissionTelemetryItem): string {
    let intWeb = ((theEvent.ext || {})["intweb"]);
    if (intWeb && isValueAssigned(intWeb[STR_MSFPC])) {
        return intWeb[STR_MSFPC];
    }

    return null;
}

function _getMsfpc(theEvents: IPostTransmissionTelemetryItem[]): string {
    let msfpc: string = null;
    
    for (let lp = 0; msfpc === null && lp < theEvents.length; lp++) {
        msfpc = _getEventMsfpc(theEvents[lp]);
    }

    return msfpc;
}

/**
* This class defines a "batch" events related to a specific iKey, it is used by the PostChannel and HttpManager
* to collect and transfer ownership of events without duplicating them in-memory. This reduces the previous
* array duplication and shared ownership issues that occurred due to race conditions caused by the async nature
* of sending requests.
*/
export class EventBatch {

    /**
     * Creates a new Event Batch object
     * @param iKey The iKey associated with this batch of events
     */
    public static create(iKey: string, theEvents?: IPostTransmissionTelemetryItem[]): EventBatch {
        return new EventBatch(iKey, theEvents);
    }

    /**
     * Returns the iKey associated with this batch of events
     */
    public iKey: () => string;

    /**
     * Returns the first msfpc value from the batch
     */
    public Msfpc:() => string;

    /**
     * Returns the number of events contained in the batch
     */
    public count: () => number;

    public events: () => IPostTransmissionTelemetryItem[];

    /**
     * Add all of the events to the current batch, if the max number of events would be exceeded then no
     * events are added.
     * @param theEvents - The events that needs to be batched.
     * @returns The number of events added.
     */
    public addEvent: (theEvents: IPostTransmissionTelemetryItem) => boolean;

    /**
     * Split this batch into 2 with any events > fromEvent returned in the new batch and all other
     * events are kept in the current batch.
     * @param fromEvent The first event to remove from the current batch.
     * @param numEvents The number of events to be removed from the current batch and returned in the new one. Defaults to all trailing events
     */
    public split: (fromEvent: number, numEvents?: number) => EventBatch;

    /**
     * Private constructor so that caller is forced to use the static create method.
     * @param iKey - The iKey to associate with the events (not validated)
     * @param addEvents - The optional collection of events to assign to this batch - defaults to an empty array.
     */
    private constructor(iKey: string, addEvents?: IPostTransmissionTelemetryItem[]) {
        let events: IPostTransmissionTelemetryItem[] = addEvents ? [].concat(addEvents) : [];
        let _self = this;
        let _msfpc = _getMsfpc(events);

        _self.iKey = (): string => {
            return iKey;
        };

        _self.Msfpc = (): string => {
            // return the cached value unless it's undefined -- used to avoid cpu
            return _msfpc || STR_EMPTY;
        };

        _self.count = (): number => {
            return events.length;
        };

        _self.events = (): IPostTransmissionTelemetryItem[] => {
            return events;
        };

        _self.addEvent = (theEvent: IPostTransmissionTelemetryItem): boolean => {
            if (theEvent) {
                events.push(theEvent);
                if (!_msfpc) {
                    // Not found so try and find one
                    _msfpc = _getEventMsfpc(theEvent);
                }

                return true;
            }

            return false;
        };

        _self.split = (fromEvent: number, numEvents?: number) => {
            // Create a new batch with the same iKey
            let theEvents: IPostTransmissionTelemetryItem[];
            if (fromEvent < events.length) {
                let cnt = events.length - fromEvent;
                if (!isNullOrUndefined(numEvents)) {
                    cnt = numEvents < cnt ? numEvents : cnt;
                }

                theEvents = events.splice(fromEvent, cnt);

                // reset the fetched msfpc value
                _msfpc = _getMsfpc(events);
            }

            return new EventBatch(iKey, theEvents);
        };
    }
}
