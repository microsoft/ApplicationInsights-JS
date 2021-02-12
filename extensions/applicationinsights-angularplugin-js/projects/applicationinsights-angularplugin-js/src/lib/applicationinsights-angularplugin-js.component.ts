import { Component } from '@angular/core';
import {
  IConfig, IPageViewTelemetry, IAppInsights, PropertiesPluginIdentifier, Util
} from '@microsoft/applicationinsights-common';
import {
  IPlugin, IConfiguration, IAppInsightsCore,
  ITelemetryPlugin, BaseTelemetryPlugin, CoreUtils, ITelemetryItem, ITelemetryPluginChain,
  IProcessTelemetryContext, _InternalMessageId, LoggingSeverity, getLocation
} from '@microsoft/applicationinsights-core-js';
import { Router } from '@angular/router';
// For types only
import * as properties from '@microsoft/applicationinsights-properties-js';

interface IAngularExtensionConfig {
  /**
   * Angular router for enabling Application Insights PageView tracking.
   */
  router?: Router;
}

const NAVIGATIONEND = 'NavigationEnd';

@Component({
  selector: 'lib-applicationinsights-angularplugin-js',
  template: ``,
  styles: []
})
// tslint:disable-next-line:component-class-suffix
export class AngularPlugin extends BaseTelemetryPlugin {
  public priority = 186;
  public identifier = 'AngularPlugin';

  private analyticsPlugin: IAppInsights;
  private propertiesPlugin: properties.PropertiesPlugin;

  initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
    super.initialize(config, core, extensions, pluginChain);
    const ctx = this._getTelCtx();
    const extConfig = ctx.getExtCfg<IAngularExtensionConfig>(this.identifier, { router: null });
    CoreUtils.arrForEach(extensions, ext => {
        const identifier = (ext as ITelemetryPlugin).identifier;
        if (identifier === 'ApplicationInsightsAnalytics') {
            this.analyticsPlugin = (ext as any) as IAppInsights;
        }
        if (identifier === PropertiesPluginIdentifier) {
            this.propertiesPlugin = (ext as any) as properties.PropertiesPlugin;
        }
    });
    if (extConfig.router) {
        let isPageInitialLoad = true;
        if (isPageInitialLoad) {
            const pageViewTelemetry: IPageViewTelemetry = {
                uri: extConfig.router.url
            };
            this.trackPageView(pageViewTelemetry);
        }
        extConfig.router.events.subscribe(event => {
            if (event.constructor.name === NAVIGATIONEND) {
                // for page initial load, do not call trackPageView twice
                if (isPageInitialLoad) {
                    isPageInitialLoad = false;
                    return;
                }
                const pageViewTelemetry: IPageViewTelemetry = { uri: extConfig.router.url };
                this.trackPageView(pageViewTelemetry);
            }
        });
    }
  }

  /**
   * Add Part A fields to the event
   * @param event The event that needs to be processed
   */
  processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
    this.processNext(event, itemCtx);
  }

  trackPageView(pageView: IPageViewTelemetry) {
    if (this.analyticsPlugin) {
        const location = getLocation();
        if (this.propertiesPlugin && this.propertiesPlugin.context && this.propertiesPlugin.context.telemetryTrace) {
            this.propertiesPlugin.context.telemetryTrace.traceID = Util.generateW3CId();
            this.propertiesPlugin.context.telemetryTrace.name = location && location.pathname || '_unknown_';
        }
        this.analyticsPlugin.trackPageView(pageView);
    } else {
        this.diagLog().throwInternal(
            // tslint:disable-next-line:max-line-length
            LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, 'Analytics plugin is not available, Angular plugin telemetry will not be sent: ');
    }
  }
}
