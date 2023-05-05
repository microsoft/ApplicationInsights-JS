/**
* @copyright Microsoft 2020
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IDiagnosticLogger, IProcessTelemetryUnloadContext, ITelemetryUnloadState, IUnloadableComponent, getLocation, hasWindow, objExtend
} from "@microsoft/applicationinsights-core-js";
import { ClickAnalyticsPlugin } from "../ClickAnalyticsPlugin";
import { getPageName, getUri } from "../DataCollector";
import {
    IClickAnalyticsConfiguration, IContentHandler, ICoreData, IOverrideValues, IPageActionTelemetry, IPageTags
} from "../Interfaces/Datamodel";
import { isValueAssigned } from "../common/Utils";

export class WebEvent implements IUnloadableComponent {

    protected _pageTags: IPageTags;
    protected _pageTypeMetaTag: string;
    protected _marketMetaTag: string;
    protected _behaviorMetaTag: string;
    protected _clickAnalyticsPlugin: ClickAnalyticsPlugin;
    protected _config: IClickAnalyticsConfiguration;
    protected _contentHandler: IContentHandler;
    protected _pageTagsCallback: any;
    protected _metaTags: { [name: string]: string };
    protected _traceLogger: IDiagnosticLogger;

    /**
     * @param clickAnalyticsPlugin - Click Analytics plugin instance
     * @param config - ClickAnalytics configuration object
     * @param contentHandler - Content handler
     * @param id - Id object
     * @param pageTagsCallback - callback methods to get pageTags value
     * @param metaTags - Meta tags
     * @param traceLogger - Trace logger to log to console.
     */
    constructor(
        clickAnalyticsPlugin: ClickAnalyticsPlugin,
        config: IClickAnalyticsConfiguration,
        contentHandler: IContentHandler,
        pageTagsCallback: any,
        metaTags: { [name: string]: string },
        traceLogger: IDiagnosticLogger) {

        dynamicProto(WebEvent, this, (_self) => {
            _initDefaults();

            function _initDefaults() {
                _self._pageTags = {};
                _self._clickAnalyticsPlugin = clickAnalyticsPlugin;
                _self._config = config;
                _self._contentHandler = contentHandler;
                _self._pageTagsCallback = pageTagsCallback;
                _self._metaTags = metaTags;
                _self._traceLogger = traceLogger;
            }

            _self.setBasicProperties = (event: IPageActionTelemetry, overrideValues: IOverrideValues) => {
                if (!isValueAssigned(event.name)) {
                    event.pageName = getPageName(_self._config, overrideValues);
                }
                if (!isValueAssigned(event.uri) && hasWindow()) {
                    event.uri = getUri(_self._config, getLocation());
                }
            };
        
            /**
             * Sets common properties for events that are based on the WebEvent schema.
             * @param event - The event
             */
            _self.setCommonProperties = (event: IPageActionTelemetry, overrideValues: IOverrideValues) => {
                _self.setBasicProperties(event, overrideValues);
                _self._setPageTags(event, overrideValues);
        
                // extract specific meta tags out of the pageTags.metaTags collection.  These will go into assigned first class fields in the event.
                // the rest will go into pageTags.metaTags collection as is.
                _self._pageTypeMetaTag = _getMetaData(_self._metaTags, _self._config.coreData, "pageType");
                _self._behaviorMetaTag = _getMetaData(_self._metaTags, _self._config.coreData, "behavior");
        
                if (isValueAssigned(overrideValues.pageType)) {
                    event.pageType = overrideValues.pageType;
                }
                // Only assign if not overriden and meta data is available
                if (isValueAssigned(_self._pageTypeMetaTag) && !isValueAssigned(event.pageType)) {
                    event.pageType = _self._pageTypeMetaTag;
                }
            };
        
            /**
             * Sets pageTags.
             * @param event - The event
             */
            _self._setPageTags = (event: IPageActionTelemetry, overrideValues: IOverrideValues) => {
                // Prepare the pageTags object that is mostly the same for all events.  Event specific pageTags will be added inside event constructors.
               
                if (_self._pageTagsCallback) {
                    _self._pageTags = objExtend(true, _self._pageTags, _self._pageTagsCallback());
                }
                if (isValueAssigned(overrideValues.pageTags)) {
                    _self._pageTags = objExtend(true, _self._pageTags, overrideValues.pageTags);
                }
                // If metadata is present add it to pageTags property
                if (_self._metaTags) {
                    _self._pageTags.metaTags = {};
                    // Remove not supported meta data in pageTags.metaTags
                    for (var metaTag in _self._metaTags) {
                        if (metaTag != "behavior" && metaTag != "market" && metaTag != "pageType") {
                            _self._pageTags.metaTags[metaTag] = _self._metaTags[metaTag];
                        }
                    }
                }
                // All metadata tags that must be saved as properties have been extracted at this point.  Assign pageTags as is.
                event.properties = event.properties || {};
                event.properties["pageTags"] = _self._pageTags;
            };
        
            _self._getBehavior = (overrideValues?: IOverrideValues): string | number => {
                let behavior: string | number;
                // If override specified
                if (overrideValues && isValueAssigned(overrideValues.behavior)) {
                    behavior = overrideValues.behavior;
                } else if (isValueAssigned(_self._behaviorMetaTag)) {
                    // If behavior meta tag available
                    behavior = _self._behaviorMetaTag;
                }
                return _self._getValidBehavior(behavior);
            };
        
            _self._getValidBehavior = (behavior: string | number): string | number => {
                return _self._config.behaviorValidator(behavior);
            };
        
            _self._doUnload = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState, asyncCallback?: () => void): void | boolean => {
                _initDefaults();
            };

            /**
             * Get the specified metadata value from the collection
             * If overrideValue is specified in the config that takes precedence.
             * @param metaTags - Meta data.
             * @param coreData - Coredata values from configuration.
             * @param metaTagName - Name of the metaTag to get.
             * @returns Meta data value
             */
            function _getMetaData(metaTags: { [name: string]: string }, coreData: ICoreData, metaTagName: string): string {
                if (coreData && coreData[metaTagName]) {
                    return coreData[metaTagName];
                }
                
                if (metaTags) {
                    return metaTags[metaTagName];
                }

                return "";
            }
        });
    }

    // Fill common PartB fields
    public setBasicProperties(event: IPageActionTelemetry, overrideValues: IOverrideValues) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Sets common properties for events that are based on the WebEvent schema.
     * @param event - The event
     */
    public setCommonProperties(event: IPageActionTelemetry, overrideValues: IOverrideValues) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Teardown / Unload hook to allow implementations to perform some additional unload operations before the BaseTelemetryPlugin
     * finishes it's removal.
     * @param unloadCtx - This is the context that should be used during unloading.
     * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
     * @param asyncCallback - An optional callback that the plugin must call if it returns true to inform the caller that it has completed any async unload/teardown operations.
     * @returns boolean - true if the plugin has or will call asyncCallback, this allows the plugin to perform any asynchronous operations.
     */
    public _doUnload(unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState, asyncCallback?: () => void): void | boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Sets pageTags.
     * @param event - The event
     */
    protected _setPageTags(event: IPageActionTelemetry, overrideValues: IOverrideValues) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    protected _getBehavior(overrideValues?: IOverrideValues): string | number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    protected _getValidBehavior(behavior: string | number): string | number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}
