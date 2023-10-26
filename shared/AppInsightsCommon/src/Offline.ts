import {
    IUnloadHook, createUniqueNamespace, eventOff, eventOn, getDocument, getNavigator, getWindow, isNullOrUndefined, isUndefined,
    mergeEvtNamespace
} from "@microsoft/applicationinsights-core-js";

export type OfflineCallback = () => void;
export const enum eOfflineValue {
    Unknown = 0,
    Online = 1,
    Offline = 2
}
export interface IOfflineState {
    readonly isOnline: boolean;
    readonly rState: eOfflineValue; // runtime state
    readonly uState: eOfflineValue;// user state
}
export declare function OfflineCallback(state?: IOfflineState): void;
export interface IOfflineListener {
    isOnline: () => boolean;
    isListening: () => boolean;
    unload: () => void;
    _setOnlineState: (isOnline: boolean) => void;
    addListener(callback: OfflineCallback): IUnloadHook;
    namespace?: string;
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
    let listenerList = new Set<OfflineCallback>();
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
            enabled = eventOn(target, "online", _setOnlineState(true), _evtNamespace);
            if (enabled) {
                eventOn(target, "offline", _setOnlineState(false), _evtNamespace);
            }
        }

        return enabled;
    }

    function _setOnlineState(isOnline: boolean){
        _onlineStatus = isOnline;
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

    function addListener(callback: OfflineCallback) {
        listenerList.add(callback);
        return {
            rm: () => {
                listenerList.delete(callback);
            }
        };
    }

    return {
        isOnline: _isOnline,
        isListening: () => _isListening,
        unload: _unload,
        _setOnlineState: _setOnlineState,
        addListener: addListener
    };
}
