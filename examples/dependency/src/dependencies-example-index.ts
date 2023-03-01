// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach } from "@microsoft/applicationinsights-core-js";
import { addDependencyListener, addDependencyInitializer, stopDependencyEvent, initApplicationInsights } from "./appinsights-init";
import { addHandlersButtonId, buttonSectionId, clearDetailsButtonId, clearDetailsList, createButton, createContainers, createDetailList, createFetchRequest, createUnTrackRequest, createXhrRequest, dependencyInitializerDetails, dependencyInitializerDetailsContainerId, dependencyListenerButtonId, dependencyListenerDetails, dependencyListenerDetailsContainerId, fetchCallId, fetchXhrId, removeAllHandlersId, stopDependencyEventButtonId, untrackFetchRequestId } from "./utils";

let dependencyListenerHandler: any = null;
let dependencyInitializerHandler: any = null;

// This function is an example of using addDependencyListener to modify dependencyDetails
function addDependencyListenerOnclick() {
    dependencyListenerHandler = addDependencyListener((details: any) => {
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
function addDependencyInitializerOnClick() {
    dependencyInitializerHandler = addDependencyInitializer((details: any) => {
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

function onAddHandlersClick() {
    addDependencyListenerOnclick();
    addDependencyInitializerOnClick();
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
    arrForEach(buttons, (button) => {
        container?.appendChild(button);
    });
}

function dependencySample() {
    initApplicationInsights();
    createContainers();
    createButtonSection();
}
dependencySample();
