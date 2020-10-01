import {
    IPlugin, IConfiguration, IAppInsightsCore,
    BaseTelemetryPlugin, CoreUtils, ITelemetryItem, IProcessTelemetryContext, ITelemetryPluginChain,
    IDiagnosticLogger, LoggingSeverity, _InternalMessageId, ICustomProperties,
    getWindow, getDocument, getHistory, getLocation, doPerf, 
} from "@microsoft/applicationinsights-core-js";

import {
    IConfig, Util, PageViewPerformance, IAppInsights, PageView, RemoteDependencyData, Event as EventTelemetry, IEventTelemetry,
    TelemetryItemCreator, Metric, Exception, SeverityLevel, Trace, IDependencyTelemetry,
    IExceptionTelemetry, ITraceTelemetry, IMetricTelemetry, IAutoExceptionTelemetry,
    IPageViewTelemetryInternal, IPageViewTelemetry, IPageViewPerformanceTelemetry, IPageViewPerformanceTelemetryInternal,
    DateTimeUtils, IExceptionInternal, PropertiesPluginIdentifier, AnalyticsPluginIdentifier
} from "@microsoft/applicationinsights-common";

import { IClickAnalyticsConfiguration, IPageActionOverrideValues, IContentHandler, IAutoCaptureHandler } from './Interfaces/Datamodel';
import {  _removeNonObjectsAndInvalidElements, extend, _isElementDnt, isDocumentObjectAvailable, _validateContentNamePrefix } from './common/Utils';
import { PageAction } from './events/PageAction';
import { AutoCaptureHandler } from "./handlers/AutoCaptureHandler";
import { DomContentHandler } from "./handlers/DomContentHandler";

const doNotTrackFieldName = 'data-bi-dnt';

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
    if (!_isElementDnt(element, doNotTrackFieldName)) {
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
        useDefaultContentName: true,
        aiBlobAttributeTag: 'data-ai-blob',
        autoCapture: true,
        callback: {
            pageActionPageTags: null,
            pageActionContentTags: null,
        },
        pageTags: {},
        // overrideValues to use instead of collecting automatically
        coreData: {
            referrerUri: isDocumentObjectAvailable ? document.referrer : '',
            requestUri: '',
            pageName: '',
            pageType: ''
        },
        captureAllMetaDataContent:false,
        contentNamePrefix : 'data-'
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
        overrideConfig.contentNamePrefix = _validateContentNamePrefix(overrideConfig) ? overrideConfig.contentNamePrefix : 'data-';
        

        return extend(true, defaultConfig, overrideConfig);
    }
}


}