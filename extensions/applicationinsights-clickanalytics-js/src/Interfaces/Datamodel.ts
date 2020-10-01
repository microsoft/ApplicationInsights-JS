/**
 * DataModel.ts
 * @author Krishna Yalamanchili(kryalama) and Hector Hernandez(hectorh)
 * @copyright Microsoft 2018
 * File containing the interfaces for Web Analytics SDK.
 */


import { EventType } from '../Enums';

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
     * When a particular element is not tagged with content name prefix or content name prefix is not provided by user, this flag is used to collect standard HTML attribute for contentName.
     */
    useDefaultContentName?: boolean;
    /**
     * Automatic capture content name and value of elements which are tagged with provided prefix
     */
    contentNamePrefix?: string;
    /**
     * Web Analytics supports a JSON blob content meta data tagging instead of individual data-* attributes. The default attribute is data-ai-blob. This property allows for changing that attribute name.
     */
    aiBlobAttributeTag?: string;
    /**
     * Page tags 
     */
    pageTags?: { [name: string]: string | number | boolean | string[] | number[] | boolean[] | object };
    /**
     * Core data configuration
     */
    coreData?: ICoreData;
    /**
     * Enables the logging of values after a "#" character of the URL. Default is "false."
     */
    urlCollectHash?: boolean;
   /**
    * Enables the logging of the query string of the URL. Default is "false."
    */
    urlCollectQuery?: boolean;
    /**
     * Automatic capture metadata name and content with provided prefix
     */
    metaDataPrefix?: string;
    /**
     * Automatic capture all metadata names and content. Default is false. If enabled this will override provided metaTagPrefix.
     */
    captureAllMetaDataContent?: boolean;


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
     * A callback function to augument the default content tags collected in the content blob on a pageAction event.
     */
    pageActionContentTags?: (element?: Element) => IPageTags;
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
     * Name (Content Source) of the Content Management System (CMS) or other source of content that provided this piece of content 
     * to be rendered on the given page. If there is no CMS and the content is hard-coded from the app, "App" is the recommended value.
     */
    cS?: string;
    /**
     * Type (Content Type) of content being displayed. 
     * Enumerated values: 
     * 1. Other: To be used when the type is known but not available in this list. 
     * 2. Advertisement: An advertisement often linking internally or externally and often needing to be reported to the ad-provider.
     * 3. Editorial: Editorial or programmable content; Often managed by a marketing teram and controlled by a Content Management System.
     * 4. Media: A piece of media cotnent such as a video, song, etc...
     * 5. Product: Generically a product avaialble for purchase/sale;specific product ID should be listed in the "product" field.
     */
    cT?: string;
    /**
     * Content Id (Parent Id) of the parent in which the content was located; an area is an arbitrary grouping of content on a page
     */
    parentId?: string;
    /**
     * Content Name (Parent Name) of the parent in which the content was located; an area is an arbitrary grouping of content on a page
     */
    parentName?: string;
    /**
     * Name (Template Name) of the template for the given area; useful for grouping BI at the area/slot level into template-specific 
     * groups such that if the page layout changes, the BI can be isolated. For example, if your TopNav bar has 4 slots and you wish 
     * to go to 5 slots, you can name the templates differently such that we can group BI on the 4-slot area separately from the 5-slot 
     * area so that we can compare the performance of Slot 1 separately before and after the change content on a page
     */
    tN?: string;
    /**
     * Slot number in which the content sits in the given area; for example, if you have an area of the page where you 
     * recommend 5 products for the customer based on what he just put in his cart, each of the 5 products are occupying 
     * a slot (slots 1 through 5 or alternatively 0 through 4); this allows content-agnostic BI so that we can see how 
     * the recommended products in slot 1 perform compared to to slot 4 content on a page
     */
    sN?: string;
    /**
     * Based on Parent Name tag, lineage represents hirarchy of the content being ineracted with in the form of 
     * "element>parent>grandparent>...>rootelement"
     */
    lineage?: string;
    /**
     * ID (Product ID) of the product to which this content is related. It could be a game, music artist, movie, 
     * TV series, application, sweatshirt, etc.
     */
    productId?: string;
    /**
     * User specified custom content properties
     */
    [name: string]: string | number | boolean | string[] | number[] | boolean[] | object;
}

/**
 * Lineage interface
 */
export interface ILineage {
    /**
     * Lineage
     */
    lineage?: string;
    /**
     * lineageById
     */
    lineageById?: string;
    /**
     * lineageContainerName
     */
    lineageContainerName?: string;
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
    /**
     * Get all visible content 
     */
    getVisibleContent: () => Array<IContent>;
    
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