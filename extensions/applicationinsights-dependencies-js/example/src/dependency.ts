const containerId = "dependency-sample-container";
const addDependencyListenerId = "add-dependency-listener";
const dependencyListenerButtonId = "dependency-listener-button";
const dependencyListenerDetailsId = "dependency-listener-detail";
const addDependencyInitializerId = "add-dependency-initializer";
const dependencyInitializerButtonId = "dependency-initializer-button";
const dependencyInitializerDetailId = "dependency-initializer-detail";
const stopDependencyEventButtonId = "stop-dependency-events";
const fetchCallId = "create-fetch-request";
const fetchXhrId = "create-xhr-request";
const untrackFetchRequestId = "create-untrack-fetch-request";
const removeAllHandlersId = "remove-all-handlers";

let dependencyListenerHandler: any = null;
let dependencyInitializerHandler: any = null;
const dependencyListenerDetails: string[] = ["xhr", "input","init","traceId","spanId","traceFlags","context"];
const dependencyInitializerDetails: string[] = ["item", "properties","sysProperties","context"];

function getAppInsightsFromSnippet() {
    return (window as any).appInsights || {};
}

// This function is an example of using addDependencyListener to modify dependencyDetails
function addDependencyListener() {
    let appInsights = getAppInsightsFromSnippet();
    dependencyListenerHandler = appInsights.addDependencyListener((details: any) => {
        // Check console to view details
        console.log(details);
        // Add additional context values (any) that can be used by other listeners and is also passed to any dependency initializers
        details.context.sample = "dependency-sample";

        createDetailList(dependencyListenerDetails, details, dependencyListenerDetailsId, addDependencyListenerId)
    });
}

// This function is an example of using addDependencyInitializer to modify dependencyInitializerDetails
function addDependencyInitializer(){
    let appInsights = getAppInsightsFromSnippet();
    dependencyInitializerHandler = appInsights.addDependencyInitializer((details: any) => {
        // Check console to view details
        console.log(details);
        if (details.item?.target  === "https://api.npms.io/v2/search?q=angular&size=1") {
            // Events from https://api.npms.io/v2/search?q=angular&size=1 will not be reported
            return false;
        }
        // Change properties of telemetry event "before" it's been processed
        details.item.name = "dependency-sample";
        details.properties = details.properties || {};
        details.properties.sample = "dependency-sample";
        details.sysProperties.sample = "dependency-sample";
        details.context.context = "dependency-context";

        createDetailList(dependencyInitializerDetails, details, dependencyInitializerDetailId, addDependencyInitializerId);
    });
}

function stopDependencyEvent(){
    let appInsights = getAppInsightsFromSnippet();
    appInsights.addDependencyInitializer((details: any) => {
        console.log("dependency event tracking is stopped");
        //To stop any event from being reported
        return false;
    });
}

function removeAllHandlers() {
    if (dependencyInitializerHandler) {
        // Remove the dependency initializer
        dependencyInitializerHandler.remove();
        console.log("dependencyInitializerHandler is removed");

        let dependencyInitializerNode = document.getElementById(addDependencyInitializerId);
        if (dependencyInitializerNode?.hasChildNodes()) {
            dependencyInitializerNode.childNodes[1].remove();
        }
    }
    if (dependencyListenerHandler) {
        // Remove the dependency Listener
        dependencyListenerHandler.remove();
        console.log("dependencyListenerHandler is removed");

        let dependencyListenerNode = document.getElementById(addDependencyListenerId);
        if (dependencyListenerNode?.hasChildNodes()) {
            dependencyListenerNode.childNodes[1].remove();
        }
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

function createDependencyInitializerComponent() {
    let container = document.createElement("div");
    container.className = "container-main";
    container.id = addDependencyInitializerId;
    let button = createButton(addDependencyInitializerId, addDependencyInitializer, dependencyInitializerButtonId);
    container.appendChild(button);
    document.body.appendChild(container);
    return container
}

function createDependencyListenerComponent() {
    let container = document.createElement("div");
    container.className = "container-main";
    container.id = addDependencyListenerId;
    let button = createButton(addDependencyListenerId, addDependencyListener, dependencyListenerButtonId);
    container.appendChild(button);
    document.body.appendChild(container);
    return container
}

function createCreateRequestComponent() {
    let container = document.createElement("div");
    container.className = "container-main";
    let fetchButton = createButton(fetchCallId, createFetchRequest);
    let xhrButton = createButton(fetchXhrId, createXhrRequest);
    let untrackRequestButton = createButton(untrackFetchRequestId, createUnTrackRequest)
    container.appendChild(fetchButton);
    container.appendChild(xhrButton);
    container.appendChild(untrackRequestButton);
    document.body.appendChild(container);
    return container
}

function createClearHandlerComponent() {
    let container = document.createElement("div");
    container.className = "container-main";
    let stopEventButton = createButton(stopDependencyEventButtonId, stopDependencyEvent);
    let removeHandlersButton = createButton(removeAllHandlersId, removeAllHandlers);
    container.appendChild(stopEventButton);
    container.appendChild(removeHandlersButton);
    document.body.appendChild(container);
    return container
}

function createDetailList(propsToWatch: string[], details: any, listId: string, parentId: string) {
    let container = document.getElementById(listId);
    if (!container) {
        container = document.createElement("div");
        container.id = listId;
    }
    let date = new Date();
    let list = "";
    if (details) {
        list += `<div>Date: ${date}</div>`;
        propsToWatch.forEach((prop) =>{
            let item = JSON.stringify(details[prop]);
            list += `<li>${prop}: ${item}</li>`;
        })
    }
    container.innerHTML = list;
    if (parentId) {
        let parentNode = document.getElementById(parentId);
        parentNode?.appendChild(container);
    }
    return container;
}

function createContainer(): HTMLDivElement {
    let container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
    return container;
}

function createButton(buttontextContent: string, buttobuttononclickFn: any, id?: string): HTMLButtonElement {
    let btn = document.createElement("button");
    if (id) {
        btn.id = id;
    }
    btn.innerHTML = buttontextContent
    btn.onclick = buttobuttononclickFn;
    return btn;
}

function createDescription() {
    let ele = document.createElement("div");
    let description = `
        <div class="container-main">
            <div>------------------------------------------------------------------------------------------------- </div>
            <h6> Description </h6>
            <ul>
                <li> button <code>add-dependency-listener</code> will add a dependencyListener with the following changes
                    <pre>
                        context.sample = "dependency-sample";
                    </pre>
                </li>
                <li> button <code>add-dependency-initializer</code> will add a dependencyInitializer with the following changes
                    <pre>
                        item.name = "dependency-sample";
                        properties.sample = "dependency-sample";
                        sysProperties.sample = "dependency-sample";
                        context.context = "dependency-context";
                    </pre>
                </li> 
                <li> 
                    button <code>stop-dependency-event</code> will block all dependency events
                </li>
                <li> 
                    button <code>remove-all-handlers</code> will remove all previously added dependency initializers and listeners
                </li>
                <li>
                    button <code>create-fetch-request</code> will trigger a fetch request
                </li>
                <li>
                    button <code>create-xhr-request</code> will trigger a xhr request
                </li>
                <li>
                    <code>button untrack-fetch-request</code> will trigger a fetch request that will be blocked
                </li>
            </ul>
        </div>
    `;
    ele.innerHTML = description;
    document.body.appendChild(ele);
}

function dependencySample() {
    var appInsights = getAppInsightsFromSnippet();
    if (!appInsights) {
        throw console.error("appInsights is undefined");
    }
    createContainer();
    createCreateRequestComponent();
    createClearHandlerComponent();
    createDependencyListenerComponent();
    createDependencyInitializerComponent();
    createDescription();
}
dependencySample();




