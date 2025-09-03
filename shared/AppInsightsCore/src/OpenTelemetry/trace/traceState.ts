import { ICachedValue, createCachedValue, isFunction, isString, objDefine, symbolFor } from "@nevware21/ts-utils";
import { IW3cTraceState } from "../../JavaScriptSDK.Interfaces/IW3cTraceState";
import { STR_EMPTY } from "../../JavaScriptSDK/InternalConstants";
import { createW3cTraceState, isW3cTraceState } from "../../JavaScriptSDK/W3cTraceState";
import { IOTelTraceState } from "../interfaces/trace/IOTelTraceState";

let _otelTraceState: ICachedValue<symbol>;

function _initOTelTraceStateSymbol() {
    if (!_otelTraceState) {
        _otelTraceState = createCachedValue<symbol>(symbolFor("otTraceState"));
    }

    return _otelTraceState;
}

function _createOTelTraceState(traceState: IW3cTraceState): IOTelTraceState {
    if (!_otelTraceState) {
        _otelTraceState = _initOTelTraceStateSymbol();
    }

    let otTraceState = {
        set: (key: string, value: string): IOTelTraceState => {
            let newState = createW3cTraceState(STR_EMPTY, traceState);
            newState.set(key, value);
            return _createOTelTraceState(newState);
        },
        unset: (key: string): IOTelTraceState => {
            let newState = createW3cTraceState(STR_EMPTY, traceState);
            newState.del(key);
            return _createOTelTraceState(newState);
        },
        get: (key: string): string | undefined => {
            return traceState.get(key);
        },
        serialize: (): string => {
            let headers = traceState.hdrs(1);
            if (headers.length > 0) {
                return headers[0];
            }

            return STR_EMPTY;
        }
    };

    objDefine(otTraceState as any, _otelTraceState.v, { g: () => traceState });

    return otTraceState;
}

/**
 * Identifies if the provided value is an OpenTelemetry TraceState object
 * @param value - The value to check
 * @returns true if the value is an OpenTelemetry TraceState object otherwise false
 * @remarks The OpenTelemetry TraceState is an immutable object, meaning that any changes made to the trace state will
 * @since 3.4.0
 */
export function isOTelTraceState(value: any): value is IOTelTraceState {
    if (!_otelTraceState) {
        _otelTraceState = _initOTelTraceStateSymbol();
    }

    if (value && value[_otelTraceState.v]) {
        return true;
    }

    return value && isFunction(value.serialize) && isFunction(value.unset)&& isFunction(value.get)&& isFunction(value.set);
}

/**
 * Returns an OpenTelemetry compatible instance of the trace state, an important distinction
 * between an {@link IW3cTraceState} and an {@link IOTelTraceState} is that the OpenTelemetry version
 * is immutable, meaning that any changes made to the trace state will create and return a new
 * instance for the {@link IOTelTraceState.set} and {@link IOTelTraceState.unset} methods.
 * @param value - The current trace state value
 * @returns An OpenTelemetry compatible instance of the trace state
 * @remarks The OpenTelemetry TraceState is an immutable object, meaning that any changes made to the trace state will
 * @since 3.4.0
 */
export function createOTelTraceState(value?: string | IW3cTraceState | IOTelTraceState | null): IOTelTraceState {
    let traceState: IW3cTraceState | null = null;
    if (isOTelTraceState(value)) {
        let parentTraceState: IW3cTraceState;
        if (_otelTraceState) {
            // Only attempt the lookup if the symbol has been created and therefore possibly
            // assigned to a parent trace state
            parentTraceState = (value as any)[_otelTraceState.v] as IW3cTraceState;
        }
        if (parentTraceState) {
            // Reuse the existing trace state as a parent to avoid copying objects
            traceState = createW3cTraceState(STR_EMPTY, parentTraceState);
        } else {
            // fallback to creating a new trace state
            traceState = createW3cTraceState(value.serialize());
        }
    } else if (isW3cTraceState(value)) {
        traceState = value;
    } else {
        traceState = createW3cTraceState(isString(value) ? value : STR_EMPTY);
    }

    return _createOTelTraceState(traceState);
}
