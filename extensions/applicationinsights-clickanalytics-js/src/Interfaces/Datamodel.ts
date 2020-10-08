/**
 * DataModel.ts
 * @author Krishna Yalamanchili(kryalama) and Hector Hernandez(hectorh)
 * @copyright Microsoft 2020
 * File containing the interfaces for Web Analytics SDK.
 */


import { EventType } from '../Enums';

export const doNotTrackFieldName = 'data-ai-dnt';
export const DEFAULT_DATA_PREFIX = 'data-';
export const DEFAULT_AI_BLOB_ATTRIBUTE_TAG = 'data-ai-blob';

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
     * When a particular element is not tagged with content name prefix or content name prefix is not provided by user, this flag is used to collect standard HTML attribute for contentName.
     */
    useDefaultContentName?: boolean;
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
     * Automatic capture content name and value of elements which are tagged with provided prefix
     */
    parentDataPrefix?: string;
    /**
     * Custom attribute Tag to not track telemetry data
     */
    donotTrackDataTag?: string
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
    [name: string]: string | number | boolean | string[] | number[] | boolean[] | object;
}

/**
 * Auto capture handler interface
 */
export interface IAutoCaptureHandler {
    /**
     * Auto capture click
     */
    click: () => void;
  }

/**
 * Override values interface
 */
export interface IOverrideValues {
    /**
     * One of the awa.behavior values. 
     */
    behavior?: number;
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
    behavior?: number;
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
    [name: string]: string | number | boolean | string[] | number[] | boolean[] | object;
}

 /**
  * Content handler interface
  */
export interface IContentHandler {
    /**
     * Get meta data 
     */
    getMetadata: () => { [name: string]: string };
    /**
     * Get element content 
     */
    getElementContent: (element: Element, eventType?: EventType) => IContent;
    
  }

export interface IRectangle {
    top: number;
    bottom: number;
    left: number;
    right: number;
}


/**
 * Page Action event
 */
export interface IPageActionTelemetry extends ITelemetryEventInternal {
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
    behavior?: number;
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
}

export interface ITelemetryEventProperties {
    /**
     * User specified custom properties
     */
    [name: string]: string | number | boolean | string[] | number[] | boolean[] | object;
}

/**
 * Page Action event properties (part C)
 */
export interface IPageActionProperties extends ITelemetryEventProperties {
    /**
     * Uri of the referrer, this is a convinence for adaptors to just leverage PageAction for click analytics without linking it to the respective Page Views.
     */
    refUri?: string;
    /**
     * Time taken in milliseconds since the user saw the page and took the action (such as click on a link, etc.). This will be in seconds.
     */
    timeToAction?: number;
    /**
     * Server impression Guid, as set by the adopter
     */
    serverImpressionGuid?: string;
    /**
     * List of cookies in semi-colon delimited name value pair
     */
    cookies?: string;
}

export interface ITelemetryEvent {
    /**
     * Page name.
     */
    name?: string;
    /**
     * A relative or absolute URL that identifies the page or other item. Defaults to the window location.
     */
    uri?: string;
    /**
     * Represents locale of the Site user has selected
     */
    market?: string;
    /**
     * Page type
     */
    pageType?: string;
    /**
     * boolean is user logged in
     */
    isLoggedIn?: boolean;
    /**
     * property bag to contain an extension to domain properties - extension to Part B
     */
    properties?: {
        [key: string]: any;
    };
}

export interface ITelemetryEventInternal extends ITelemetryEvent {
    /**
     * An identifier assigned to each distinct impression for the purposes of correlating with pageview.
     * A new id is automatically generated on each pageview. You can manually specify this field if you
     * want to use a specific value instead.
     */
    id?: string;
    /**
     * Version of the part B schema, todo: set this value in trackpageView
     */
    ver?: string;
    /**
     * Flag to report whether the event was fired manually
     */
    isManual?: boolean;
}