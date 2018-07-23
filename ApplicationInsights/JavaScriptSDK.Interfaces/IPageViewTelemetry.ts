/**
 * Pageview telemetry interface
 */
export interface IPageViewTelemetry {
    /*
     * name The string you used as the name in startTrackPage. Defaults to the document title.
     */
    name: string;

    /*
     * url  String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     */
    url: string;

    /*
     * id  String - unique identifier for the page view
     */
    id: string;

    /*
     * referrerUri  String - source page where current page is loaded from
     */
    referrerUri?: string;

    /*
     * duration  number - the number of milliseconds it took to load the page. Defaults to undefined. If set to default value, page load time is calculated internally.
     */
    duration?: number;

    /*
     * property bag to contain an extension to domain properties - extension to Part B
     */
    pageTags?: { [key: string]: any };
}