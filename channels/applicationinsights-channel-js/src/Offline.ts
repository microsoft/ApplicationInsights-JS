import {
    createUniqueNamespace, eventOff, eventOn, getDocument, getNavigator, getWindow, isNullOrUndefined, isUndefined, mergeEvtNamespace
} from "@microsoft/applicationinsights-core-js";

export interface IOfflineListener {
    isOnline: () => boolean;
    isListening: () => boolean;
    unload: () => void;
}

function _disableEvents(target: any, evtNamespace: string | string[]) {
    eventOff(target, null, null, evtNamespace);
}

/**
 * Create a new OfflineListener instance to monitor browser online / offline events
 * @param parentEvtNamespace - The parent event namespace to append to any specific events for this instance
 */
export function createOfflineListener(parentEvtNamespace?: string | string[]): IOfflineListener {
    let _document = getDocument();
    var _navigator = getNavigator();        // Gets the window.navigator or workerNavigator depending on the global
    let _isListening: boolean = false;
    let _onlineStatus: boolean = true;
    let _evtNamespace = mergeEvtNamespace(createUniqueNamespace("OfflineListener"), parentEvtNamespace);

    try {
        if (_enableEvents(getWindow())) {
            _isListening = true;
        }
        
        if (_document) {
            // Also attach to the document.body or document
            let target:any = _document.body || _document;

            if (target.ononline) {
                if (_enableEvents(target)) {
                    _isListening = true;
                }
            }
        }

        if (_isListening) {
            // We are listening to events so lets set the current status rather than assuming we are online #1538
            if (_navigator && !isNullOrUndefined(_navigator.onLine)) { // navigator.onLine is undefined in react-native
                _onlineStatus = _navigator.onLine;
            }
        }
    } catch (e) {
        // this makes react-native less angry
        _isListening = false;
    }

    function _enableEvents(target: any): boolean {
        let enabled = false;
        if (target) {
            enabled = eventOn(target, "online", _setOnline, _evtNamespace);
            if (enabled) {
                eventOn(target, "offline", _setOffline, _evtNamespace);
            }
        }

        return enabled;
    }

    function _setOnline() {
        _onlineStatus = true;
    }

    function _setOffline() {
        _onlineStatus = false;
    }

    function _isOnline(): boolean {
        let result = true;
        if (_isListening) {
            result = _onlineStatus
        } else if (_navigator && !isNullOrUndefined(_navigator.onLine)) { // navigator.onLine is undefined in react-native
            result = _navigator.onLine;
        }

        return result;
    }

    function _unload() {
        let win = getWindow();
        if (win && _isListening) {
            _disableEvents(win, _evtNamespace);

            if (_document) {
                // Also attach to the document.body or document
                let target:any = _document.body || _document;
                if (!isUndefined(target.ononline)) {
                    _disableEvents(target, _evtNamespace);
                }
            }

            _isListening = false;
        }
    }

    return {
        isOnline: _isOnline,
        isListening: () => _isListening,
        unload: _unload
    };
}
