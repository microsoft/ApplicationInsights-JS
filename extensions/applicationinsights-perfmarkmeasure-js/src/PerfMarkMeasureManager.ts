/**
* PerfMarkMeasureManager.ts
* @copyright Microsoft 2021
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { INotificationManager, IPerfEvent, PerfManager, getPerformance, getSetValue } from "@microsoft/otel-core-js";
import { IPerfMarkMeasureConfiguration } from "./interfaces/IPerfMarkMeasureConfiguration";

// Names used in the perf Event context
const strCtxMarkName = "prf-mark";
const strCtxMarkEndName = "prf-mark-end";
const strCtxMeasureName = "prf-measure";

export class PerfMarkMeasureManager extends PerfManager {

    constructor(config?: IPerfMarkMeasureConfiguration, manager?: INotificationManager ) {
        super(manager);

        let _config: IPerfMarkMeasureConfiguration = config || {};
        let _uniqueId = 0;

        // Set any defaults that have not been defined
        getSetValue(_config, "useMarks", true);
        getSetValue(_config, "markPrefix", "ai.prfmrk.");
        getSetValue(_config, "useEndMarks", false);
        getSetValue(_config, "markEndPrefix", "ai.prfmrk-end.");
        getSetValue(_config, "useMeasures", true);
        getSetValue(_config, "measurePrefix", "ai.prfmsr.");

        dynamicProto(PerfMarkMeasureManager, this, (_self, _base) => {
            const _perf = getPerformance();

            _self.create = (src: string, payloadDetails?: () => any, isAsync?: boolean): IPerfEvent | null | undefined => {
                let perfEvent = _base.create(src, payloadDetails, isAsync);
                if (perfEvent) {
                    const markName = _getMarkName(perfEvent);
                    if (markName) {
                        _perf.mark(markName);
                    }
                }

                return perfEvent;
            };

            _self.fire = (perfEvent: IPerfEvent) => {
                if (perfEvent) {
                    let mrkEndName = null;
                    if (_config.useEndMarks === true) {
                        mrkEndName = perfEvent.getCtx(strCtxMarkEndName);
                        if (mrkEndName) {
                            _perf.mark(mrkEndName);
                        }
                    }

                    let measureName = perfEvent.getCtx(strCtxMeasureName);
                    if (measureName) {
                        let mrkName = perfEvent.getCtx(strCtxMarkName);
                        if (mrkName) {
                            if (mrkEndName) {
                                _perf.measure(measureName, mrkName, mrkEndName);
                            } else {
                                _perf.measure(measureName, mrkName);
                            }
                        } else {
                            if (mrkEndName) {
                                _perf.measure(measureName, undefined, mrkEndName);
                            } else {
                                _perf.measure(measureName);
                            }
                        }
                    }

                    _base.fire(perfEvent);
                }
            };
        });

        function _getMarkName(perfEvent: IPerfEvent): string {
            let mrkName = null;
            let postFix = "";
            if (_config.uniqueNames) {
                postFix = _uniqueId + ".";
                _uniqueId++;
            }

            if (_config.useMarks) {
                let mappedName = _getMappedName(_config.markNameMap, perfEvent.name);
                if (mappedName) {

                    mrkName = (_config.markPrefix || "") + postFix + mappedName;
                    perfEvent.setCtx(strCtxMarkName, mrkName);
                    if (_config.useEndMarks === true) {
                        let mrkEndName = (_config.markEndPrefix || "") + postFix + mappedName;
                        perfEvent.setCtx(strCtxMarkEndName, mrkEndName);
                    }
                }
            }

            if (_config.useMeasures) {
                let measureName = null;
                let mappedName = _getMappedName(_config.measureNameMap || _config.markNameMap, perfEvent.name);
                if (mappedName) {
                    measureName = (_config.measurePrefix || "") + postFix + mappedName;
                    perfEvent.setCtx(strCtxMeasureName, measureName);
                }
            }

            return mrkName;
        }

        function _getMappedName(map: { [key: string]: string }, name: string) {
            let mappedName = name;
            if (map) {
                // A map exists
                mappedName = map[name];
            }

            return mappedName;
        }
    }

    /**
     * Create a new event and start timing, the manager may return null/undefined to indicate that it does not
     * want to monitor this source event.
     * @param src - The source name of the event
     * @param payloadDetails - An optional callback function to fetch the payload details for the event.
     * @param isAsync - Is the event occurring from a async event
     */
    public create(src: string, payload?: any, isAsync?: boolean): IPerfEvent | null | undefined {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Complete the perfEvent and fire any notifications.
     * @param perfEvent - Fire the event which will also complete the passed event
     */
    public fire(perfEvent: IPerfEvent): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
