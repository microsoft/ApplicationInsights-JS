/**
* @copyright Microsoft 2020
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    ICustomProperties, IDiagnosticLogger, ITelemetryItem, _eInternalMessageId, _throwInternal, eLoggingSeverity, getPerformance, objExtend,
    objForEachKey, strNotSpecified
} from "@microsoft/applicationinsights-core-js";
import { ClickAnalyticsPlugin } from "../ClickAnalyticsPlugin";
import { getClickTarget } from "../DataCollector";
import { IClickAnalyticsConfiguration, IContentHandler, IPageActionOverrideValues, IPageActionTelemetry } from "../Interfaces/Datamodel";
import { bracketIt, extractFieldFromObject, isValueAssigned } from "../common/Utils";
import { WebEvent } from "./WebEvent";

export class PageAction extends WebEvent {
    
    constructor(
        clickAnalyticsPlugin: ClickAnalyticsPlugin,
        config: IClickAnalyticsConfiguration,
        contentHandler: IContentHandler,
        pageTagsCallback: any,
        metaTags: { [name: string]: string },
        traceLogger: IDiagnosticLogger) {
        super(clickAnalyticsPlugin, config, contentHandler, pageTagsCallback, metaTags, traceLogger);
        
        dynamicProto(PageAction, this, (_self, _base) => {

            _self.trackPageAction = (pageActionEvent: IPageActionTelemetry, properties?: ICustomProperties): void => {
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
        
                _populateEventDataIfPresent(event.baseData, "name", pageActionEvent.name);
                _populateEventDataIfPresent(event.data, "baseTypeSource", "ClickEvent");
                _populateEventDataIfPresent(event.data, "uri", pageActionEvent.uri);
                _populateEventDataIfPresent(event.data, "pageType", pageActionEvent.pageType);
                _populateEventDataIfPresent(event.data, "properties", pageActionEvent.properties);
                _populateEventDataIfPresent(event.data, "actionType", pageActionEvent.actionType);
                _populateEventDataIfPresent(event.data, "behavior", pageActionEvent.behavior);
                _populateEventDataIfPresent(event.data, "clickCoordinates", pageActionEvent.clickCoordinates);
                _populateEventDataIfPresent(event.data, "content", pageActionEvent.content);
                _populateEventDataIfPresent(event.data, "targetUri", pageActionEvent.targetUri);
                _populateEventDataIfPresent(event.data, "timeToAction", pageActionEvent.timeToAction);
                _populateEventDataIfPresent(event.data, "refUri", pageActionEvent.refUri);
                _populateEventDataIfPresent(event.data, "pageName", pageActionEvent.pageName);
                _populateEventDataIfPresent(event.data, "parentId", pageActionEvent.parentId);
        
                if (properties) {
                    objForEachKey(properties, (property, value) => {
                        if (!event.data[property]) {
                            _populateEventDataIfPresent(event.data, property, value);
                        }
                    });
                }
                _self._clickAnalyticsPlugin.core.track(event);
            };
        
            /**
             * API to create and send a populated PageAction event
             * @param element - DOM element
             * @param overrideValues - PageAction overrides
             * @param customProperties - Custom properties(Part C)
             * @param isRightClick - Flag for mouse right clicks
             */
            _self.capturePageAction = (element: Element, overrideValues?: IPageActionOverrideValues, customProperties?: { [name: string]: string | number | boolean | string[] | number[] | boolean[] | object }, isRightClick?: boolean): void => {
                overrideValues = !isValueAssigned(overrideValues) ? {} : overrideValues;
                let pageActionEvent: IPageActionTelemetry = { name : ""};
                let pageActionProperties: ICustomProperties = isValueAssigned(customProperties) ? customProperties : {};
                _self.setCommonProperties(pageActionEvent, overrideValues);
                pageActionEvent.behavior = _self._getBehavior(overrideValues);
                // element in scope is needed for below properties.  We cannot pass element into the plugin call chain.
                // process them here.
                let elementContent: any = {};
                
                if (isRightClick) {
                    // Default behavior for righ click
                    pageActionEvent.behavior = _self._config.defaultRightClickBhvr;
                }
                // Fill PartB
                if (element) {
                    pageActionEvent.targetUri = getClickTarget(element);
        
                    elementContent = _self._contentHandler.getElementContent(element); // collect id,cn tags
        
                    // if the element has a data-*-bhvr attrib defined, use it.
                    if (elementContent.bhvr && !isValueAssigned(overrideValues.behavior)) {
                        let currentBehavior: string = extractFieldFromObject(elementContent, "bhvr");
                        pageActionEvent.behavior = _self._getValidBehavior(currentBehavior);
                    }
        
                    // Validate to ensure the minimum required field 'contentName' or 'id' is present. However,
                    // requiring these fields would result in majority of adopter's content from being collected.
                    // Just throw a warning and continue collection.
                    if (!isValueAssigned(elementContent.id) && !isValueAssigned(elementContent.contentName)) {
                        _throwInternal(_self._traceLogger,
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.InvalidContentBlob, "Missing attributes id or contentName in click event. Click event information will still be collected!"
                        );
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
        
                _sanitizePageActionEventContent(elementContent);
                pageActionEvent.content = bracketIt(JSON.stringify(objExtend(
                    elementContent,
                    overrideValues && overrideValues.contentTags ? overrideValues.contentTags : {})));
        
                
                pageActionEvent.timeToAction = _getTimeToClick();
                pageActionEvent.refUri = isValueAssigned(overrideValues.refUri) ? overrideValues.refUri : _self._config.coreData.referrerUri;
                if(_isUndefinedEvent(pageActionEvent)) {
                    return;
                }
                _self.trackPageAction(pageActionEvent, pageActionProperties);
            };
            
            // capture performance data into PageTags
            function _getTimeToClick() {
                const perf = getPerformance();
                if (perf && perf.timing) {
                    var isNavigationStart = perf.timing.navigationStart;
                    if (isNavigationStart && isNavigationStart !== 0) {
                        return new Date().getTime() - isNavigationStart;
                    }
                }
                return -1;
            }

            function _populateEventDataIfPresent(obj:any, property:any, value:any) {
                if(isValueAssigned(value)) {
                    obj[property] = value;
                }
            }

            function _sanitizePageActionEventContent(pageActionContent: any) {
                if(pageActionContent) {
                    delete pageActionContent.id;
                    delete pageActionContent.parentid;
                    delete pageActionContent.parentname;
                    if(_self._config && _self._config.dataTags && isValueAssigned(_self._config.dataTags.parentDataTag)) {
                        delete pageActionContent[_self._config.dataTags.parentDataTag];
                    }
                }
            }

            function _isUndefinedEvent(pageActionEvent: IPageActionTelemetry) {
                if(_self._config.dropInvalidEvents) {
                    if(pageActionEvent.name === strNotSpecified
                        && pageActionEvent.parentId === strNotSpecified
                        && pageActionEvent.content === "[{}]") {
                        return true;
                    }
                }

                return false;
            }
        });
    }

    /**
     * API to send pageAction event
     * @param pageActionEvent - PageAction event
     * @param properties - PageAction properties(Part C)
     */
    public trackPageAction(pageActionEvent: IPageActionTelemetry, properties?: ICustomProperties): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * API to create and send a populated PageAction event
     * @param element - DOM element
     * @param overrideValues - PageAction overrides
     * @param customProperties - Custom properties(Part C)
     * @param isRightClick - Flag for mouse right clicks
     */
    public capturePageAction(element: Element, overrideValues?: IPageActionOverrideValues, customProperties?: { [name: string]: string | number | boolean | string[] | number[] | boolean[] | object }, isRightClick?: boolean): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
