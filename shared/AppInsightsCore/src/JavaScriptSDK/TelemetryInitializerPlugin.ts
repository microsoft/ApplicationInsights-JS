// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { eLoggingSeverity, _eInternalMessageId } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryInitializerContainer, ITelemetryInitializerHandler, TelemetryInitializerFunction } from "../JavaScriptSDK.Interfaces/ITelemetryInitializers";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { BaseTelemetryPlugin } from "./BaseTelemetryPlugin";
import { _throwInternal } from "./DiagnosticLogger";
import { dumpObj } from "./EnvUtils";
import { arrForEach, getExceptionName } from "./HelperFuncs";
import { strDoTeardown } from "./InternalConstants";

interface _IInternalTelemetryInitializerHandler {
    id: number;
    fn: TelemetryInitializerFunction;
}

export class TelemetryInitializerPlugin extends BaseTelemetryPlugin implements ITelemetryInitializerContainer {

    public identifier: string = "TelemetryInitializerPlugin";
    priority: number = 199;

    constructor() {
        super();

        // NOTE!: DON'T set default values here, instead set them in the _initDefaults() function as it is also called during teardown()
        let _id: number;
        let _initializers: _IInternalTelemetryInitializerHandler[];

        _initDefaults();

        dynamicProto(TelemetryInitializerPlugin, this, (_self, _base) => {

            _self.addTelemetryInitializer = (telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler => {
                let theInitializer = {
                    id: _id++,
                    fn: telemetryInitializer
                };

                _initializers.push(theInitializer);

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

            _self.processTelemetry = (item: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void => {
                var doNotSendItem = false;
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
                                itemCtx.diagLog(),
                                eLoggingSeverity.CRITICAL,
                                _eInternalMessageId.TelemetryInitializerFailed,
                                "One of telemetry initializers failed, telemetry item will not be sent: " + getExceptionName(e),
                                { exception: dumpObj(e) }, true);
                        }
                    }
                }

                if (!doNotSendItem) {
                    _self.processNext(item, itemCtx);
                }
            };

            _self[strDoTeardown] = () => {
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