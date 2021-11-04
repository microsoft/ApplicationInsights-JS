/**
 * @copyright Microsoft 2020
 */

import { WebEvent } from "./WebEvent";
import * as DataCollector from "../DataCollector";
import { ITelemetryItem, getPerformance, ICustomProperties, LoggingSeverity, objForEachKey } from "@microsoft/applicationinsights-core-js"
import { IPageActionOverrideValues, IPageActionTelemetry } from "../Interfaces/Datamodel";
import { extractFieldFromObject, bracketIt, isValueAssigned, extend, _ExtendedInternalMessageId } from "../common/Utils";
import { strNotSpecified } from "@microsoft/applicationinsights-common";

export class PageAction extends WebEvent {
    
    /**
     * API to send pageAction event
     * @param pageActionEvent - PageAction event
     * @param properties - PageAction properties(Part C)
     */
    public trackPageAction(pageActionEvent: IPageActionTelemetry, properties?: ICustomProperties): void {
        // Get part A properties
        var ext = {};
        ext["web"] = {};
        let event: ITelemetryItem = {
            name: "Microsoft.ApplicationInsights.{0}.Event",
            baseType: "EventData",
            ext,
            data: {},
            baseData: {}
        };

        this._populateEventDataIfPresent(event.baseData, "name", pageActionEvent.name);
        this._populateEventDataIfPresent(event.data, "baseTypeSource", "ClickEvent");
        this._populateEventDataIfPresent(event.data, "uri", pageActionEvent.uri);
        this._populateEventDataIfPresent(event.data, "pageType", pageActionEvent.pageType);
        this._populateEventDataIfPresent(event.data, "properties", pageActionEvent.properties);
        this._populateEventDataIfPresent(event.data, "actionType", pageActionEvent.actionType);
        this._populateEventDataIfPresent(event.data, "behavior", pageActionEvent.behavior);
        this._populateEventDataIfPresent(event.data, "clickCoordinates", pageActionEvent.clickCoordinates);
        this._populateEventDataIfPresent(event.data, "content", pageActionEvent.content);
        this._populateEventDataIfPresent(event.data, "targetUri", pageActionEvent.targetUri);
        this._populateEventDataIfPresent(event.data, "timeToAction", pageActionEvent.timeToAction);
        this._populateEventDataIfPresent(event.data, "refUri", pageActionEvent.refUri);
        this._populateEventDataIfPresent(event.data, "pageName", pageActionEvent.pageName);
        this._populateEventDataIfPresent(event.data, "parentId", pageActionEvent.parentId);

        if (properties) {
            objForEachKey(properties, (property, value) => {
                if (!event.data[property]) {
                    this._populateEventDataIfPresent(event.data, property, value);
                }
            });
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
        let pageActionEvent: IPageActionTelemetry = { name : ""};
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
                let currentBehavior: string = extractFieldFromObject(elementContent, "bhvr");
                pageActionEvent.behavior = this._getValidBehavior(currentBehavior);
            }

            // Validate to ensure the minimum required field 'contentName' or 'id' is present. However,
            // requiring these fields would result in majority of adopter's content from being collected.
            // Just throw a warning and continue collection.
            if (!isValueAssigned(elementContent.id) && !isValueAssigned(elementContent.contentName)) {
                this._traceLogger.throwInternal(
                    LoggingSeverity.WARNING,
                    _ExtendedInternalMessageId.InvalidContentBlob, "Missing attributes id or contentName in click event. Click event information will still be collected!"
                )
            }
        }
        pageActionEvent.name = elementContent.id || elementContent.contentName || strNotSpecified;
        pageActionEvent.parentId = elementContent.parentid || elementContent.parentName || strNotSpecified;

        if (isValueAssigned(overrideValues.actionType)) {
            pageActionEvent.actionType = overrideValues.actionType;
        }
        if (isValueAssigned(overrideValues.clickCoordinateX) && isValueAssigned(overrideValues.clickCoordinateY)) {
            pageActionEvent.clickCoordinates = overrideValues.clickCoordinateX + "X" + overrideValues.clickCoordinateY;
        }

        this._sanitizePageActionEventContent(elementContent);
        pageActionEvent.content = bracketIt(JSON.stringify(extend(
            elementContent,
            overrideValues && overrideValues.contentTags ? overrideValues.contentTags : {})));

        
        pageActionEvent.timeToAction = this._getTimeToClick();
        pageActionEvent.refUri = isValueAssigned(overrideValues.refUri) ? overrideValues.refUri : this._config.coreData.referrerUri;
        if(this._isUndefinedEvent(pageActionEvent)) return;
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

    private _sanitizePageActionEventContent(pageActionContent: any) {
        if(pageActionContent) {
            delete pageActionContent.id;
            delete pageActionContent.parentid;
            delete pageActionContent.parentname;
            if(this._config && this._config.dataTags && isValueAssigned(this._config.dataTags.parentDataTag)) {
                delete pageActionContent[this._config.dataTags.parentDataTag];
            }
        }
    }

    private _isUndefinedEvent(pageActionEvent: IPageActionTelemetry) {
        if(this._config.dropInvalidEvents) {
            if(pageActionEvent.name === strNotSpecified
                && pageActionEvent.parentId === strNotSpecified
                && pageActionEvent.content === "[{}]")
                return true;
        }
        return false;
    }

}
