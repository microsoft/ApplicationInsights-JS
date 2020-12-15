/**
 * @copyright Microsoft 2020
 */

import { WebEvent } from './WebEvent';
import * as DataCollector from '../DataCollector';
import { ITelemetryItem, getPerformance, ICustomProperties } from "@microsoft/applicationinsights-core-js"
import { IPageActionOverrideValues, IPageActionTelemetry } from '../Interfaces/Datamodel';
import { extractFieldFromObject, bracketIt, isValueAssigned, extend } from '../common/Utils';

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
            name: "Microsoft.ApplicationInsights.{0}.Event",
            baseType: 'ClickEvent',
            ext,
            data: {},
            baseData: {}
        };

        this._populateEventDataIfPresent(event.baseData, 'name', pageActionEvent.name);
        this._populateEventDataIfPresent(event.baseData, 'uri', pageActionEvent.uri);
        this._populateEventDataIfPresent(event.baseData, 'pageType', pageActionEvent.pageType);
        this._populateEventDataIfPresent(event.baseData, 'properties', pageActionEvent.properties);
        this._populateEventDataIfPresent(event.baseData, 'actionType', pageActionEvent.actionType);
        this._populateEventDataIfPresent(event.baseData, 'behavior', pageActionEvent.behavior);
        this._populateEventDataIfPresent(event.baseData, 'clickCoordinates', pageActionEvent.clickCoordinates);
        this._populateEventDataIfPresent(event.baseData, 'content', pageActionEvent.content);
        this._populateEventDataIfPresent(event.baseData, 'targetUri', pageActionEvent.targetUri);
        this._populateEventDataIfPresent(event.data, 'timeToAction', pageActionEvent.timeToAction);
        this._populateEventDataIfPresent(event.data, 'refUri', pageActionEvent.refUri);
        for (let property in properties) {
            if (properties.hasOwnProperty(property)) {
                if (!event.data[property]) {
                    this._populateEventDataIfPresent(event.data, property, properties[property]);
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
        this.setCommonProperties(pageActionEvent, overrideValues);
        pageActionEvent.behavior = this._getBehavior(overrideValues);
        // element in scope is needed for below properties.  We cannot pass element into the plugin call chain.  
        // process them here.
        let elementContent: any = {};
        
        if (isRightClick) {
            // Default behavior for righ click
            pageActionEvent.behavior = this._config.defaultRightClickBhvr;
        }
        // Fill PartB
        if (element) {
            pageActionEvent.targetUri = DataCollector.getClickTarget(element);

            elementContent = this._contentHandler.getElementContent(element); // collect id,cn tags

            // if the element has a data-*-bhvr attrib defined, use it.
            if (elementContent.bhvr && !isValueAssigned(overrideValues.behavior)) {
                let currentBehavior: string = extractFieldFromObject(elementContent, 'bhvr');
                pageActionEvent.behavior = this._getValidBehavior(currentBehavior);
            }
        }
        if (isValueAssigned(overrideValues.actionType)) {
            pageActionEvent.actionType = overrideValues.actionType;
        }
        if (isValueAssigned(overrideValues.clickCoordinateX) && isValueAssigned(overrideValues.clickCoordinateY)) {
            pageActionEvent.clickCoordinates = overrideValues.clickCoordinateX + 'X' + overrideValues.clickCoordinateY;
        }
        pageActionEvent.content = bracketIt(JSON.stringify(extend(
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

    private _populateEventDataIfPresent(obj:any, property:any, value:any) {
        if(isValueAssigned(value)) {
            obj[property] = value;
        }
    }

}
