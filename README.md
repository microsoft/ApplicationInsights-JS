# Microsoft Application Insights JavaScript SDK

## API reference:

* Learn more: http://go.microsoft.com/fwlink/?LinkID=401493
* Full implementation: https://github.com/Microsoft/ApplicationInsights-JS/blob/master/JavaScript/JavaScriptSDK/appInsights.ts

        /**
         * Starts timing how long the user views a page or other item. Call this when the page opens. 
         * This method doesn't send any telemetry. Call {@link stopTrackTelemetry} to log the page when it closes.
         * @param   name  A string that idenfities this item, unique within this HTML document. Defaults to the document title.
         */
        public startTrackPage(name?: string)

        /**
         * Logs how long a page or other item was visible, after {@link startTrackPage}. Call this when the page closes. 
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        public stopTrackPage(name?: string, url?: string, properties?: Object, measurements?: Object)

        /**
         * Logs that a page or other item was viewed. 
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        public trackPageView(name?: string, url?: string, properties?: Object, measurements?: Object)

        /**
         * Start timing an extended event. Call {@link stopTrackEvent} to log the event when it ends.
         * @param   name    A string that identifies this event uniquely within the document.
         */
        public startTrackEvent(name: string)

        /** 
         * Log an extended event that you started timing with {@link startTrackEvent}.
         * @param   name    The string you used to identify this event in startTrackEvent.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        public stopTrackEvent(name: string, properties?: Object, measurements?: Object)

        /** 
         * Log a user action or other occurrence.
         * @param   name    A string to identify this event in the portal.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        public trackEvent(name: string, properties?: Object, measurements?: Object)

        /**
         * Log an exception you have caught.
         * @param   exception   An Error from a catch clause, or the string error message.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        public trackException(exception: Error, handledAt?: string, properties?: Object, measurements?: Object) 

        /**
         * Log a numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.
         * To send a single measurement, use just the first two parameters. If you take measurements very frequently, you can reduce the 
         * telemetry bandwidth by aggregating multiple measurements and sending the resulting average at intervals.
         * @param   name    A string that identifies the metric.
         * @param   average Number representing either a single measurement, or the average of several measurements.
         * @param   sampleCount The number of measurements represented by the average. Defaults to 1.
         * @param   min The smallest measurement in the sample. Defaults to the average.
         * @param   max The largest measurement in the sample. Defaults to the average.
         */
        public trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number)

        /**
        * Log a diagnostic message. 
        * @param    message A message string 
        * @param   properties  map[string, string] - additional data used to filter traces in the portal. Defaults to empty.
        */
        public trackTrace(message: string, properties?: Object)

        /**
         * Immediately send all queued telemetry.
         */
        public flush()



## To build:

* Visual Studio 2013 Ultimate with Update 4
* Clone the Git repository 
* Open Visual Studio solution (devenv JavaScript\Microsoft.ApplicationInsights.JavaScript.sln)
* Build solution in Visual Studio

## To run check-in tests
* `powershell "& .\RunTestsInBrowser.ps1"` to run `Tests.html` in a browser
* Don't forget to build the solution after changing TypeScript files
* Refresh Tests.html in the browser to re-run tests

## Performance testing results

For this release, we added a perfResults.txt.csv file that documents the history of performance measurements of the code in the master branch to share with the community the performance of the JavaScript SDK.

When running the performance tests locally, a similar file will be produced that could be used to measure the impact your new code would have on the project.
