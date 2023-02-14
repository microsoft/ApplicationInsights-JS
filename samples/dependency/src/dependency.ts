
const containerId = "dependency-sample-container";
const dependencyListenerButtonId = "dependency-listener-button";
const dependencyListenerDetailsContainerId = "dependency-listener-detail-container";
const dependencyInitializerDetailsContainerId = "dependency-initializer-detail-container";
const stopDependencyEventButtonId = "stop-dependency-events";
const fetchCallId = "create-fetch-request";
const fetchXhrId = "create-xhr-request";
const untrackFetchRequestId = "create-untrack-fetch-request";
const removeAllHandlersId = "remove-all-handlers";
const buttonSectionId = "button-section";
const clearDetailsButtonId = "clear-all-details";
const addHandlersButtonId = "add-handlers";

let dependencyListenerHandler: any = null;
let dependencyInitializerHandler: any = null;
const dependencyListenerDetails: string[] = ["input","traceId","spanId","traceFlags","context"]; // check full details in console
const dependencyInitializerDetails: string[] = ["item","properties","sysProperties","context"]; // check full details in console

// This function is to get initialized appInsights instance.
// If you are using npm to initialize appInsights, please load appInsights here and remove snippet from index.html.
function getAppInsightsFromSnippet() {
    let appInsights = (window as any).appInsights;
    if (!appInsights) {
        console.error("appInsights is undefined");
        throw new Error("appInsights is not initialized");
    }
    return appInsights;
}

// This function is an example of using addDependencyListener to modify dependencyDetails
function addDependencyListener() {
    let appInsights = getAppInsightsFromSnippet();
    dependencyListenerHandler = appInsights.addDependencyListener((details: any) => {
        // Check console to view details
        console.log("The folloing event is passed to addDependencyListener");
        console.log(details);
        // Add additional context values (any) that can be used by other listeners and is also passed to any dependency initializers
        details.context.listener = "dependency-listener-context";
        details.traceFlags = 0;

        createDetailList(dependencyListenerDetails, details, dependencyListenerDetailsContainerId, "Listener");
    });
}

// This function is an example of using addDependencyInitializer to modify dependencyInitializerDetails
function addDependencyInitializer(){
    let appInsights = getAppInsightsFromSnippet();
    dependencyInitializerHandler = appInsights.addDependencyInitializer((details: any) => {
        // Check console to view details
        console.log("The folloing event is passed to addDependencyInitializer");
        console.log(details);
        // Events from https://api.npms.io/v2/search?q=angular&size=1 will not be reported
        if (details.item?.target  === "https://api.npms.io/v2/search?q=angular&size=1") {
            return false;
        }
        // Change properties of telemetry event "before" it's been processed
        details.item.name = "dependency-name";
        details.item.properties.url = details.item?.target;
        details.context.initializer = "dependency-initializer-context";

        createDetailList(dependencyInitializerDetails, details, dependencyInitializerDetailsContainerId, "Initializer");
    });
}

// This function is an example of using addDependencyInitializer to block any event from being reported
function stopDependencyEvent(){
    let appInsights = getAppInsightsFromSnippet();
    appInsights.addDependencyInitializer((details: any) => {
        // Check console to view details
        console.log("dependency event tracking is stopped, the following event will not be reported");
        console.log(details);
        // To stop any event from being reported
        return false;
    });
}

// This function is an example of removing addDependencyInitializer and addDependencyListener
function removeAllHandlers() {
    if (dependencyInitializerHandler) {
        // Remove the dependency initializer
        dependencyInitializerHandler.remove();
        console.log("dependencyInitializerHandler is removed");
    }

    if (dependencyListenerHandler) {
        // Remove the dependency Listener
        dependencyListenerHandler.remove();
        console.log("dependencyListenerHandler is removed");
    }
}

function createFetchRequest() {
    fetch("https://api.npms.io/v2/search?q=react&size=1").then(() =>{
        console.log("a fetch call triggered");
    });
}

function createXhrRequest() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.npms.io/v2/search?q=react&size=1");
    xhr.onload = function() {
        console.log("a xhr call triggered");
    };
    xhr.send();
}

function createUnTrackRequest() {
    fetch("https://api.npms.io/v2/search?q=angular&size=1").then(() =>{
        console.log("a untracked fetch call triggered");
    });
}

function clearDetailsList() {
    clearEle(dependencyListenerDetailsContainerId);
    clearEle(dependencyInitializerDetailsContainerId);
}

function clearEle(id: string) {
    let ele = document.getElementById(id);
    if (ele) {
        ele.innerHTML = "";
    }
}

function onAddHandlersClick() {
    addDependencyListener();
    addDependencyInitializer();
}

function createButtonSection() {
    let container = document.getElementById(buttonSectionId);
    let handlersBtn = createButton(addHandlersButtonId, onAddHandlersClick, dependencyListenerButtonId);
    let fetchButton = createButton(fetchCallId, createFetchRequest);
    let xhrButton = createButton(fetchXhrId, createXhrRequest);
    let untrackRequestButton = createButton(untrackFetchRequestId, createUnTrackRequest);
    let stopEventButton = createButton(stopDependencyEventButtonId, stopDependencyEvent);
    let removeHandlersButton = createButton(removeAllHandlersId, removeAllHandlers);
    let clearBtn = createButton(clearDetailsButtonId, clearDetailsList);
    let buttons = [handlersBtn, fetchButton, xhrButton, untrackRequestButton, stopEventButton, removeHandlersButton, clearBtn];
    buttons.forEach(ele => {
        container?.appendChild(ele);
    });
}

function createDetailList(propsToWatch: string[], details: any, id: string, title: string) {
    let container = document.getElementById(id);
    let ele = document.createElement("div");
    ele.className = "list";
    let date = new Date();
    let list = "";
    if (details) {
        list += `
            <h6>Dependency ${title} Details After Modifications</h6>
            <div>Check console for details before modifications and network trace for complete details</div>
            <div class="time">Date: ${date}</div>
        `;

        propsToWatch.forEach((prop) => {
            
            let obj = (details[prop] === undefined)?  "undefined" : details[prop];
            if (prop === "item") {
                obj = {name: obj.name, target: obj.target};
            }
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

function createContainers() {
    let container = document.createElement("div");
    container.className = "container";
    container.id = containerId;
    let buttonSection = createSubContainer(buttonSectionId, "container");
    container.appendChild(buttonSection);
    let ListenerSection = createSubContainer(dependencyListenerDetailsContainerId);
    container.appendChild(ListenerSection);
    let initializerSection = createSubContainer(dependencyInitializerDetailsContainerId);
    container.appendChild(initializerSection);
    document.body.appendChild(container);
}

function createSubContainer(id: string, className?: string) {
    let ele = document.createElement("div");
    ele.className =  className || "container-main";
    ele.id = id;
    return ele
}

function createButton(buttonTextContent: string, buttonOnclickFn: any, id?: string): HTMLButtonElement {
    let btn = document.createElement("button");
    if (id) {
        btn.id = id;
    }
    btn.innerHTML = buttonTextContent
    btn.onclick = buttonOnclickFn;
    return btn;
}

function dependencySample() {
    getAppInsightsFromSnippet();
    createContainers();
    createButtonSection();
}
dependencySample();







