/**
 * @copyright Microsoft 2020
 */

import { WebEvent } from './WebEvent';
import * as DataCollector from '../DataCollector';
import { ITelemetryItem, getPerformance, ICustomProperties } from "@microsoft/applicationinsights-core-js"
import { IPageActionOverrideValues, IPageActionTelemetry } from '../Interfaces/Datamodel';
import { _extractFieldFromObject, _bracketIt, isValueAssigned, extend } from '../common/Utils';

export class PageAction extends WebEvent {
    
    /**
     * API to send pageAction event
     * @param pageActionEvent - PageAction event
     * @param properties - PageAction properties(Part C)
     */
    public trackPageAction(pageActionEvent: IPageActionTelemetry, properties?: ICustomProperties): void {
        // Get part A properties
        var ext = {};
        ext['web'] = {};
        let event: ITelemetryItem = {
            name: '',
            baseType: 'ClickData',
            ext,
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
        event.data['timeToAction'] = pageActionEvent.timeToAction;
        event.data['refUri'] = pageActionEvent.refUri;
        
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
        let pageActionEvent: IPageActionTelemetry = { name : ''};
        let pageActionProperties: ICustomProperties = isValueAssigned(customProperties) ? customProperties : {};
        this._setCommonProperties(pageActionEvent, overrideValues);
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

            elementContent = this._contentHandler.getElementContent(element); // collect id,cn tags

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
        pageActionEvent.content = _bracketIt(JSON.stringify(extend(
            elementContent,
            overrideValues && overrideValues.contentTags ? overrideValues.contentTags : {})));

        
        pageActionEvent.timeToAction = this._getTimeToClick();
        pageActionEvent.refUri = isValueAssigned(overrideValues.refUri) ? overrideValues.refUri : this._config.coreData.referrerUri;
        this.trackPageAction(pageActionEvent, pageActionProperties);
    }

    // capture performance data into PageTags
    private _getTimeToClick() {
        const perf = getPerformance();
        if (perf && perf.timing) {
            var isNavigationStart = perf.timing.navigationStart;
            if (isNavigationStart && isNavigationStart !== 0) {
                return new Date().getTime() - isNavigationStart;
            }
        }
        return -1;
    }

}
