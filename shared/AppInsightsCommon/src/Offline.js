"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOfflineListener = createOfflineListener;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
function _disableEvents(target, evtNamespace) {
    (0, applicationinsights_core_js_1.eventOff)(target, null, null, evtNamespace);
}
/**
 * Create a new OfflineListener instance to monitor browser online / offline events
 * @param parentEvtNamespace - The parent event namespace to append to any specific events for this instance
 */
function createOfflineListener(parentEvtNamespace) {
    var _document = (0, applicationinsights_core_js_1.getDocument)();
    var _navigator = (0, applicationinsights_core_js_1.getNavigator)(); // Gets the window.navigator or workerNavigator depending on the global
    var _isListening = false;
    var listenerList = [];
    // Set the initial state
    // rState is changed by the browser, both via events and when we check the navigator.onLine property
    var rState = 1 /* eOfflineValue.Online */;
    if (_navigator && !(0, applicationinsights_core_js_1.isNullOrUndefined)(_navigator.onLine) && !_navigator.onLine) { // navigator.onLine is undefined in react-native
        rState = 2 /* eOfflineValue.Offline */;
    }
    // ustate is changed by the user calling setOnlineState
    var uState = 0 /* eOfflineValue.Unknown */;
    // current state would be updated each time rState or uState is changed
    // it is a resolved value of rState and uState
    var _currentState = calCurrentState();
    var _evtNamespace = (0, applicationinsights_core_js_1.mergeEvtNamespace)((0, applicationinsights_core_js_1.createUniqueNamespace)("OfflineListener"), parentEvtNamespace);
    try {
        if (_enableEvents((0, applicationinsights_core_js_1.getWindow)())) {
            _isListening = true;
        }
        if (_document) {
            // Also attach to the document.body or document
            var target = _document.body || _document;
            if (target.ononline) {
                if (_enableEvents(target)) {
                    _isListening = true;
                }
            }
        }
    }
    catch (e) {
        // this makes react-native less angry
        _isListening = false;
    }
    function _enableEvents(target) {
        var enabled = false;
        if (target) {
            enabled = (0, applicationinsights_core_js_1.eventOn)(target, "online", _setOnline, _evtNamespace);
            if (enabled) {
                (0, applicationinsights_core_js_1.eventOn)(target, "offline", _setOffline, _evtNamespace);
            }
        }
        return enabled;
    }
    function _isOnline() {
        return _currentState;
    }
    function calCurrentState() {
        if (uState === 2 /* eOfflineValue.Offline */ || rState === 2 /* eOfflineValue.Offline */) {
            return false;
        }
        return true; // if both unknown, then we assume the network is good
    }
    function listnerNoticeCheck() {
        // we were offline and are now online or we were online and now offline
        var newState = calCurrentState();
        if (_currentState !== newState) {
            _currentState = newState; // use the resolved state to update
            // send all the callbacks with the current state
            (0, applicationinsights_core_js_1.arrForEach)(listenerList, function (callback) {
                var offlineState = {
                    isOnline: _currentState,
                    rState: rState,
                    uState: uState
                };
                try {
                    callback(offlineState);
                }
                catch (e) {
                    // Do nothing, just making sure we run all of the callbacks
                }
            });
        }
    }
    function setOnlineState(newState) {
        uState = newState;
        listnerNoticeCheck();
    }
    function _setOnline() {
        rState = 1 /* eOfflineValue.Online */;
        listnerNoticeCheck();
    }
    function _setOffline() {
        rState = 2 /* eOfflineValue.Offline */;
        listnerNoticeCheck();
    }
    function _unload() {
        var win = (0, applicationinsights_core_js_1.getWindow)();
        if (win && _isListening) {
            _disableEvents(win, _evtNamespace);
            if (_document) {
                // Also attach to the document.body or document
                var target = _document.body || _document;
                if (!(0, applicationinsights_core_js_1.isUndefined)(target.ononline)) {
                    _disableEvents(target, _evtNamespace);
                }
            }
            _isListening = false;
        }
    }
    function addListener(callback) {
        listenerList.push(callback);
        // Define rm as an instance of IUnloadHook
        return {
            rm: function () {
                var index = listenerList.indexOf(callback);
                if (index > -1) {
                    return listenerList.splice(index, 1);
                }
                else {
                    return;
                }
            }
        };
    }
    return {
        isOnline: _isOnline,
        isListening: function () { return _isListening; },
        unload: _unload,
        addListener: addListener,
        setOnlineState: setOnlineState
    };
}
