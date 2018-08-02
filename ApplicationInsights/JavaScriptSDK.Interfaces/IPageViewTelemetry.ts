/**
 * Pageview telemetry interface
 */
export interface IPageViewTelemetry {
    /*
     * name String - The string you used as the name in startTrackPage. Defaults to the document title.
     */
    name?: string;

    /*
     * uri  String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     */
    uri?: string;

    /*
     * refUri  String - the URL of the source page where current page is loaded from
     */
    refUri?: string;

    /*
     * duration  number - the number of milliseconds it took to load the page. Defaults to undefined. If set to default value, page load time is calculated internally.
     */
    duration?: number;

    /*
     * pageType  String - page type
     */
    pageType?: string;

    /*
     * isLoggedIn - boolean is user logged in
     */
    isLoggedIn?: boolean;

    /*
     * property bag to contain an extension to domain properties - extension to Part B
     */
    pageTags?: { [key: string]: any };
}


export interface IPageViewTelemetryInternal extends IPageViewTelemetry {
    id?: string;
}