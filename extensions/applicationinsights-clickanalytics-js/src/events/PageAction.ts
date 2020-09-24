/**
 * pageAction.ts
 * @author Krishna Yalamanchili (kryalama)
 * @copyright Microsoft 2018
 */

import { WebEvent } from './WebEvent';
import * as DataCollector from '../DataCollector';
import { IExtendedTelemetryItem, EventLatency, isValueAssigned, extend, getPerformance } from '@ms/1ds-core-js';
import { IPageActionOverrideValues, IPageActionTelemetry, IPageActionProperties } from '../Interfaces/Datamodel';
import { EventType } from '../Enums';
import { _extractFieldFromObject, _bracketIt } from '../common/Utils';

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
        let event: IExtendedTelemetryItem = {
            name: 'Ms.Web.PageAction',
            baseType: 'PageActionData',
            ext: ext,
            data: {},
            baseData: {},
            latency: EventLatency.Normal
        };
        event.baseData['name'] = pageActionEvent.name;
        event.baseData['uri'] = pageActionEvent.uri;
        event.baseData['market'] = pageActionEvent.market;
        event.baseData['pageType'] = pageActionEvent.pageType;
        event.baseData['isLoggedIn'] = pageActionEvent.isLoggedIn;
        event.baseData['id'] = pageActionEvent.id;
        event.baseData['properties'] = pageActionEvent.properties;
        event.baseData['ver'] = pageActionEvent.ver;
        event.baseData['actionType'] = pageActionEvent.actionType;
        event.baseData['behavior'] = pageActionEvent.behavior;
        event.baseData['clickCoordinates'] = pageActionEvent.clickCoordinates;
        event.baseData['content'] = pageActionEvent.content;
        event.baseData['contentVer'] = pageActionEvent.contentVer;
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

            elementContent = this._contentHandler.getElementContent(element, EventType.PAGE_ACTION); // collect data-bi tags
            elementContent = extend(elementContent, this._getCustomTags(element)); // collect ms.* tags

            // if the element has a data-bi-bhvr attrib defined, use it.
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
        let pageActionContentTags = this._config.callback.pageActionContentTags;
        pageActionEvent.content = _bracketIt(JSON.stringify(extend(
            elementContent,
            typeof pageActionContentTags === 'function' ? pageActionContentTags(element) : {},
            overrideValues && overrideValues.contentTags ? overrideValues.contentTags : {})));

        // set PartC values
        pageActionProperties.timeToAction = this._getTimeToClick();
        pageActionProperties.refUri = isValueAssigned(overrideValues.refUri) ? overrideValues.refUri : this._config.coreData.referrerUri;
        this.trackPageAction(pageActionEvent, pageActionProperties);
    }

    private _getCustomTags(obj: Element) {
        /// <summary>Collect data from attributes that have a ms. prefix.  
        /// This functionality is there to provide compatibility with WEDCS.  
        ///   TODO: When all adopters have moved to the new tagging taxanomy we can remove this functionality. 
        /// </summary>
        /// <param type='Object'>The element from which attributes need to be collected.</param>
        /// <returns type='Object'>Tags collection/property bag</returns>
        var customParameters = {};
        while (obj) {
            if (DataCollector._isPii(obj)) {
                continue;
            }
            for (var attr in obj.attributes) {
                if (attr) {
                    if (obj.attributes[attr]) {
                        var nn = obj.attributes[attr].name;
                        if (nn) {
                            if (nn.toLowerCase().indexOf('ms.') === 0) {
                                customParameters[nn] = obj.attributes[attr].value;
                            }
                        }
                    }
                }
            }
            obj = <Element>(obj.parentElement || obj.parentNode);
        }
        return customParameters;
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
