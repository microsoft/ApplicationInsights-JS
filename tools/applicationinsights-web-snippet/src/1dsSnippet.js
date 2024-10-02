(function (win, doc, snipConfig) {
    var UInt32Mask = 0x100000000;    
    var locn = win.location;
    var helpLink = "https://go.microsoft.com/fwlink/?linkid=2128109";
    var scriptText = "script";
    var strEmpty = "";
    var strUndefined = "undefined";
    var strCrossOrigin = "crossOrigin";
    var strPostMethod = "POST";
    var sdkInstanceName = "onedsSDK";           // required for Initialization to find the current instance
    var aiName = snipConfig.name || "oneDSWeb"; // provide non default instance name through snipConfig name value
    var _sequence = 0;
    var _epoch = 0;
    if (snipConfig.name || win[sdkInstanceName]) {
        // Only set if supplied or another name is defined to avoid polluting the global namespace
        win[sdkInstanceName] = aiName;
    }
    var aiSdk = win[aiName] || (function (aiConfig, aiExtensions) {
        var loadFailed = false;
        var handled = false;
        var appInsights = {
            queue: [],
            sv: "4",       // Track the actual snippet version for reporting.
            config: aiConfig,
            extensions: aiExtensions,
        };

        if (!aiConfig.webAnalyticsConfiguration) {
            aiConfig.webAnalyticsConfiguration = {};
        }

        var strSnippetVersion = "1DS-Web-Snippet-" + appInsights.sv;

        function _parseConnectionString() {
            var endpointUrl = aiConfig.endpointUrl || "https://browser.events.data.microsoft.com/OneCollector/1.0/";
            var iKey = aiConfig["instrumentationKey"] || "";
            var channelConfig = aiConfig.channelConfiguration;
            if (channelConfig) {
                endpointUrl = channelConfig.overrideEndpointUrl || endpointUrl;
                iKey = channelConfig["overrideInstrumentationKey"] || iKey;
            }

            var dt = Date;
            var now;
            if (dt.now) {
                now = dt.now();
            } else {
                now = new dt().getTime();
            }

            return {
                url: endpointUrl + "?cors=true&content-type=application/x-json-stream&client-id=NO_AUTH&client-version=" + strSnippetVersion + "&apikey=" + iKey + "&w=0&upload-time=" + now.toString(),
                iKey: iKey
            };
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
            if (!snipConfig.disableReport) {
                var connection = _parseConnectionString();
                var endpointUrl = connection.url;
                var iKey = connection.iKey || strEmpty;
    
                var message = "SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)";
                var evts = [];
                evts.push(_createException(iKey, message, targetSrc, endpointUrl));
    
                _sendEvents(evts, endpointUrl);
            }
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

        function _addTimeZone(envelope) {
            // Add time zone
            var timeZone = new Date().getTimezoneOffset();
            var minutes = timeZone % 60;
            var hours = (timeZone - minutes) / 60;
            var timeZonePrefix = "+";
            if (hours > 0) {
                timeZonePrefix = "-";
            }
            hours = Math.abs(hours);
            minutes = Math.abs(minutes);

            envelope.ext.loc = {  // Add time zone
                tz: timeZonePrefix + (hours < 10 ? "0" + hours : hours.toString()) + ":" + (minutes < 10 ? "0" + minutes : minutes.toString())
            };
        }

        function _getTenantId(apiKey) {
            var result = "";

            if (apiKey) {
                var indexTenantId = apiKey.indexOf("-");
                if (indexTenantId > -1) {
                    result = apiKey.substring(0, indexTenantId);
                }
            }
            return result;
        }

        function _addUser(envelope) {
            // Add user language
            if (typeof navigator !== strUndefined) {
                var nav = navigator;
                envelope.ext.user = {
                    locale: nav.userLanguage || nav.language
                }
            }
        }

        function _createEnvelope(iKey, theType) {
            if (_epoch === 0) {
                _epoch = Math.floor((UInt32Mask * Math.random()) | 0) >>> 0;
            }

            var envelope = {
                data: {
                    baseData: {
                        ver: 2
                    }
                },
                ext: {
                    app: { sesId: "0000" },
                    intweb: {},
                    sdk: {
                        ver: "javascript:" + strSnippetVersion,
                        epoch: "" + _epoch,
                        seq: _sequence++,
                    },
                    utc: {
                        popSample: 100
                    },
                    web: {
                        userConsent: false
                    }
                },
                time: _getTime(),
                iKey: "o:" + _getTenantId(iKey),
                name: theType,
                ver: "4.0"
            };

            _addTimeZone(envelope);
            _addUser(envelope);

            return envelope;
        }

        function _createException(iKey, message, targetSrc, endpointUrl) {
            var envelope = _createEnvelope(iKey, "Ms.Web.ClientError");
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
    
        // Assigning these to local variables allows them to be minified to save space:
        var targetSrc = aiConfig.url || snipConfig.src;
        if (targetSrc) {
            function _handleError(evt) {
                loadFailed = true;
                appInsights.queue = []; // Clear the queue
                if (!handled) {
                    handled = true;
                    _reportFailure(targetSrc);
                }
            }

            function _handleLoad(evt, isAbort) {
                if (!handled) {
                    // IE10, Opera calls loaded before the script is processed.
                    // so delaying to give the script a chance to be processed
                    setTimeout(function() {
                        if (isAbort || typeof appInsights.isInitialized !== "function" || !appInsights.isInitialized()) {
                            _handleError();
                        }
                    }, 500);
                }
            }

            function _createScript() {
                var scriptElement = doc.createElement(scriptText);
                scriptElement.src = targetSrc;

                // Allocate Cross origin only if defined and available
                var crossOrigin = snipConfig[strCrossOrigin];
                if ((crossOrigin || crossOrigin === "") && scriptElement[strCrossOrigin] != strUndefined) {
                    scriptElement[strCrossOrigin] = crossOrigin;
                }
            
                scriptElement.onload = _handleLoad;
                scriptElement.onerror = _handleError;

                // Some browsers support onload while others onreadystatechange and others both
                scriptElement.onreadystatechange = function (evt, isAbort) {
                    if (scriptElement.readyState === "loaded" || scriptElement.readyState === "complete") {
                        _handleLoad(evt, isAbort);
                    }
                };                

                return scriptElement;
            }

            var theScript = _createScript();
            if (snipConfig.ld < 0) {
                // if user wants to append tag to document head, blocking page load
                var headNode = doc.getElementsByTagName("head")[0];
                headNode.appendChild(theScript);
            } else {
                setTimeout(function () {
                    // Attempts to place the script tag in the same location as the first script on the page
                    doc.getElementsByTagName(scriptText)[0].parentNode.appendChild(theScript);
                }, snipConfig.ld || 0);
            }
        }

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
        var trackPage = "trackPage";
        var capturePage = "capturePage";
        _createMethods([
            track,
            trackPage + "View", 
            track + "Exception",
            track + "Event",
            trackPage + "Action", 
            track + "ContentUpdate", 
            trackPage + "Unload", 
            trackPage + "ViewPerformance",
            "addTelemetryInitializer", 
            capturePage + "View",
            capturePage + "ViewPerformance",
            capturePage + "Action",
            capturePage + "Unload",
            "captureContentUpdate"
        ]);

        // Collect global errors
        var autoCapture = aiConfig.webAnalyticsConfiguration.autoCapture;
        if (!autoCapture || autoCapture.jsError) {

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
                        error: error,
                        evt: win.event
                    });
                }
    
                return handled;
            };
            aiConfig.autoExceptionInstrumented = true;
        }
    
        return appInsights;
    })(snipConfig.cfg, snipConfig.ext || []);

    // global instance must be set in this order to mitigate issues in ie8 and lower
    win[aiName] = aiSdk;
    
    function _onInit() {
        if (snipConfig.onInit) {
            snipConfig.onInit(aiSdk);
        }
    }

    // if somebody calls the snippet twice, don't report page view again
    if (aiSdk.queue && aiSdk.queue.length === 0) {
        aiSdk.queue.push(_onInit);
        //aiSdk.trackPageView({});
    } else {
        // Already loaded so just call the onInit
        _onInit();
    }
})(window, document, {
    src: "https://js.monitor.azure.com/scripts/c/ms.analytics-web-3.gbl.min.js",
    // name: "oneDSWeb", // Global SDK Instance name defaults to "oneDSWeb" when not supplied
    // ld: 0, // Defines the load delay (in ms) before attempting to load the sdk. -1 = block page load and add to head. (default) = 0ms load after timeout,
    // useXhr: 1, // Use XHR instead of fetch to report failures (if available),
    // crossOrigin: "anonymous", // When supplied this will add the provided value as the cross origin attribute on the script tag
    // disableReport: true, // Disable reporting when the SDK cannot be downloaded
    // onInit: null, // Once the application insights instance has loaded and initialized this callback function will be called with 1 argument -- the sdk instance (DO NOT ADD anything to the sdk.queue -- As they won't get called)
    cfg: { // One DS SDK Configuration
        instrumentationKey: "YOUR_TENANT_KEY",
        webAnalyticsConfiguration: {}
    },
    ext:[] // Extensions to initialize the sdk with
});