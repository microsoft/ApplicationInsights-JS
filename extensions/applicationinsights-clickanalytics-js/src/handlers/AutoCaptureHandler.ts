/**
* @copyright Microsoft 2020
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IDiagnosticLogger, IProcessTelemetryUnloadContext, ITelemetryUnloadState, IUnloadHook, createUniqueNamespace, eventOff, eventOn,
    getDocument, getWindow, isNullOrUndefined, mergeEvtNamespace, onConfigChange
} from "@microsoft/applicationinsights-core-js";
import { arrMap, strTrim } from "@nevware21/ts-utils";
import { ClickAnalyticsPlugin } from "../ClickAnalyticsPlugin";
import { ActionType } from "../Enums";
import { IAutoCaptureHandler, IClickAnalyticsConfiguration, IPageActionOverrideValues } from "../Interfaces/Datamodel";
import { isElementDnt, isKeyboardEnter, isKeyboardSpace, isLeftClick, isMiddleClick, isRightClick } from "../common/Utils";
import { PageAction } from "../events/PageAction";

const clickCaptureInputTypes = { BUTTON: true, CHECKBOX: true, RADIO: true, RESET: true, SUBMIT: true };

export class AutoCaptureHandler implements IAutoCaptureHandler {

    /**
     * @param analyticsPlugin - WebAnalytics plugin
     * @param traceLogger - Trace logger to log to console.
     */
    constructor(protected _analyticsPlugin: ClickAnalyticsPlugin, protected _config: IClickAnalyticsConfiguration, protected _pageAction: PageAction,
        protected _traceLogger: IDiagnosticLogger) {
        let _evtNamespace = mergeEvtNamespace(createUniqueNamespace("AutoCaptureHandler"), (_analyticsPlugin as any)._evtNamespace);
        let _clickCaptureElements: string[];
        let unloadHandler: IUnloadHook = onConfigChange(_config, () => {
            _clickCaptureElements =  arrMap(_config.trackElementTypes.toUpperCase().split(","), tag => strTrim(tag));
        });
        dynamicProto(AutoCaptureHandler, this, (_self) => {
            _self.click = () => {
                let win = getWindow();
                let doc = getDocument();
                if (win) {
                    // IE9 onwards addEventListener is available, 'click' event captures mouse click. mousedown works on other browsers
                    const event = (navigator.appVersion.indexOf("MSIE") !== -1) ? "click" : "mousedown";
                    eventOn(win, event, _processClick, _evtNamespace);
                    eventOn(win, "keyup", _processClick, _evtNamespace);
                } else if (doc) {
                    // IE8 and below doesn't have addEventListener so it will use attachEvent
                    // attaching to window does not work in IE8
                    eventOn(doc, "click", _processClick, _evtNamespace);
                    eventOn(doc, "keyup", _processClick, _evtNamespace);
                }
            };

            _self._doUnload = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState, asyncCallback?: () => void): void | boolean => {
                eventOff(getWindow(), null, null, _evtNamespace);
                eventOff(getDocument(), null, null, _evtNamespace);
                unloadHandler && unloadHandler.rm();
                unloadHandler = null;
            };

            function _capturePageAction(element: Element, overrideValues?: IPageActionOverrideValues, customProperties?: { [name: string]: string | number | boolean | string[] | number[] | boolean[] | object }, isRightClick?: boolean): void {
                const donotTrackTag = _self._config.dataTags.customDataPrefix + _self._config.dataTags.dntDataTag;
                if (!isElementDnt(element, donotTrackTag)) {
                    _self._pageAction.capturePageAction(element, overrideValues, customProperties, isRightClick);
                }
            }
        
            // Process click event
            function _processClick(clickEvent: any) {
                let win = getWindow();
                if (isNullOrUndefined(clickEvent) && win) {
                    clickEvent = win.event; // IE 8 does not pass the event
                }
                if (clickEvent) {
                    let element = clickEvent.srcElement || clickEvent.target;
        
                    // populate overrideValues
                    var overrideValues: IPageActionOverrideValues = {
                        clickCoordinateX: clickEvent.pageX,
                        clickCoordinateY: clickEvent.pageY
                    };
                    var isRightClickObj = isRightClick(clickEvent as MouseEvent);
                    if (isRightClickObj) {
                        overrideValues.actionType = ActionType.CLICKRIGHT;
                    } else if (isLeftClick(clickEvent as MouseEvent)) {
                        overrideValues.actionType = ActionType.CLICKLEFT;
                    } else if (isKeyboardEnter(clickEvent as KeyboardEvent)) {
                        overrideValues.actionType = ActionType.KEYBOARDENTER;
                    } else if (isKeyboardSpace(clickEvent as KeyboardEvent)) {
                        overrideValues.actionType = ActionType.KEYBOARDSPACE;
                    } else if (isMiddleClick(clickEvent as MouseEvent)) {
                        overrideValues.actionType = ActionType.CLICKMIDDLE;
                    } else {
                        return;
                    }
        
                    while (element && element.tagName) {
                        // control property will be available for <label> elements with 'for' attribute, only use it when is a
                        // valid JSLL capture element to avoid infinite loops
                        if (element.control && _clickCaptureElements[element.control.tagName.toUpperCase()]) {
                            element = element.control;
                        }
                        const tagNameUpperCased = element.tagName.toUpperCase();
                        if (!_clickCaptureElements[tagNameUpperCased]) {
                            element = element.parentElement || element.parentNode;
                            continue;
                        } else {
                            // Check allowed INPUT types
                            var sendEvent = tagNameUpperCased === "INPUT" ? clickCaptureInputTypes[element.type.toUpperCase()] : true;
                            if (sendEvent) {
                                _capturePageAction(element, overrideValues, {}, isRightClickObj);
                            }
                            break;
                        }
                    }
                }
            }
        });
    }

    // handle automatic event firing on user click
    public click() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public _doUnload(unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState, asyncCallback?: () => void): void | boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
