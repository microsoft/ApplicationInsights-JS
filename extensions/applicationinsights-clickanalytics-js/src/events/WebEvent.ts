/**
 * @copyright Microsoft 2020
 */


import {
    isValueAssigned, extend
} from "../common/Utils";
import * as DataCollector from "../DataCollector";
import { IDiagnosticLogger, getLocation, hasWindow } from "@microsoft/applicationinsights-core-js";
import { IClickAnalyticsConfiguration, IPageTags, IOverrideValues, IContentHandler, ICoreData, IPageActionTelemetry } from "../Interfaces/Datamodel";
import { ClickAnalyticsPlugin } from "../ClickAnalyticsPlugin";

export class WebEvent {

    protected _pageTags: IPageTags = {};
    protected _pageTypeMetaTag: string;
    protected _marketMetaTag: string;
    protected _behaviorMetaTag: string;

    /**
     * @param clickAnalyticsPlugin - Click Analytics plugin instance
     * @param config - ClickAnalytics configuration object
     * @param contentHandler - Content handler
     * @param id - Id object
     * @param pageTagsCallback - callback methods to get pageTags value
     * @param metaTags - Meta tags
     * @param traceLogger - Trace logger to log to console.
     */
    constructor(protected _clickAnalyticsPlugin: ClickAnalyticsPlugin, protected _config: IClickAnalyticsConfiguration, protected _contentHandler: IContentHandler,
        protected _pageTagsCallback: any, protected _metaTags: { [name: string]: string },
        protected _traceLogger: IDiagnosticLogger) {

    }

    // Fill common PartB fields
    public setBasicProperties(event: IPageActionTelemetry, overrideValues: IOverrideValues) {
        if (!isValueAssigned(event.name)) {
            event.pageName = DataCollector.getPageName(this._config, overrideValues);
        }
        if (!isValueAssigned(event.uri) && hasWindow) {
            event.uri = DataCollector.getUri(this._config, getLocation());
        }
    }

    /**
     * Sets common properties for events that are based on the WebEvent schema.
     * @param event - The event
     */
    public setCommonProperties(event: IPageActionTelemetry, overrideValues: IOverrideValues) {
        this.setBasicProperties(event, overrideValues);
        this._setPageTags(event, overrideValues);

        // extract specific meta tags out of the pageTags.metaTags collection.  These will go into assigned first class fields in the event.
        // the rest will go into pageTags.metaTags collection as is.
        this._pageTypeMetaTag = this._getMetaData(this._metaTags, this._config.coreData, "pageType");
        this._behaviorMetaTag = this._getMetaData(this._metaTags, this._config.coreData, "behavior");

        if (isValueAssigned(overrideValues.pageType)) {
            event.pageType = overrideValues.pageType;
        }
        // Only assign if not overriden and meta data is available
        if (isValueAssigned(this._pageTypeMetaTag) && !isValueAssigned(event.pageType)) {
            event.pageType = this._pageTypeMetaTag;
        }
    }

    /**
     * Sets pageTags.
     * @param event - The event
     */
    protected _setPageTags(event: IPageActionTelemetry, overrideValues: IOverrideValues) {
        // Prepare the pageTags object that is mostly the same for all events.  Event specific pageTags will be added inside event constructors.
       
        if (this._pageTagsCallback) {
            this._pageTags = extend(true, this._pageTags, this._pageTagsCallback());
        }
        if (isValueAssigned(overrideValues.pageTags)) {
            this._pageTags = extend(true, this._pageTags, overrideValues.pageTags);
        }
        // If metadata is present add it to pageTags property
        if (this._metaTags) {
            this._pageTags.metaTags = {};
            // Remove not supported meta data in pageTags.metaTags
            for (var metaTag in this._metaTags) {
                if (metaTag != "behavior" && metaTag != "market" && metaTag != "pageType") {
                    this._pageTags.metaTags[metaTag] = this._metaTags[metaTag];
                }
            }
        }
        // All metadata tags that must be saved as properties have been extracted at this point.  Assign pageTags as is.
        event.properties = event.properties || {};
        event.properties["pageTags"] = this._pageTags;
    }

    protected _getBehavior(overrideValues?: IOverrideValues): string | number {
        let behavior: string | number;
        // If override specified
        if (overrideValues && isValueAssigned(overrideValues.behavior)) {
            behavior = overrideValues.behavior;
        }
        // If behavior meta tag available
        else if (isValueAssigned(this._behaviorMetaTag)) {
            behavior = this._behaviorMetaTag;
        }
        return this._getValidBehavior(behavior);
    }

    protected _getValidBehavior(behavior: string | number): string | number {
       return this._config.behaviorValidator(behavior);
    }

    /**
     * Get the specified metadata value from the collection
     * If overrideValue is specified in the config that takes precedence.
     * @param metaTags - Meta data.
     * @param coreData - Coredata values from configuration.
     * @param metaTagName - Name of the metaTag to get.
     * @returns Meta data value
     */
    private _getMetaData(metaTags: { [name: string]: string }, coreData: ICoreData, metaTagName: string): string {
        if (coreData && coreData[metaTagName]) {
            return coreData[metaTagName];
        } else if (metaTags) {
            return metaTags[metaTagName];
        }
        return "";
    }


}
