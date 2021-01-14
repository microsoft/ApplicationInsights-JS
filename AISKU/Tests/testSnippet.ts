

/**
 * DO NOT FIX BUGS WITH THE OBJECT RETURNED BY THIS HELPER
 * -------------------------------------------------------
 * YOU *SHOULD* CREATE A NEW VERSION FOR EACH SNIPPET VERSION UNLESS CHANGES ARE MINIMAL
 * -------------------------------------------------------
 * This is a helper that returns an object that is the same as the v5 snippet, if there is
 * an issue with the tests because of the object this returns there is probably a bug during 
 * initialization.
 */
export function createSnippetV5(snipConfig) {
    let win = window;
    let doc = document;

    var locn = win.location;
    var helpLink = "https://go.microsoft.com/fwlink/?linkid=2128109";
    var scriptText = "script";
    var strInstrumentationKey = "instrumentationKey";
    var strIngestionendpoint = "ingestionendpoint";
    var strDisableExceptionTracking = "disableExceptionTracking";
    var strAiDevice = "ai.device.";
    var strAiOperationName = "ai.operation.name";
    var strAiSdkVersion = "ai.internal.sdkVersion";
    var strToLowerCase = "toLowerCase";
    var strEmpty = "";
    var strUndefined = "undefined";
    var strCrossOrigin = "crossOrigin";

    var strPostMethod = "POST";
    var sdkInstanceName = "appInsightsSDK";         // required for Initialization to find the current instance
    var aiName = snipConfig.name || "appInsights";  // provide non default instance name through snipConfig name value
    if (snipConfig.name || win[sdkInstanceName]) {
        // Only set if supplied or another name is defined to avoid polluting the global namespace
        win[sdkInstanceName] = aiName;
    }
    var aiSdk = win[aiName] || (function (aiConfig) {
        var loadFailed = false;
        var handled = false;
        var appInsights: any = {
            initialize: true,   // initialize sdk on download
            queue: [],
            sv: "5",            // Track the actual snippet version for reporting.
            version: 2.0,       // initialization version, if this is not 2.0 the previous scripts fail to initialize
            config: aiConfig
        };
        function _parseConnectionString() {
            var fields: any = {};
            var connectionString = aiConfig.connectionString;
            if (connectionString) {
                var kvPairs = connectionString.split(";");
                for (var lp = 0; lp < kvPairs.length; lp++) {
                    var kvParts = kvPairs[lp].split("=");
    
                    if (kvParts.length === 2) { // only save fields with valid formats
                        fields[kvParts[0][strToLowerCase]()] = kvParts[1];
                    }
                }
            }

            // apply the default endpoints
            if (!fields[strIngestionendpoint]) {
                // use endpoint suffix where overrides are not provided
                var endpointSuffix = fields.endpointsuffix;
                // Only fetch the location if a suffix was supplied
                var fLocation = endpointSuffix ? fields.location : null;
                fields[strIngestionendpoint] = "https://" + (fLocation ? fLocation + "." : strEmpty) + "dc." + (endpointSuffix || "services.visualstudio.com");
            }

            return fields;
        }

        function _sendEvents(evts, endpointUrl) {
            if (JSON) {
                var sender = win.fetch;
                if (sender && !snipConfig.useXhr) {
                    sender(endpointUrl, { method:strPostMethod, body: JSON.stringify(evts), mode:"cors"});
                } else if (XMLHttpRequest) {
                    // IE doesn't support fetch and private clouds may only be using IE
                    var xhr = new XMLHttpRequest();
                    xhr.open(strPostMethod, endpointUrl);
                    xhr.setRequestHeader("Content-type", "application/json");
                    xhr.send(JSON.stringify(evts));
                }
            }
        }

        function _reportFailure(targetSrc) {
            var conString = _parseConnectionString();
            var iKey = conString[strInstrumentationKey] || aiConfig[strInstrumentationKey] || strEmpty;
            var ingest = conString[strIngestionendpoint];
            var endpointUrl = ingest ? ingest + "/v2/track" : aiConfig.endpointUrl; // only add /v2/track when from connectionstring

            var message = "SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)";
            var evts = [];
            evts.push(_createException(iKey, message, targetSrc, endpointUrl));
            evts.push(_createInternal(iKey, message, targetSrc, endpointUrl));

            _sendEvents(evts, endpointUrl);
        }

        // Gets the time as an ISO date format, using a function as IE7/8 doesn't support toISOString
        function _getTime() {
            var date = new Date();
            function pad(num) {
                var r = strEmpty + num;
                if (r.length === 1) {
                    r = "0" + r;
                }

                return r;
            }

            return date.getUTCFullYear()
                + "-" + pad(date.getUTCMonth() + 1)
                + "-" + pad(date.getUTCDate())
                + "T" + pad(date.getUTCHours())
                + ":" + pad(date.getUTCMinutes())
                + ":" + pad(date.getUTCSeconds())
                + "." + String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
                + "Z";            
        }

        function _createEnvelope(iKey, theType): any {
            var tags = {};
            var type = "Browser";
            tags[strAiDevice + "id"] = type[strToLowerCase]();
            tags[strAiDevice + "type"] = type;
            tags[strAiOperationName] = locn && locn.pathname || "_unknown_";
            tags[strAiSdkVersion] = "javascript:snippet_" + (appInsights.sv || appInsights.version);

            return {
                time: _getTime(),
                iKey: iKey,
                name: "Microsoft.ApplicationInsights." + iKey.replace(/-/g, strEmpty) + "." + theType,
                sampleRate: 100,
                tags: tags,
                data: {
                    baseData: {
                        ver: 2
                    }
                }
            };
        }

        function _createInternal(iKey, message, targetSrc, endpointUrl) {
            var envelope = _createEnvelope(iKey, "Message");
            var data = envelope.data;
            data.baseType = "MessageData";
            var baseData = data.baseData;
            baseData.message = "AI (Internal): 99 message:\"" + (message + " (" + targetSrc + ")").replace(/\"/g, strEmpty) + "\"";
            baseData.properties = {
                endpoint: endpointUrl
            };

            return envelope;
        }

        function _createException(iKey, message, targetSrc, endpointUrl) {
            var envelope = _createEnvelope(iKey, "Exception");
            var data = envelope.data;
            data.baseType = "ExceptionData";
            data.baseData.exceptions = [{
                typeName: "SDKLoadFailed",
                message: message.replace(/\./g, "-"),  // Replacing '.' characters as it causes the portal to hide the start of the message in the summary
                hasFullStack: false,
                stack: message + "\nSnippet failed to load [" + targetSrc + "] -- Telemetry is disabled\nHelp Link: " + helpLink + "\nHost: " + (locn && locn.pathname || "_unknown_") + "\nEndpoint: " + endpointUrl,
                parsedStack: []
            }];

            return envelope;
        }
    
        //     Commented out as we don't want to load from the CDN
        // -------------------------------------------------------------
        // Assigning these to local variables allows them to be minified to save space:
        // var targetSrc = aiConfig.url || snipConfig.src;
        // if (targetSrc) {
        //     function _handleError(evt) {
        //         loadFailed = true;
        //         appInsights.queue = []; // Clear the queue
        //         if (!handled) {
        //             handled = true;
        //             _reportFailure(targetSrc);
        //         }
        //     }

        //     function _handleLoad(evt, isAbort) {
        //         if (!handled) {
        //             // IE10, Opera calls loaded before the script is processed.
        //             // so delaying to give the script a chance to be processed
        //             setTimeout(function() {
        //                 if (isAbort || !appInsights.core) {
        //                     _handleError();
        //                 }
        //             }, 500);
        //         }
        //     }

        //     function _createScript() {
        //         var scriptElement = doc.createElement(scriptText);
        //         scriptElement.src = targetSrc;

        //         // Allocate Cross origin only if defined and available
        //         var crossOrigin = snipConfig[strCrossOrigin];
        //         if ((crossOrigin || crossOrigin === "") && scriptElement[strCrossOrigin] != strUndefined) {
        //             scriptElement[strCrossOrigin] = crossOrigin;
        //         }
            
        //         scriptElement.onload = _handleLoad;
        //         scriptElement.onerror = _handleError;

        //         // Some browsers support onload while others onreadystatechange and others both
        //         scriptElement.onreadystatechange = function (evt, isAbort) {
        //             if (scriptElement.readyState === "loaded" || scriptElement.readyState === "complete") {
        //                 _handleLoad(evt, isAbort);
        //             }
        //         };                

        //         return scriptElement;
        //     }

        //     var theScript = _createScript();
        //     if (snipConfig.ld < 0) {
        //         // if user wants to append tag to document head, blocking page load
        //         var headNode = doc.getElementsByTagName("head")[0];
        //         headNode.appendChild(theScript);
        //     } else {
        //         setTimeout(function () {
        //             // Attempts to place the script tag in the same location as the first script on the page
        //             doc.getElementsByTagName(scriptText)[0].parentNode.appendChild(theScript);
        //         }, snipConfig.ld || 0);
        //     }
        // }
    
        // capture initial cookie
        try {
            appInsights.cookie = doc.cookie;
        } catch (e) { }
    
        function _createMethods(methods) {
            while (methods.length) {
                (function (name) {
                    // Define a temporary method that queues-up a the real method call
                    appInsights[name] = function () {
                        // Capture the original arguments passed to the method
                        var originalArguments = arguments;
                        if (!loadFailed) { // If we have detected that the main script failed to load then stop queuing events that will never be processed
                            // Queue-up a call to the real method
                            appInsights.queue.push(function () {
                                // Invoke the real method with the captured original arguments
                                appInsights[name].apply(appInsights, originalArguments);
                            });
                        }
                    };
                })(methods.pop());
            }
        }

        var track = "track";
        var trackPage = "TrackPage";
        var trackEvent = "TrackEvent";
        _createMethods([track + "Event", 
            track + "PageView", 
            track + "Exception", 
            track + "Trace", 
            track + "DependencyData", 
            track + "Metric", 
            track + "PageViewPerformance",
            "start" + trackPage, 
            "stop" + trackPage,
            "start" + trackEvent, 
            "stop" + trackEvent,
            "addTelemetryInitializer", 
            "setAuthenticatedUserContext", 
            "clearAuthenticatedUserContext", 
            "flush"]);
    
        // expose SeverityLevel enum
        appInsights['SeverityLevel'] = {
            Verbose : 0,
            Information : 1,
            Warning : 2,
            Error : 3,
            Critical : 4
        };
    
        // Collect global errors
        // Note: ApplicationInsightsAnalytics is the extension string identifier for
        //  AppAnalytics. It is defined in ApplicationInsights.ts:ApplicationInsights.identifer
        var analyticsCfg = ((aiConfig.extensionConfig || {}).ApplicationInsightsAnalytics ||{});
        if (!(aiConfig[strDisableExceptionTracking] === true || analyticsCfg[strDisableExceptionTracking] === true)) {
            var method = "onerror";
            _createMethods(["_" + method]);
            var originalOnError = win[method];
            win[method] = function(message, url, lineNumber, columnNumber, error) {
                var handled = originalOnError && originalOnError(message, url, lineNumber, columnNumber, error);
                if (handled !== true) {
                    appInsights["_" + method]({
                        message: message,
                        url: url,
                        lineNumber: lineNumber,
                        columnNumber: columnNumber,
                        error: error
                    });
                }
    
                return handled;
            };
            aiConfig.autoExceptionInstrumented = true;
        }
    
        return appInsights;
    })(snipConfig.cfg);

    function _onInit() {
        if (snipConfig.onInit) {
            snipConfig.onInit(aiSdk);
        }
    }

    // if somebody calls the snippet twice, don't report page view again
    if (aiSdk.queue && aiSdk.queue.length === 0) {
        aiSdk.queue.push(_onInit);
        // aiSdk.trackPageView({});
    } else {
        // Already loaded so just call the onInit
        _onInit();
    }

    return aiSdk;
}