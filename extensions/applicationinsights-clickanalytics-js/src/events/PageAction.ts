/**
 * pageAction.ts
 * @author Krishna Yalamanchili (kryalama)
 * @copyright Microsoft 2018
 */

import { WebEvent } from './WebEvent';
import * as DataCollector from '../DataCollector';
import { ITelemetryItem, getPerformance } from "@microsoft/applicationinsights-core-js"
import { IPageActionOverrideValues, IPageActionTelemetry, IPageActionProperties } from '../Interfaces/Datamodel';
import { EventType } from '../Enums';
import { _extractFieldFromObject, _bracketIt, isValueAssigned, extend } from '../common/Utils';

const CONTENT_VERSION = '2.0';

export class PageAction extends WebEvent {
    
    /**
     * API to send pageAction event
     * @param pageActionEvent - PageAction event
     * @param properties - PageAction properties(Part C)
     */
    public trackPageAction(pageActionEvent: IPageActionTelemetry, properties?: IPageActionProperties): void {
        // Get part A properties
        var ext = {};
        ext['web'] = {};
        ext['web']['isManual'] = pageActionEvent.isManual;
        let event: ITelemetryItem = {
            name: 'Ms.Web.PageAction',
            baseType: 'ClickData',
            ext: ext,
            data: {},
            baseData: {}
        };
        event.baseData['name'] = pageActionEvent.name;
        event.baseData['uri'] = pageActionEvent.uri;
        event.baseData['pageType'] = pageActionEvent.pageType;   
        event.baseData['properties'] = pageActionEvent.properties;
        event.baseData['actionType'] = pageActionEvent.actionType;
        event.baseData['behavior'] = pageActionEvent.behavior;
        event.baseData['clickCoordinates'] = pageActionEvent.clickCoordinates;
        event.baseData['content'] = pageActionEvent.content;
        event.baseData['targetUri'] = pageActionEvent.targetUri;
        
        for (let property in properties) {
            if (properties.hasOwnProperty(property)) {
                if (!event.data[property]) {
                    event.data[property] = properties[property];
                }
            }
        }
        this._clickAnalyticsPlugin.core.track(event);
    }

    /**
     * API to create and send a populated PageAction event 
     * @param element - DOM element
     * @param overrideValues - PageAction overrides
     * @param customProperties - Custom properties(Part C)
     * @param isRightClick - Flag for mouse right clicks
     */
    public capturePageAction(element: Element, overrideValues?: IPageActionOverrideValues, customProperties?: { [name: string]: string | number | boolean | string[] | number[] | boolean[] | object }, isRightClick?: boolean): void {
        overrideValues = !isValueAssigned(overrideValues) ? {} : overrideValues;
        var pageActionEvent: IPageActionTelemetry = {};
        var pageActionProperties: IPageActionProperties = isValueAssigned(customProperties) ? customProperties : {};
        this._setCommonProperties(pageActionEvent, pageActionProperties, overrideValues);
        pageActionEvent.isManual = !overrideValues.isAuto;
        pageActionEvent.behavior = this._getBehavior(overrideValues);
        // element in scope is needed for below properties.  We cannot pass element into the plugin call chain.  
        // process them here.
        let elementContent: any = {};
        if (isRightClick) {
            // Default behavior for righ click
            pageActionEvent.behavior = 9 /*CONTEXTMENU*/;
        }
        // Fill PartB
        if (element) {
            pageActionEvent.targetUri = DataCollector._getClickTarget(element);

            elementContent = this._contentHandler.getElementContent(element, EventType.PAGE_ACTION); // collect id,cn tags

            // if the element has a data-*-bhvr attrib defined, use it.
            if (elementContent.bhvr && !isValueAssigned(overrideValues.behavior)) {
                let currentBehavior: string = _extractFieldFromObject(elementContent, 'bhvr');
                pageActionEvent.behavior = this._getValidBehavior(currentBehavior);
            }
        }
        if (isValueAssigned(overrideValues.actionType)) {
            pageActionEvent.actionType = overrideValues.actionType;
        }
        if (isValueAssigned(overrideValues.clickCoordinateX) && isValueAssigned(overrideValues.clickCoordinateY)) {
            pageActionEvent.clickCoordinates = overrideValues.clickCoordinateX + 'X' + overrideValues.clickCoordinateY;
        }
        pageActionEvent.contentVer = CONTENT_VERSION;
        pageActionEvent.content = _bracketIt(JSON.stringify(extend(
            elementContent,
            overrideValues && overrideValues.contentTags ? overrideValues.contentTags : {})));

        
        pageActionProperties.timeToAction = this._getTimeToClick();
        pageActionProperties.refUri = isValueAssigned(overrideValues.refUri) ? overrideValues.refUri : this._config.coreData.referrerUri;
        this.trackPageAction(pageActionEvent, pageActionProperties);
    }

    private _getTimeToClick() {
        // capture performance data into PageTags
        let perf = getPerformance();
        if (perf && perf.timing) {
            var isNavigationStart = perf.timing.navigationStart;
            if (isNavigationStart && isNavigationStart !== 0) {
                return new Date().getTime() - isNavigationStart;
            }
        }
        return -1;
    }

}
