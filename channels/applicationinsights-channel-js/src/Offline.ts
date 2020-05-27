import { CoreUtils, EventHelper, getWindow, getDocument, getNavigator } from '@microsoft/applicationinsights-core-js';

/**
 * @description Monitors browser for offline events
 * @export default - Offline: Static instance of OfflineListener
 * @class OfflineListener
 */
export class OfflineListener {
    public static Offline = new OfflineListener;
    public isListening: boolean;
    private _onlineStatus: boolean = true;
    
    constructor() {
        let _window = getWindow();
        let _document = getDocument();
        let isListening = false;
        let _this = this;

        try {
            if (_window) {
                if (EventHelper.Attach(_window, 'online', this._setOnline.bind(_this))) {
                    EventHelper.Attach(_window, 'offline', this._setOffline.bind(_this));
                    isListening = true;
                }
            }
            
            if (_document) {
                // Also attach to the document.body or document
                let target:any = _document.body || _document;

                if (!CoreUtils.isUndefined(target.ononline)) {
                    target.ononline = this._setOnline.bind(_this);
                    target.onoffline = this._setOffline.bind(_this)
                    isListening = true;
                }
            }
        } catch (e) {

            // this makes react-native less angry
            isListening = false;
        }

        this.isListening = isListening;
    }

    public isOnline(): boolean {
        var _navigator = getNavigator();
        if (this.isListening) {
            return this._onlineStatus
        } else if (_navigator && !CoreUtils.isNullOrUndefined(_navigator.onLine)) { // navigator.onLine is undefined in react-native
            return _navigator.onLine;
        } else {
            // Cannot determine online status - report as online
            return true;
        }
    }

    public isOffline(): boolean {
        return !this.isOnline();
    }

    private _setOnline() {
        this._onlineStatus = true;
    }
    private _setOffline() {
        this._onlineStatus = false;
    }
}

export const Offline = OfflineListener.Offline;
