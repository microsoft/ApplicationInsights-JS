/**
* @copyright Microsoft 2020
*/

import { IEventTelemetry } from "@microsoft/applicationinsights-common";
import { IUnloadableComponent } from "@microsoft/applicationinsights-core-js";

/**
 * ClickAnalytics Configuration
 */
export interface IClickAnalyticsConfiguration {
    /**
     * Automatic capture configuration. Default is true
     */
    autoCapture?: boolean;
    /**
     * Callbacks configuration
     */
    callback?: IValueCallback;
    /**
     * Page tags
     */
    pageTags?: { [name: string]: string | number | boolean | string[] | number[] | boolean[] | object };
    /**
     * Core data configuration
     */
    coreData?: ICoreData;
    /**
     * Custom Data Tags provided to ovverride default tags used to capture click data.
     */
    dataTags?: ICustomDataTags;
    /**
     * Validator to use for the data-bhvr value
     */
    behaviorValidator?: (value: string | number) => string | number;
    /**
     * Default Behavior value when Right Click event has occured. This
     * value will be ovverriden if the element has the data-*-bhvr attribute present.
     */
    defaultRightClickBhvr?: string | number;
    /**
     * Flag to drop events that do not have custom event names, no parentId and no data in content (basically no useful click data).
     * Default will be false
     */
    dropInvalidEvents?: boolean;
    /**
    * Enables the logging of values after a "#" character of the URL. Default is "false."
    */
    urlCollectHash?: boolean;
    /**
    * Enables the logging of the query string of the URL. Default is "false."
    */
    urlCollectQuery?: boolean;
}

/**
 * Custom Data Tags Configuration
 */
export interface ICustomDataTags {
    /**
     * When a particular element is not tagged with content name prefix or content name prefix is not provided by user, this flag is used to collect standard HTML attribute for contentName and id.
     */
    useDefaultContentNameOrId?: boolean;
    /**
     * Automatic capture content name and value of elements which are tagged with provided prefix
     */
    customDataPrefix?: string;
    /**
     * Click Analytics supports a JSON blob content meta data tagging instead of individual data-* attributes. The default attribute is data-ai-blob. This property allows for changing that attribute name.
     */
    aiBlobAttributeTag?: string;
    /**
     * Automatic capture metadata name and content with provided prefix
     */
    metaDataPrefix?: string;
    /**
     * Automatic capture all metadata names and content. Default is false. If enabled this will override provided metaTagPrefix.
     */
    captureAllMetaDataContent?: boolean;
    /**
     * Stop traversing up the DOM to capture content name and value of elements when encountered with this tag
     */
    parentDataTag?: string;
    /**
     * Custom attribute Tag to not track telemetry data
     */
    dntDataTag?: string
}

/**
 * Core data configuration
 */
export interface ICoreData {
    /**
     * document.referrer is the default. This is used to override the default value.
     */
    referrerUri?: string;
    /**
     * window.location.href is the default. This is used to override the default value.
     */
    requestUri?: string;
    /**
     * Default page name is derived from the url. This is used to override the default.
     */
    pageName?: string;
    /**
     * PageType is captured from a meta tag named awa-pageType. This is used to override the value or bypass defining meta tags.
     */
    pageType?: string;
}


/**
 * Value Callbacks configuration
 */
export interface IValueCallback {

    /**
     * Function to override the default pageName capturing behavior.
     */
    pageName?: () => string;
    /**
     * A callback function to augument the default pageTags collected during pageAction event.
     */
    pageActionPageTags?: (element?: Element) => IPageTags;
    /**
     * A callback function to populate customized contentName.
     */
    contentName?: (element?: any, useDefaultContentName?: boolean) => string;
}


/**
 * PageTags format
 */
export interface IPageTags {
    /**
     * Meta data tags
     */
    metaTags?: { [name: string]: string };
    /**
     * Any other page tag
     */
    [name: string]: string | number | boolean | string[] | number[] | boolean[] | object | undefined;
}

/**
 * Auto capture handler interface
 */
export interface IAutoCaptureHandler extends IUnloadableComponent {
    /**
     * Auto capture click
     */
    click: () => void;
}

export interface IPageActionOverrideValues extends IOverrideValues {
    /**
     * Uri of the referrer page
     */
    refUri?: string;
    /**
     *  One of the awa.actionType values
     */
    actionType?: string;
    /**
     * Target uri for PageAction events
     */
    targetUri?: string;
    /**
     * Click coordinates relative to the top left of the fully rendered content area in the browser
     */
    clickCoordinateX?: number;
    /**
     * Click coordinates relative to the top left of the fully rendered content area in the browser
     */
    clickCoordinateY?: number;
    /**
     * KVP of the content
     */
    content?: any;
    /**
     * KVPs to be added to the content tags collected on a Page Action event; extends the items in the Content blob in Page Action events
     */
    contentTags?: any;
}

/**
 * Override values interface
 */
export interface IOverrideValues {
    /**
     * One of the awa.behavior values.
     */
    behavior?: string | number;
    /**
     * Page name
     */
    pageName?: string;
    /**
     * Page type
     */
    pageType?: string;
    /**
     * KVP to be added to the page tags collected
     */
    pageTags?: any;
    /**
     * Indicates if the event was fired automatically
     */
    isAuto?: boolean;
}

/**
 * Content interface
 */
export interface IContent {
    /**
     * Friendly name (Content Name) of the content to be used reporting/visualization purposes
     */
    cN?: string;
    /**
     * Unique identifier (friendly names allowed) of the content (Content Id) as designated by the content provider.
     * The name should be unique per contentSource such that the two make up the compound key and such that the contentId can be
     * looked up in the contentSource for additional metadata.
     */
    id?: string;
    /**
     * User specified custom content properties
     */
    [name: string]: string | number | boolean | string[] | number[] | boolean[] | object | undefined;
}

/**
 * Content handler interface
 */
export interface IContentHandler extends IUnloadableComponent {
    /**
     * Get meta data
     */
    getMetadata: () => { [name: string]: string };
    /**
     * Get element content
     */
    getElementContent: (element: Element) => IContent;
}

/**
 * Page Action event
 */
export interface IPageActionTelemetry extends IEventTelemetry {
    /**
     * Target uri for PageAction events
     */
    targetUri?: string;
    /**
     *  One of the awa.actionType values
     */
    actionType?: string;
    /**
     * One of the awa.behavior values.
     */
    behavior?: string | number;
    /**
     * X, Y representing the absolute co-ordinates withrespect to topleft corner of the page. This should be normalized for the screen resolution to provide better heat map.
     */
    clickCoordinates?: string;
    /**
     * JSON-formatted array of content acted upon
     */
    content?: any;
    /**
     * Version indicating content version which aids in parsing the content.
     */
    contentVer?: string;
    /**
     * Uri of the referrer, this is a convinence for adaptors to just leverage PageAction for click analytics without linking it to the respective Page Views.
     */
    refUri?: string;
    /**
     * Time taken in milliseconds since the user saw the page and took the action (such as click on a link, etc.). This will be in seconds.
     */
    timeToAction?: number;
    /**
     * A relative or absolute URL that identifies the page or other item. Defaults to the window location.
     */
    uri?: string;
    /**
     * Page type
     */
    pageType?: string;
    /**
     * Title of the page
     */
    pageName?: string;
    /**
     * Content Id (Parent Id) of the parent in which the content was located;
     */
    parentId?: string;
}
