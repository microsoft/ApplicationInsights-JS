// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { LoggingSeverity, _InternalMessageId } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryInitializerContainer, ITelemetryInitializerHandler, TelemetryInitializerFunction } from "../JavaScriptSDK.Interfaces/ITelemetryInitializers";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { BaseTelemetryPlugin } from "./BaseTelemetryPlugin";
import { dumpObj } from "./EnvUtils";
import { arrForEach, getExceptionName } from "./HelperFuncs";

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
                            itemCtx.diagLog().throwInternal(
                                LoggingSeverity.CRITICAL,
                                _InternalMessageId.TelemetryInitializerFailed,
                                "One of telemetry initializers failed, telemetry item will not be sent: " + getExceptionName(e),
                                { exception: dumpObj(e) }, true);
                        }
                    }
                }

                if (!doNotSendItem) {
                    _self.processNext(item, itemCtx);
                }
            };

            _self.unload = (itemCtx: IProcessTelemetryContext, isAsync: boolean): void => {
                _base.unload(itemCtx, isAsync);
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

    /**
     * This plugin is being unloaded and should remove any hooked events and cleanup any global/scoped values, after this
     * call the plugin will be removed from the telemetry processing chain and will no longer receive any events..
     * @param itemCtx - This is the context that should be used during unloading if required to flush any cached events.
     * @param isAsync - Should the plugin attempt to unload synchronously or can it complete asynchronously
     */
     public unload(itemCtx: IProcessTelemetryContext, isAsync: boolean): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}