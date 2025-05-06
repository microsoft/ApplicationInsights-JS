import { IOTelAttributes, OTelAttributeValue } from "@microsoft/applicationinsights-core-js";

export interface IAttributeContainer<V = OTelAttributeValue | unknown> {
    /**
     * The number of attributes that have been set
     * @returns The number of attributes that have been set
     */
    size: number;

    /**
     * The number of attributes that were dropped due to the attribute limit being reached
     * @returns The number of attributes that were dropped due to the attribute limit being reached
     */
    droppedAttributes: number;
    
    clear: () => void;
    get: (key: string) => V | undefined;
    has: (key: string) => boolean;
    set: (key: string, value: V) => boolean;
    keys: () => Iterator<string>;
    entries: () => Iterator<[string, V]>;
    forEach: (callback: (key: string, value: V) => void, thisArg?: any) => void;
    values: () => Iterator<V>;

    toAttributes(): IOTelAttributes;
}
