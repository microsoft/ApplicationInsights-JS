/**
 * ClickAnalyticsPlugin.ts
 * @author Krishna Yalamanchili (kryalama)
 * @copyright Microsoft 2020
 */

import {
    IPlugin, IConfiguration, IAppInsightsCore,
    BaseTelemetryPlugin, CoreUtils, ITelemetryItem,
    IProcessTelemetryContext, ITelemetryPluginChain, _InternalMessageId
} from "@microsoft/applicationinsights-core-js";
import { IConfig } from "@microsoft/applicationinsights-common";
import { 
    IClickAnalyticsConfiguration, IPageActionOverrideValues,
    IContentHandler, IAutoCaptureHandler, DEFAULT_DATA_PREFIX, DEFAULT_AI_BLOB_ATTRIBUTE_TAG, 
    DEFAULT_DONOT_TRACK_TAG 
} from './Interfaces/Datamodel';
import {
    _removeNonObjectsAndInvalidElements, extend, _isElementDnt, 
     isDocumentObjectAvailable, _validateContentNamePrefix, isValueAssigned 
        } from './common/Utils';
import { PageAction } from './events/PageAction';
import { AutoCaptureHandler } from "./handlers/AutoCaptureHandler";
import { DomContentHandler } from "./handlers/DomContentHandler";


export class ClickAnalyticsPlugin extends BaseTelemetryPlugin {
    public identifier: string = 'ClickAnalyticsPlugin';
    public priority: number = 181;
    public version = '#version#';
    private _config: IClickAnalyticsConfiguration;
    private pageAction: PageAction;
    private _autoCaptureHandler: IAutoCaptureHandler;
    private _contentHandler: IContentHandler;
    

    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
        
        if (CoreUtils.isNullOrUndefined(core)) {
            throw Error("Error initializing");
        }
        config.extensionConfig = config.extensionConfig || [];
        config.extensionConfig[this.identifier] = config.extensionConfig[this.identifier] || {};
        this._config = this._mergeConfig(config.extensionConfig[this.identifier]);
        super.initialize(config, core, extensions, pluginChain);
        // Default to DOM content handler
        this._contentHandler = this._contentHandler ? this._contentHandler : new DomContentHandler(this._config, this.diagLog());
        // Default to DOM autoCapture handler
        this._autoCaptureHandler = this._autoCaptureHandler ? this._autoCaptureHandler : new AutoCaptureHandler(this, this.diagLog());
        let metaTags = this._contentHandler.getMetadata();
        this.pageAction = new PageAction(this, this._config, this._contentHandler, this._config.callback.pageActionPageTags, metaTags, this.diagLog());
        if (this._config.autoCapture) {
            this._autoCaptureHandler.click();
        }
    }

    processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void {
        this.processNext(env, itemCtx);
    }

    /**
     * API to create and send a populated PageAction event 
     * @param element - DOM element
     * @param overrideValues - PageAction overrides
     * @param customProperties - Custom properties(Part C)
     * @param isRightClick - Flag for mouse right clicks
     */
   public capturePageAction(element: Element, overrideValues?: IPageActionOverrideValues, customProperties?: { [name: string]: string | number | boolean | string[] | number[] | boolean[] | object }, isRightClick?: boolean): void {
        const donotTrackTag = this._config.dataTags.customDataPrefix + this._config.dataTags.donotTrackDataTag;
        if (!_isElementDnt(element, donotTrackTag)) {
            this.pageAction.capturePageAction(element, overrideValues, customProperties, isRightClick);
        }

    }


    /**
     * Merge passed in configuration with default configuration
     * @param overrideConfig
     */
   private _mergeConfig(overrideConfig: IClickAnalyticsConfiguration): IClickAnalyticsConfiguration {
        let defaultConfig: IClickAnalyticsConfiguration = {
            // General library settings
            autoCapture: true,
            callback: {
                pageActionPageTags: null,
            },
            pageTags: {},
            // overrideValues to use instead of collecting automatically
            coreData: {
                referrerUri: isDocumentObjectAvailable ? document.referrer : '',
                requestUri: '',
                pageName: '',
                pageType: ''
            },
            dataTags: {
                useDefaultContentName: false,
                aiBlobAttributeTag: DEFAULT_AI_BLOB_ATTRIBUTE_TAG,
                customDataPrefix: DEFAULT_DATA_PREFIX,
                captureAllMetaDataContent: false,
                donotTrackDataTag: DEFAULT_DONOT_TRACK_TAG
            }
        };

    let attributesThatAreObjectsInConfig: any[] = [];
        for (const attribute in defaultConfig) {
            if (typeof defaultConfig[attribute] === 'object') {
                attributesThatAreObjectsInConfig.push(attribute);
            }
        }

    if (overrideConfig) {
            // delete attributes that should be object and 
            // delete properties that are null, undefined, ''
            _removeNonObjectsAndInvalidElements(overrideConfig, attributesThatAreObjectsInConfig);
            if(isValueAssigned(overrideConfig.dataTags)) {
                overrideConfig.dataTags.customDataPrefix = _validateContentNamePrefix(overrideConfig) ? overrideConfig.dataTags.customDataPrefix : DEFAULT_DATA_PREFIX;
            }
            return extend(true, defaultConfig, overrideConfig);
        }
    }


}