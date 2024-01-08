import dynamicProto from "@microsoft/dynamicproto-js"
import {
    IDiagnosticLogger, IPayloadData, _eInternalMessageId, _throwInternal, eLoggingSeverity, isFunction
} from "@microsoft/applicationinsights-core-js";
import { base64Decode, base64Encode } from "./Helpers/Utils";

interface IStorageTelemetryItem extends IPayloadData {
    /**
     * The storage id of the telemetry item that has been attempted to be sent.
     */
    id?: string | number | null | undefined;
    iKey?: string;
    sync?: boolean;
    criticalCnt?: number;
    isArr?: boolean;
}

export class PayloadHelper {

    constructor(logger: IDiagnosticLogger) {
        dynamicProto(PayloadHelper, this, (_self) => {
            /**
             * Deserializes the current stringto a JSON object.
             */
            _self.base64ToArr = (input: IStorageTelemetryItem): IStorageTelemetryItem => {
                if (!input || !input.isArr) {
                    return input;
                }
             
                try {
                    let data = input.data;
                    if (data) {
                        input.data = base64Decode(data as string);
                    }
                    return input;
                } catch (e) {
                    // if serialization fails return an empty string
                    _throwInternal(logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CannotSerializeObject, (e && isFunction(e.toString)) ? e.toString() : "Error serializing object", null, true);
                }
                return null;
                
            }

            _self.base64ToStr = (item: IStorageTelemetryItem): IStorageTelemetryItem => {
                if (!item || !item.isArr) {
                    return item;
                }
                
                try {
                    let data = item.data;
                    if (data) {
                        item.data = base64Encode(data as any);
                    }
                    return item;
                } catch (e) {
                    // if serialization fails return an empty string
                    _throwInternal(logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CannotSerializeObject, (e && isFunction(e.toString)) ? e.toString() : "Error serializing object", null, true);
                }
                return null;
               
            }
            
        });
    }

    /**
     * Serializes the current object to a JSON string.
     */
    public base64ToArr(input: IStorageTelemetryItem): IStorageTelemetryItem {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Serializes the current object to a JSON string.
     */
    public base64ToStr(item: IStorageTelemetryItem): IStorageTelemetryItem {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}
