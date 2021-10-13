import { EventHelper, getWindow, getDocument, getNavigator, isUndefined, isNullOrUndefined, attachEvent } from "@microsoft/applicationinsights-core-js";
import dynamicProto from "@microsoft/dynamicproto-js";

/**
 * @description Monitors browser for offline events
 * @export default - Offline: Static instance of OfflineListener
 * @class OfflineListener
 */
export class OfflineListener {
    public static Offline = new OfflineListener;
    public isListening: boolean;
    
    constructor() {
        let _window = getWindow();
        let _document = getDocument();
        let isListening = false;
        let _onlineStatus: boolean = true;

        dynamicProto(OfflineListener, this, (_self) => {
            try {
                if (_window) {
                    if (attachEvent(_window, "online", _setOnline)) {
                        attachEvent(_window, "offline", _setOffline);
                        isListening = true;
                    }
                }
                
                if (_document) {
                    // Also attach to the document.body or document
                    let target:any = _document.body || _document;
    
                    if (!isUndefined(target.ononline)) {
                        target.ononline = _setOnline;
                        target.onoffline = _setOffline;
                        isListening = true;

                    }
                }

                if (isListening) {
                    // We are listening to events so lets set the current status rather than assuming we are online #1538
                    var _navigator = getNavigator();        // Gets the window.navigator or workerNavigator depending on the global
                    if (_navigator && !isNullOrUndefined(_navigator.onLine)) { // navigator.onLine is undefined in react-native
                        _onlineStatus = _navigator.onLine;
                    }
                }
            } catch (e) {
    
                // this makes react-native less angry
                isListening = false;
            }
    
            _self.isListening = isListening;

            _self.isOnline = (): boolean => {
                let result = true;
                var _navigator = getNavigator();
                if (isListening) {
                    result = _onlineStatus
                } else if (_navigator && !isNullOrUndefined(_navigator.onLine)) { // navigator.onLine is undefined in react-native
                    result = _navigator.onLine;
                }

                return result;
            };
        
            _self.isOffline = (): boolean => {
                return !_self.isOnline();
            };

            function _setOnline() {
                _onlineStatus = true;
            }

            function _setOffline() {
                _onlineStatus = false;
            }
        });
    }

    public isOnline(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    public isOffline(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }
}

export const Offline = OfflineListener.Offline;
