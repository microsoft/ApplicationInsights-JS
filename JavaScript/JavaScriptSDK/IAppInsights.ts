module Microsoft.ApplicationInsights {
    export interface IAppInsights {

        /**
        * Starts timing how long the user views a page or other item. Call this when the page opens. 
        * This method doesn't send any telemetry. Call {@link stopTrackTelemetry} to log the page when it closes.
        * @param   name  A string that idenfities this item, unique within this HTML document. Defaults to the document title.
        */
        startTrackPage(name?: string);

        /**
        * Logs how long a page or other item was visible, after {@link startTrackPage}. Call this when the page closes. 
        * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
        * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
        * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
        * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
        */
        stopTrackPage(name?: string, url?: string, properties?: Object, measurements?: Object);

        /**
         * Logs that a page or other item was viewed. 
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         * @param   duration    number - the number of milliseconds it took to load the page. Defaults to undefined. If set to default value, page load time is calculated internally.
         */
        trackPageView(name?: string, url?: string, properties?: Object, measurements?: Object, duration?: number);

        /**
         * Start timing an extended event. Call {@link stopTrackEvent} to log the event when it ends.
         * @param   name    A string that identifies this event uniquely within the document.
         */
        startTrackEvent(name: string);


        /** 
         * Log an extended event that you started timing with {@link startTrackEvent}.
         * @param   name    The string you used to identify this event in startTrackEvent.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        stopTrackEvent(name: string, properties?: Object, measurements?: Object);

        /** 
        * Log a user action or other occurrence.
        * @param   name    A string to identify this event in the portal.
        * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
        * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
        */
        trackEvent(name: string, properties?: Object, measurements?: Object);

        /**
        * Log an AJAX request
        * @param ....
        */
        trackAjax(id: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number, method?: string);
    }
}