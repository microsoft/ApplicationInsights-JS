/**
 * @copyright Microsoft 2020
 */

import { IDiagnosticLogger, _InternalMessageId, getWindow, getDocument, EventHelper, isNullOrUndefined } from "@microsoft/applicationinsights-core-js";
import { IAutoCaptureHandler, IPageActionOverrideValues, IClickAnalyticsConfiguration } from '../Interfaces/Datamodel'
import { isRightClick, isLeftClick, isKeyboardEnter, isKeyboardSpace, isMiddleClick, isElementDnt } from '../common/Utils';
import { ActionType } from '../Enums';
import { ClickAnalyticsPlugin } from "../ClickAnalyticsPlugin";
import { PageAction } from '../events/PageAction';

const clickCaptureInputTypes = { BUTTON: true, CHECKBOX: true, RADIO: true, RESET: true, SUBMIT: true };

export class AutoCaptureHandler implements IAutoCaptureHandler {
    
    /**
     * @param analyticsPlugin - WebAnalytics plugin
     * @param traceLogger - Trace logger to log to console.
     */
   constructor(protected _analyticsPlugin: ClickAnalyticsPlugin, protected _config: IClickAnalyticsConfiguration, protected _pageAction: PageAction,
     protected _traceLogger: IDiagnosticLogger) {

    }
    // handle automatic event firing on user click
    public click() {
        let win = getWindow();
        let doc = getDocument();
        if (win) {
            // IE9 onwards addEventListener is available, 'click' event captures mouse click. mousedown works on other browsers
            const event = (navigator.appVersion.indexOf('MSIE') !== -1) ? 'click' : 'mousedown';
            EventHelper.Attach(win, event , (evt:any) => { this._processClick(evt); });
            EventHelper.Attach(win, 'keyup' , (evt:any) => { this._processClick(evt); });
        } else if (doc) {
            // IE8 and below doesn't have addEventListener so it will use attachEvent
            // attaching to window does not work in IE8
            EventHelper.Attach(doc, 'onclick' , (evt:any) => { this._processClick(evt); });
            EventHelper.Attach(doc, 'keyup' , (evt:any) => { this._processClick(evt); });
        }
    }

    /**
     * API to create and send a populated PageAction event 
     * @param element - DOM element
     * @param overrideValues - PageAction overrides
     * @param customProperties - Custom properties(Part C)
     * @param isRightClick - Flag for mouse right clicks
     */
    private capturePageAction(element: Element, overrideValues?: IPageActionOverrideValues, customProperties?: { [name: string]: string | number | boolean | string[] | number[] | boolean[] | object }, isRightClick?: boolean): void {
        const donotTrackTag = this._config.dataTags.customDataPrefix + this._config.dataTags.dntDataTag;
        if (!isElementDnt(element, donotTrackTag)) {
            this._pageAction.capturePageAction(element, overrideValues, customProperties, isRightClick);
        }

    }

    // Process click event
    private _processClick(clickEvent: any) {
        var clickCaptureElements = { A: true, BUTTON: true, AREA: true, INPUT: true };
        let win = getWindow();
        if(isNullOrUndefined(clickEvent) && win) {
            clickEvent = win.event; // IE 8 does not pass the event
        }
        if(clickEvent) {
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
                if (element.control && clickCaptureElements[element.control.tagName.toUpperCase()]) {
                    element = element.control;
                }
                const tagNameUpperCased = element.tagName.toUpperCase();
                if (!clickCaptureElements[tagNameUpperCased]) {
                    element = element.parentElement || element.parentNode;
                    continue;
                } else {
                    // Check allowed INPUT types
                    var sendEvent = tagNameUpperCased === 'INPUT' ? clickCaptureInputTypes[element.type.toUpperCase()] : true;
                    if (sendEvent) {
                        this.capturePageAction(element, overrideValues, {}, isRightClickObj);
                    }
                    break;
                }
            }
        }
        
    }
}