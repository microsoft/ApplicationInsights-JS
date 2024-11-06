/* eslint-disable no-constant-condition */
import { Fields, ISnippetConfig } from "./type";
import { IConfig, IEnvelope } from "@microsoft/applicationinsights-common";
import { IConfiguration, Snippet } from "@microsoft/applicationinsights-web";
import { oneDsEnvelope } from "./1dsType";
import { _createAiEnvelope, aiMethod } from "./aiSupport";
import { _createOneDsEnvelope, oneDsMethods } from "./1dsSupport";
// To ensure that SnippetConfig resides at the bottom of snippet.min.js,
// cfg needs to be declared globally at the top without being assigned values.
// This allows us to later assign cfg into the function at the bottom.
// We achieve this by using the expandMin function in gruntfile,
// which will forcefully overwrite the min file.
declare var cfg:ISnippetConfig;

(function (win: Window, doc: Document) {
    let isOneDS = false;  // place holder, will be removed during runtime
    let UInt32Mask = 0x100000000;
    let locn: Location = win.location;
    let helpLink = "https://go.microsoft.com/fwlink/?linkid=2128109";
    let scriptText = "script";
    let strInstrumentationKey = "instrumentationKey";
    let strIngestionendpoint = "ingestionendpoint";
    let strDisableExceptionTracking = "disableExceptionTracking";
    let strToLowerCase = "toLowerCase";
    let strConStringIKey = strInstrumentationKey[strToLowerCase]();
    let strEmpty = "";
    let strUndefined = "undefined";
    let strCrossOrigin = "crossOrigin";
    let strJsonResponseError = "Error Loading JSON response";

    let strPostMethod = "POST";
    let strGetMethod = "GET";
    let policyName = cfg.pn || "aiPolicy";
    let _sequence = 0;
    let _epoch = 0;
    let sdkInstanceName:string;
    let aiName:string;

    if (cfg.name || win[sdkInstanceName]) {
        // Only set if supplied or another name is defined to avoid polluting the global namespace
        win[sdkInstanceName] = aiName;
    }
    let aiSdk = win[aiName] || (function (aiConfig: IConfiguration & IConfig , aiExtensions?: any) {
        let targetSrc : string = (aiConfig as any)["url"] || cfg.src;
        if (isOneDS){
            sdkInstanceName = "onedsSDK";
            aiName = cfg.name || "oneDSWeb";  // provide non default instance name through snipConfig name value
        } else {
            sdkInstanceName = "appInsightsSDK";
            aiName = cfg.name || "appInsights";
        }
      
        let loadFailed = false;
        let handled = false;
        let appInsights: (Snippet & {cookie?:any, core?:any, extensions?:any, initialize?: boolean, isInitialized?: () => boolean;}) = null;
        appInsights= {
            queue: [],
            sv: "8",       // Track the actual snippet version for reporting.
            config: aiConfig,
            extensions: aiExtensions,
            initialize: true   // initialize sdk on download
        };

        if (isOneDS && !aiConfig["webAnalyticsConfiguration"]){
            aiConfig["webAnalyticsConfiguration"] = {};
        }
    
        function isIE() {
            let nav = navigator;
            if (nav) {
                let userAgent = (nav.userAgent || "").toLowerCase();
                return (userAgent.indexOf("msie") !== -1 || userAgent.indexOf("trident/") !== -1);
            }
            return false;
        }
       
        function _parseConnectionString() {
            let fields:Fields = {};
            let connectionString = aiConfig.connectionString;
            if (typeof connectionString === "string" && connectionString) {
                let kvPairs = connectionString.split(";");
                for (let lp = 0; lp < kvPairs.length; lp++) {
                    let kvParts = kvPairs[lp].split("=");
                    if (kvParts.length === 2) { // only save fields with valid formats
                        fields[kvParts[0][strToLowerCase]()] = kvParts[1];
                    }
                }
            }

            // apply the default endpoints
            if (!fields[strIngestionendpoint]) {
                // use endpoint suffix where overrides are not provided
                let endpointSuffix = fields.endpointsuffix;
                // Only fetch the location if a suffix was supplied
                let fLocation = endpointSuffix ? fields.location : null;
                fields[strIngestionendpoint] = "https://" + (fLocation ? fLocation + "." : strEmpty) + "dc." + (endpointSuffix || "services.visualstudio.com");
            }
            return fields;
        }

        function _sendEvents(evts:(IEnvelope | oneDsEnvelope)[], endpointUrl?:any) {
            if (JSON) {
                let sender = win.fetch;
                if (sender && !cfg.useXhr) {
                    sender(endpointUrl, { method:strPostMethod, body: JSON.stringify(evts), mode:"cors"});
                } else if (XMLHttpRequest) {
                    // IE doesn't support fetch and private clouds may only be using IE
                    let xhr = new XMLHttpRequest();
                    xhr.open(strPostMethod, endpointUrl);
                    xhr.setRequestHeader("Content-type", "application/json");
                    xhr.send(JSON.stringify(evts));
                }
            }
        }

        function _reportFailure(targetSrc:string) {
            if(cfg.dle === true) {
                return;
            }
            let iKey;
            let endpointUrl;
            if (isOneDS){
                endpointUrl = aiConfig.endpointUrl || "https://browser.events.data.microsoft.com/OneCollector/1.0/";
                iKey = aiConfig["instrumentationKey"] || "";
                let channelConfig = aiConfig["channelConfiguration"];
                if (channelConfig) {
                    endpointUrl = channelConfig.overrideEndpointUrl || endpointUrl;
                    iKey = channelConfig["overrideInstrumentationKey"] || iKey;
                }
                let dt = Date;
                let now;
                if (dt.now) {
                    now = dt.now();
                } else {
                    now = new dt().getTime();
                }
                endpointUrl = endpointUrl + "?cors=true&content-type=application/x-json-stream&client-id=NO_AUTH&client-version=" + appInsights.sv + "&apikey=" + iKey + "&w=0&upload-time=" + now.toString();
            } else {
                let conString = _parseConnectionString();
                iKey = conString[strConStringIKey] || aiConfig[strInstrumentationKey] || strEmpty;
                let ingest = conString[strIngestionendpoint];
                if (ingest && ingest.slice(-1) === "/"){
                    ingest = ingest.slice(0,-1);
                }
                endpointUrl = ingest ? ingest + "/v2/track" : aiConfig.endpointUrl; // only add /v2/track when from connectionstring
                endpointUrl = aiConfig.userOverrideEndpointUrl ? aiConfig.userOverrideEndpointUrl : endpointUrl;
            }
           

            let message = "SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)";
            let evts: (IEnvelope | oneDsEnvelope)[] = [];
            evts.push(_createException(iKey, message, targetSrc, endpointUrl));
            if (!isOneDS){
                evts.push(_createInternal(iKey, message, targetSrc, endpointUrl));
            }

            _sendEvents(evts, endpointUrl);
        }

        function _createEnvelope(iKey:string, theType:string) {
            if (_epoch === 0) {
                _epoch = Math.floor((UInt32Mask * Math.random()) | 0) >>> 0;
            }
            if (isOneDS){
                return _createOneDsEnvelope(iKey, theType, _epoch, _sequence, appInsights.sv);
            } else {
                return _createAiEnvelope(iKey, theType, appInsights.sv, appInsights.version, locn);
            }
        }

        function _createInternal(iKey:string, message:string, targetSrc:string, endpointUrl:any) {
            let envelope : IEnvelope| oneDsEnvelope = _createEnvelope(iKey, "Message");
            let data = envelope.data;
            data.baseType = "MessageData";
            let baseData = data.baseData;

            baseData.message = "AI (Internal): 99 message:\"" + (message + " (" + targetSrc + ")").replace(/\"/g, strEmpty) + "\"";
            baseData.properties = {
                endpoint: endpointUrl
            };
            
            return envelope;
        }

        function _createException(iKey:string, message:string, targetSrc:string, endpointUrl:any) {
            let envelope : IEnvelope | oneDsEnvelope;
            if (isOneDS){
                envelope = _createEnvelope(iKey, "Ms.Web.ClientError");
            } else {
                envelope = _createEnvelope(iKey, "Exception");
            }
            let data = envelope.data;
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

        let domainRetryIndex = -1;
        let domainRetryCount = 0;
        let domains = [
            "js.monitor.azure.com",
            "js.cdn.applicationinsights.io",
            "js.cdn.monitor.azure.com",
            "js0.cdn.applicationinsights.io",
            "js0.cdn.monitor.azure.com",
            "js2.cdn.applicationinsights.io",
            "js2.cdn.monitor.azure.com",
            "az416426.vo.msecnd.net" // this domain is supported but not recommended
        ];

        const fallback = () => setScript(targetSrc, null);
        if (cfg.sri) {
            const match = targetSrc.match(/^((http[s]?:\/\/.*\/)\w+(\.\d+){1,5})\.(([\w]+\.){0,2}js)$/);
            if (match && match.length === 6) {
                const integrityUrl = `${match[1]}.integrity.json`;
                const targetType = `@${match[4]}`;
                const sender = window.fetch;
                const handleResponse = (json:any) => {
                    if (!json.ext || !json.ext[targetType] || !json.ext[targetType].file) {
                        throw new Error(strJsonResponseError);
                    }
                    const integrity = json.ext[targetType].integrity || null;
                    targetSrc = match[2] + json.ext[targetType].file;
                    setScript(targetSrc, integrity);
                };
        
                if (sender && !cfg.useXhr) {
                    sender(integrityUrl, { method: strGetMethod, mode: "cors" })
                        .then(response => response.json().catch(() => ({})))
                        .then(handleResponse)
                        .catch(fallback);
                } else if (XMLHttpRequest) {
                    const xhr = new XMLHttpRequest();
                    xhr.open(strGetMethod, integrityUrl);
                    xhr.onreadystatechange = () => {
                        if (xhr.readyState === XMLHttpRequest.DONE) {
                            if (xhr.status === 200) {
                                try {
                                    handleResponse(JSON.parse(xhr.responseText));
                                } catch {
                                    fallback();
                                }
                            } else {
                                fallback();
                            }
                        }
                    };
                    xhr.send();
                }
            } else if (targetSrc) {
                fallback(); // Fallback to original behavior
            }
        } else if (targetSrc) {
            fallback(); // Fallback to original behavior
        }
        


        function setScript(targetSrc: string, integrity: string | null) {
            if (isIE() && targetSrc.indexOf("ai.3") !== -1) {
                // This regex matches any URL which contains "\ai.3." but not any full versions like "\ai.3.1" etc
                targetSrc = targetSrc.replace(/(\/)(ai\.3\.)([^\d]*)$/, function(_all, g1, g2) {
                    return g1 + "ai.2" + g2;
                });
                // let message = "Load Version 2 SDK instead to support IE"; // where to report this error?
            }

            if (cfg.cr !== false){
                for (var i = 0; i < domains.length; i++){
                    if (targetSrc.indexOf(domains[i]) > 0){
                        domainRetryIndex = i;
                        break;
                    }
                }
            }

            const _handleError = (evt?: any) => {
                appInsights.queue = []; // Clear the queue
                if (!handled) {
                    // start retry
                    if (domainRetryIndex >= 0 && domainRetryCount + 1 < domains.length){ // domainRetryIndex will be negative when client using own domain (the supported domain list is defined above)
                        let nextIdx = (domainRetryIndex + domainRetryCount + 1) % domains.length;
                        _createScript(targetSrc.replace(/^(.*\/\/)([\w\.]*)(\/.*)$/, function (_all, http, domain, qs) {
                            return http + domains[nextIdx] + qs;
                        }));
                        domainRetryCount += 1;
                    } else {
                        handled = true;
                        loadFailed = true;
                        _reportFailure(targetSrc);
                    }
                }
            }

            const _handleLoad = (evt?: any, isAbort?:any) => {
                if (!handled) {
                    // IE10, Opera calls loaded before the script is processed.
                    // so delaying to give the script a chance to be processed
                    setTimeout(function() {
                        if (isAbort){
                            if (isOneDS){
                                if (typeof appInsights.isInitialized !== "function" || !appInsights.isInitialized()){
                                    _handleError();
                                }
                            } else {
                                if (!appInsights.core){
                                    _handleError();
                                }
                            }
                        }
                       
                    }, 500);
                }
                loadFailed = false;
            }

            function create_policy() {
                // Function to handle URL validation
                function validateURL(urlString: string): string | null {
                    try {
                        const url = new URL(urlString);
                        if (url.host && url.host === "js.monitor.azure.com") {
                            return urlString;
                        } else {
                            handleInvalidURL(urlString);
                        }
                    } catch {
                        handleInvalidURL(urlString);
                    }
                }
            
                // Function to handle reporting failures
                function handleInvalidURL(urlString: string) {
                    _reportFailure("AI policy blocked URL: " + urlString);
                }
            
                return (window as any).trustedTypes?.createPolicy(policyName, {
                    createScriptURL: validateURL
                });
            }
            
           
            const _createScript = (src: string) => {
                let scriptElement : HTMLElement = doc.createElement(scriptText);
                if (cfg.pl){
                    if (cfg.ttp && cfg.ttp.createScript) {
                        (scriptElement as any)["src"] = cfg.ttp.createScriptURL(src);
                    } else {
                        (scriptElement as any)["src"] = create_policy().createScriptURL(src);
                    }
                } else {
                    (scriptElement as any)["src"] = src;
                }
                
                if (cfg.nt) {
                    (scriptElement as any).setAttribute("nonce", cfg.nt);
                }
               
                if (integrity){
                    // Set the integrity attribute to the script tag if integrity is provided
                    (scriptElement as any).integrity = integrity;
                }
                (scriptElement as any).setAttribute("data-ai-name", aiName);
                // Allocate Cross origin only if defined and available
                let crossOrigin = cfg[strCrossOrigin];
                if ((crossOrigin || crossOrigin === "") && scriptElement[strCrossOrigin] != strUndefined) {
                    scriptElement[strCrossOrigin] = crossOrigin;
                }
                scriptElement.onload = _handleLoad;
                scriptElement.onerror = _handleError;
                // Some browsers support onload while others onreadystatechange and others both
                (scriptElement as any)["onreadystatechange"] = function (evt?:any, isAbort?:any) {
                    if ((scriptElement as any)["readyState"] === "loaded" || (scriptElement as any)["readyState"]  === "complete") {
                        _handleLoad(evt, isAbort);
                    }
                };

                if (cfg.ld && cfg.ld < 0) {
                    // if user wants to append tag to document head, blocking page load
                    let headNode = doc.getElementsByTagName("head")[0];
                    headNode.appendChild(scriptElement);
                } else {
                    setTimeout(function () {
                        // Attempts to place the script tag in the same location as the first script on the page
                        doc.getElementsByTagName(scriptText)[0].parentNode.appendChild(scriptElement);
                    }, cfg.ld || 0);
                }


                return scriptElement;
            }
            _createScript(targetSrc);
        }
    
        // capture initial cookie
        try {
            appInsights.cookie = doc.cookie;
        } catch (e) {
            // eslint-disable-next-line no-empty
        }
    
        function _createMethods(methods:any[]) {
            while (methods.length) {
                (function (name) {
                    // Define a temporary method that queues-up a the real method call
                    appInsights[name] = function () {
                        // Capture the original arguments passed to the method
                        let originalArguments = arguments;
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
        
        if (isOneDS){
            _createMethods(oneDsMethods);
        } else {
            _createMethods(aiMethod);
        }

        // expose SeverityLevel enum
        appInsights["SeverityLevel"] = {
            Verbose : 0,
            Information : 1,
            Warning : 2,
            Error : 3,
            Critical : 4
        };
        // Collect global errors
        let globalErrorCollect = false;
        if (isOneDS){
            let autoCapture = aiConfig["webAnalyticsConfiguration"]["autoCapture"];
            if (!autoCapture || autoCapture.jsError) {
                globalErrorCollect = true;
            }
        } else {
        // Note: ApplicationInsightsAnalytics is the extension string identifier for
        //  AppAnalytics. It is defined in ApplicationInsights.ts:ApplicationInsights.identifer
            let analyticsCfg = ((aiConfig.extensionConfig || {}).ApplicationInsightsAnalytics ||{});
            if (!(aiConfig[strDisableExceptionTracking] === true || analyticsCfg[strDisableExceptionTracking] === true)) {
                globalErrorCollect = true;
            }
        }

        if (globalErrorCollect){
            let method = "onerror";
            _createMethods(["_" + method]);
            let originalOnError = win[method];
            win[method] = function(message:string, url:string, lineNumber:Number, columnNumber:Number, error?:any) {
                let handled = originalOnError && originalOnError(message, url, lineNumber, columnNumber, error);
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
            aiConfig["autoExceptionInstrumented"] = true;
        }

        return appInsights;
    })(cfg.cfg);

    // global instance must be set in this order to mitigate issues in ie8 and lower
    win[aiName] = aiSdk;
    
    function _onInit() {
        if (cfg.onInit) {
            cfg.onInit(aiSdk);
        }
    }

    // if somebody calls the snippet twice, don't report page view again
    if (aiSdk.queue && aiSdk.queue.length === 0) {
        aiSdk.queue.push(_onInit);
        if (!isOneDS){
            aiSdk.trackPageView({});
        }
    } else {
        // Already loaded so just call the onInit
        _onInit();
    }
})(window, document);
