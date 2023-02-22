// install npm if you want to test on npm rather than snippet
// import { ApplicationInsights } from "@microsoft/applicationinsights-web";

const ai_session = "ai_session";
const ai_user = "ai_user";
const manual_event = "manual_record_event";
const containerId = "aisku-container";
const buttonSectionId = "button-section";
const detailsContainerId = "details-container";
const configContainerId = "config-details";

const cookieWatchList = ["isEnabled", ai_session, ai_user];
const detailsWatchList = ["baseType", "name", "time", "properties"];
const ajaxDetails: string[] = ["disabbleFetchTracking", "disableExceptionTracking", "enableAutoRouteTracking"];
const analyticsDetails: string[] = ["autoTrackPageVisitTime", "appId", "enableAjaxPerfTracking", "enableCorsCorrelation"];
const configDetails: string[] = ["connectionString", ...ajaxDetails, ...analyticsDetails];

// npm Initializtion
// const rootConfig = {
//     connectionString: "InstrumentationKey=YOUR_CONNECTION_STRING"
// }
// let appInsights = new ApplicationInsights({ config: rootConfig });
// appInsights.loadAppInsights();
// window.appInsights = appInsights;

// This function is to get initialized appInsights instance.
function getAppInsightsFromSnippet() {
    let appInsights = (window as any).appInsights;
    if (!appInsights) {
        console.error("appInsights is undefined");
        throw new Error("appInsights is not initialized");
    }
    return appInsights;
}

// This function is an example of using trackPageView to log pageviews
function createPageviewTracks() {
    let appInsights = getAppInsightsFromSnippet();

    // Default pageview event should be triggered automatically
    // Default pageview performance event should be triggered automatically
    
    // NOTE: For Single Page Applications (SPA), set enableAutoRouteTracking to true in confiurations to automatically send a new Pageview with each track route change.

    // Overwrite pageview properities
    let props = {
        name: "pageviewWithproperities", // Defaults to the document title
        uri: "https://pageview",
        refUri: "https://sample",
        pageType: "type",
        isLoggedIn: false,
        properties: {
            duration: 100, // pre-defined property
            prop: "prop",
            prop1: {prop1:"prop1"}
        },
        measurements: {
            metric: 1
        }
    };
    appInsights.trackPageView(props, {prop2: "prop2"});
}

// This function is an example of using trackEvent to log events
function createEventTracks() {
    let appInsights = getAppInsightsFromSnippet();

    let prop = {
        name: "eventWithproperities",
        properties: {
            prop: {prop1:"prop1"}
        },
        measurements: {
            metirc: 1
        }
    };
    appInsights.trackEvent(prop, {prop2: "prop2"});
}

// This function is an example of using startTrackEvent to start timing an event with given name
function startEvent() {
    let appInsights = getAppInsightsFromSnippet();
    appInsights.startTrackEvent(manual_event);
}

// This function is an example of using stopTrackEvent to stop timing an event with given name
function stopEvent() {
    let appInsights = getAppInsightsFromSnippet();
    
    // Duration should be provided automatically
    appInsights.stopTrackEvent(manual_event, {prop:"prop"}, {metric: 1});
}

// This function is an example of using trackTrace to log traces
// Typically used to send regular reports of performance indicators
function createTraceTracks() {
    let appInsights = getAppInsightsFromSnippet();

    let prop = {
        message: "trace",
        SeverityLevel: 1,
        properties: {
            prop: {prop1:"prop1"}
        },
        measurements: {
            metirc: 1
        }
    };
    appInsights.trackTrace(prop, {prop2: "prop2"});
}

// This function is an example of using trackMetric to log Metric
function createMetricTracks() {
    let appInsights = getAppInsightsFromSnippet();

    let prop = {
        name: "metric",
        average: 1.2,
        //default to 1
        sampleCount: 2,
        //default to average
        min: 1,
        //default to average
        max: 2,
        // default to 0
        stdDev: 1.23,
        properties: {
            prop: {prop1:"prop1"}
        },
        measurements: {
            metirc: 1
        }
    };
    appInsights.trackMetric(prop);
}

function triggerException() {

    // This will trigger exception telemetry automatically
    throw new Error("error is triggered");
}

// This function is an example of using  getCookieMgr to manage cookies
function getCookieMgrdetails() {
    let appInsights = getAppInsightsFromSnippet();
    if(appInsights) {
        // Use cookieMgr to del, get, purge, set cookies
        let cookieMgr = appInsights.getCookieMgr();

        let details =  {
            isEnabled: cookieMgr.isEnabled(),
            ai_session: cookieMgr.get(ai_session),
            ai_user: cookieMgr.get(ai_user)
        } as any;
        createDetailList(cookieWatchList, details, detailsContainerId, "Cookie");
    }
}

function addTelemetryListener() {
    let appInsights = getAppInsightsFromSnippet();
    if (appInsights) {
        
        appInsights.addTelemetryInitializer((env: any) =>{
            console.log("The following Event is triggered.");
            console.log(env);

            createDetailList(detailsWatchList, env, detailsContainerId, "Telemetry");
        })
    }
}

function getConfig() {
    let appInsights = getAppInsightsFromSnippet();
    let config = appInsights["config"];
    console.log("current config");
    console.log(config);
    return config;
}

function changeConfig() {
    let appInsights = getAppInsightsFromSnippet();
    let newConfig = generateNewConfig();
    appInsights["config"] = newConfig;
    createConfigDetails();
}

function generateNewConfig() {
    let prefix = Math.random().toString(36).slice(6);

    let newConfig: any = {
        connectionString: `InstrumentationKey=newKey${prefix}`,
        extensionConfig: {
            ApplicationInsightsAnalytics: {
                autoTrackPageVisitTime: randomBoolean(),
                appId: Math.random().toString(36).slice(8),
                enableAjaxPerfTracking:  randomBoolean(),
                enableCorsCorrelation: randomBoolean()
            },
            AjaxDependencyPlugin: {
                disabbleFetchTracking: randomBoolean(), // this will block fetch tracking
                disableExceptionTracking: randomBoolean(),
                enableAutoRouteTracking: randomBoolean()
            }
        }
    }
    return newConfig;
}

function randomBoolean() {
    if (Math.random() > 0.5) {
        return true;
    }
    return false;
}

function createConfigDetails() {
    let config = getConfig();
    clearEle(configContainerId);
    createDetailList(configDetails, config, configContainerId, "Config");
}

function clearDetailsList() {
    clearEle(detailsContainerId);
}

function clearEle(id: string) {
    let ele = document.getElementById(id);
    if (ele) {
        ele.innerHTML = "";
    }
}

function createDetailList(propsToWatch: string[], details: any, id: string, title: string) {
    let container = document.getElementById(id);
    let ele = document.createElement("div");
    ele.className = "list";
    let list = "";
    if (details) {
        list += `
            <h6>${title} Details</h6>
            <p>Not all auto-captured events and details are displayed here.</p>
            <p>Check console and network trace for complete details</p>
        `;

        propsToWatch.forEach((prop) => {
            let obj;
            
            if (details["baseData"]) {
                obj =  details["baseData"][prop] || details[prop] || details["baseData"];
            } else {
                obj =  details[prop] || details["baseData"];
            }

            if (analyticsDetails.includes(prop)) {
                obj = details["extensionConfig"]["ApplicationInsightsAnalytics"][prop];
            }
            if (ajaxDetails.includes(prop)) {
                obj = details["extensionConfig"]["AjaxDependencyPlugin"][prop];
            }
            if (prop === "item") {
                obj = {name: obj.name, target: obj.target};
            }

            obj = (obj === undefined)?  "undefined" : obj;
            
            if (typeof obj === "object") {
                obj = JSON.stringify(obj);
            }
            list += `<li>${prop}: ${obj}</li>`;
        });
        list += "<div>-------------------------</div>";
        ele.innerHTML = list;
        container?.appendChild(ele);
    }
}

function createButtonSection() {
    let container = document.getElementById(buttonSectionId);
    let changeConfigBtn = createButton("Change Config", changeConfig);
    let pageviewButton = createButton("Create Pageview", createPageviewTracks);
    let eventButton = createButton("Create Event", createEventTracks);
    let startButton = createButton("Start Tracking Event", startEvent);
    let stopButton = createButton("Stop Tracking Event", stopEvent);
    let traceButton = createButton("Create Trace", createTraceTracks);
    let metricButton = createButton("Create Metric", createMetricTracks);
    let exceptionButton = createButton("Create Exception", triggerException);
    let cookieButton = createButton("Get Cookie", getCookieMgrdetails);
    let clearButton = createButton("Clear Details", clearDetailsList);
    let buttons = [changeConfigBtn, pageviewButton, eventButton, traceButton, metricButton, startButton, stopButton, exceptionButton, cookieButton, clearButton];
    buttons.forEach(ele => {
        container?.appendChild(ele);
    });
}

function createContainers() {
    let container = document.createElement("div");
    container.className = "container";
    container.id = containerId;
    let buttonSection = createSubContainer(buttonSectionId, "container");
    container.appendChild(buttonSection);
    let configSection = createSubContainer(configContainerId);
    container.appendChild(configSection);
    let detailsSection = createSubContainer(detailsContainerId);
    container.appendChild(detailsSection);
    document.body.append(container);
}

function createSubContainer(id: string, className?: string) {
    let ele = document.createElement("div");
    ele.className =  className || "container-main";
    ele.id = id;
    return ele;
}

function createButton(buttontextContent: string, buttobuttononclickFn: any, id?: string): HTMLButtonElement {
    let btn = document.createElement("button");
    if (id) {
        btn.id = id;
    }
    btn.innerHTML = buttontextContent;
    btn.onclick = buttobuttononclickFn;
    return btn;
}

function analyticsSample() {
    createContainers();
    addTelemetryListener();
    createButtonSection();
    createConfigDetails();
}
analyticsSample();
