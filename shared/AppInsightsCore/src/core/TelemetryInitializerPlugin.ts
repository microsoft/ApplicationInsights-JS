// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { arrAppend, arrForEach, dumpObj } from "@nevware21/ts-utils";
import { _throwInternal } from "../diagnostics/DiagnosticLogger";
import { _eInternalMessageId, eLoggingSeverity } from "../enums/ai/LoggingEnums";
import { IDiagnosticLogger } from "../interfaces/ai/IDiagnosticLogger";
import { IProcessTelemetryContext } from "../interfaces/ai/IProcessTelemetryContext";
import {
    ITelemetryInitializerContainer, ITelemetryInitializerHandler, TelemetryInitializerFunction
} from "../interfaces/ai/ITelemetryInitializers";
import { ITelemetryItem } from "../interfaces/ai/ITelemetryItem";
import { getExceptionName } from "../utils/HelperFuncs";
import { BaseTelemetryPlugin } from "./BaseTelemetryPlugin";

interface _IInternalTelemetryInitializerHandler {
    id: number;
    fn: TelemetryInitializerFunction;
}

function _addInitializer(_initializers: _IInternalTelemetryInitializerHandler[], id: number, telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler {
    let theInitializer = {
        id: id,
        fn: telemetryInitializer
    };

    arrAppend(_initializers, theInitializer);

    let handler: ITelemetryInitializerHandler = {
        remove: () => {
            arrForEach(_initializers, (initializer, idx) => {
                if (initializer.id === theInitializer.id) {
                    _initializers.splice(idx, 1);
                    return -1;
                }
            });
        }
    }

    return handler;
}

function _runInitializers(_initializers: _IInternalTelemetryInitializerHandler[], item: ITelemetryItem, logger: IDiagnosticLogger): boolean {
    let doNotSendItem = false;
    var telemetryInitializersCount = _initializers.length;
    for (var i = 0; i < telemetryInitializersCount; ++i) {
        var telemetryInitializer = _initializers[i];
        if (telemetryInitializer) {
            try {
                if (telemetryInitializer.fn.apply(null, [item]) === false) {
                    doNotSendItem = true;
                    break;
                }
            } catch (e) {
                // log error but dont stop executing rest of the telemetry initializers
                // doNotSendItem = true;
                _throwInternal(
                    logger,
                    eLoggingSeverity.WARNING,
                    _eInternalMessageId.TelemetryInitializerFailed,
                    "Telemetry initializer failed: " + getExceptionName(e),
                    { exception: dumpObj(e) }, true);
            }
        }
    }

    return !doNotSendItem;
}

export class TelemetryInitializerPlugin extends BaseTelemetryPlugin implements ITelemetryInitializerContainer {

    public readonly identifier: string = "TelemetryInitializerPlugin";
    public readonly priority: number = 199;

    constructor() {
        super();

        // NOTE!: DON'T set default values here, instead set them in the _initDefaults() function as it is also called during teardown()
        let _id: number;
        let _initializers: _IInternalTelemetryInitializerHandler[];

        _initDefaults();

        dynamicProto(TelemetryInitializerPlugin, this, (_self, _base) => {
            _self.addTelemetryInitializer = (telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler => {
                return _addInitializer(_initializers, _id++, telemetryInitializer);
            };

            _self.processTelemetry = (item: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void => {
                if (_runInitializers(_initializers, item, itemCtx ? itemCtx.diagLog() : _self.diagLog())) {
                    _self.processNext(item, itemCtx);
                }
            };

            _self._doTeardown = () => {
                _initDefaults();
            };
        });

        function _initDefaults() {
            _id = 0;
            _initializers = [];
        }
    }

    /**
     * Add a telemetry processor to decorate or drop telemetry events.
     * @param telemetryInitializer - The Telemetry Initializer function
     * @returns - A ITelemetryInitializerHandler to enable the initializer to be removed
     */
    public addTelemetryInitializer(telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
