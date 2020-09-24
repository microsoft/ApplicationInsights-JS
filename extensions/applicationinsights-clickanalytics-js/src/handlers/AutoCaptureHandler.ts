
/**
 * AutoCaptureHandler.ts
 * @author Krishna Yalamanchili (kryalama)
 * @copyright Microsoft 2018
 */


import { IDiagnosticLogger, _InternalMessageId, getWindow, getDocument } from "@microsoft/applicationinsights-core-js";
import { IAutoCaptureHandler, IPageActionOverrideValues } from '../Interfaces/Datamodel'
import { _isRightClick, _isLeftClick, _isKeyboardEnter, _isKeyboardSpace, _isMiddleClick } from '../common/Utils';
import { ActionType } from '../Enums';
import { ClickAnalyticsPlugin } from "../ClickAnalyticsPlugin";

const clickCaptureInputTypes = { BUTTON: true, CHECKBOX: true, RADIO: true, RESET: true, SUBMIT: true };

export class AutoCaptureHandler implements IAutoCaptureHandler {
    
    /**
     * @param analyticsPlugin - WebAnalytics plugin
     * @param traceLogger - Trace logger to log to console.
     */
   constructor(protected _analyticsPlugin: ClickAnalyticsPlugin, protected _traceLogger: IDiagnosticLogger) {

    }
    // handle automatic event firing on user click
    public click() {
        let win = getWindow();
        let doc = getDocument();
        if (win && win.addEventListener) {
            // IE9 onwards addEventListener is available, 'click' event captures mouse click. mousedown works on other browsers
            var event = (navigator.appVersion.indexOf('MSIE') !== -1) ? 'click' : 'mousedown';
            win.addEventListener(event, (evt) => { this._processClick(evt); }, false);
            win.addEventListener('keyup', (evt) => { this._processClick(evt); }, false);
        } else if (doc && (<any>doc).attachEvent) {
            // IE8 and below doesn't have addEventListener so it will use attachEvent
            // attaching to window does not work in IE8
            (<any>doc).attachEvent('onclick', (evt: Event) => { this._processClick(evt); });
            (<any>doc).attachEvent('keyup', (evt: Event) => { this._processClick(evt); });
        }
    }

    private _processClick(clickEvent: any) {
        var clickCaptureElements = { A: true, BUTTON: true, AREA: true, INPUT: true };
        let win = getWindow();
        clickEvent = clickEvent || win.event; // IE 8 does not pass the event
        let element = clickEvent.srcElement || clickEvent.target;

        // populate overrideValues 
        var overrideValues: IPageActionOverrideValues = {
            isAuto: true,
            clickCoordinateX: clickEvent.pageX,
            clickCoordinateY: clickEvent.pageY
        };
        var isRightClick = _isRightClick(clickEvent as MouseEvent);
        if (isRightClick) {
            overrideValues.actionType = ActionType.CLICKRIGHT;
        } else if (_isLeftClick(clickEvent as MouseEvent)) {
            overrideValues.actionType = ActionType.CLICKLEFT;
        } else if (_isKeyboardEnter(clickEvent as KeyboardEvent)) {
            overrideValues.actionType = ActionType.KEYBOARDENTER;
        } else if (_isKeyboardSpace(clickEvent as KeyboardEvent)) {
            overrideValues.actionType = ActionType.KEYBOARDSPACE;
        } else if (_isMiddleClick(clickEvent as MouseEvent)) {
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
            if (!clickCaptureElements[element.tagName.toUpperCase()]) {
                element = element.parentElement || element.parentNode;
                continue;
            } else {
                // Check allowed INPUT types
                var sendEvent = element.tagName.toUpperCase() === 'INPUT' ? clickCaptureInputTypes[element.type.toUpperCase()] : true;
                if (sendEvent) {
                    this._analyticsPlugin.capturePageAction(element, overrideValues, {}, isRightClick);
                }
                break;
            }
        }
    }
}