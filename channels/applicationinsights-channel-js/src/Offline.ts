import { CoreUtils } from '@microsoft/applicationinsights-core-js';

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
        try {
            if (typeof window === 'undefined') {
                this.isListening = false;
            } else if (window && window.addEventListener) {
                window.addEventListener('online', this._setOnline.bind(this), false);
                window.addEventListener('offline', this._setOffline.bind(this), false);
                this.isListening = true;
            } else if (document && document.body) {
                (document.body as any).ononline = this._setOnline.bind(this);
                (document.body as any).onoffline = this._setOffline.bind(this)
                this.isListening = true;
            } else if (document) {
                (document as any).ononline = this._setOnline.bind(this);
                (document as any).onoffline = this._setOffline.bind(this)
                this.isListening = true;
            } else {
                // Could not find a place to add event listener
                this.isListening = false;
            }
        } catch (e) {

            // this makes react-native less angry
            this.isListening = false;
        }
    }

    public isOnline(): boolean {
        if (this.isListening) {
            return this._onlineStatus
        } else if (navigator && !CoreUtils.isNullOrUndefined(navigator.onLine)) { // navigator.onLine is undefined in react-native
            return navigator.onLine;
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
