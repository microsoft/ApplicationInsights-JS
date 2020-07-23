// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
  BaseTelemetryPlugin, IConfiguration, CoreUtils,
  IAppInsightsCore, IPlugin, ITelemetryItem, IProcessTelemetryContext, _InternalLogMessage, LoggingSeverity, _InternalMessageId, getNavigator,
  ITelemetryPluginChain, InstrumentFunc, IInstrumentHooksCallbacks, IInstrumentCallDetails, InstrumentFuncs, InstrumentorHooksCallback, InstrumentProto, strPrototype
} from '@microsoft/applicationinsights-core-js';
import { LoggingElement } from './components/helpers';
import { tempStyle, permStyle } from './components/styleNodeSrc';
import { DebugBin, DebugBinParent } from './components/debugBins';
import dynamicProto from "@microsoft/dynamicproto-js";
import { ITelemetryConfig } from './interfaces/ITelemetryPlugin';

interface IDebugPluginConfig extends ITelemetryConfig, IConfiguration {}

export default class DebugPlugin extends BaseTelemetryPlugin {

  public static identifier: string = "DebugPlugin";

  public static getDefaultConfig() {
    const config = {
      trackers: () => [
        'trackEvent',
        'trackPageView',
        'trackPageViewPerformance',
        'trackException',
        'trackTrace',
        'trackMetric',
        'trackDependencyData',
        'throwInternal',
        'logInternalMessage',
        'triggerSend',
        '_sender',
      ],
      cssPrefix: () => 'ai'
    };
    return config;
  }

  public identifier: string = DebugPlugin.identifier;

  constructor() {
    super();
    /**
     * the root element of the logger
     */
    let rootElement: HTMLDivElement;

    /**
     * the logging element
     */
    let logger: LoggingElement;

    /**
     * the style that is only on the webpage when the log is active
     */
    let tempStyleEl: HTMLStyleElement;

    /**
     * the style that will be permanently embedded in the webpage
     * TODO: manage style conflicts (prepend unique ID to relevant class names?)
     */
    let permStyleEl: HTMLStyleElement;

    /**
     * an object containing the individual debug bin items
     */
    let debugBins: {
      [key: string]: DebugBin;
    };

    /**
     * the parent containing all the individual debugBins
     */
    let debugBinParent: DebugBinParent;

    /**
     * the different telemetry functions that will be tracked
     */
    let trackers: string[];

    /**
     * the prefix to use with all dynamic CSS elements
     */
    let prefix: string;

    /**
     * appinsights analytics extension instance. useful methods on __proto__
     */
    let analyticsExt: IPlugin;

    /**
     * ajax dependency extension instance. useful methods on __proto__
     */
    let ajaxDependencyExt: IPlugin;

    /**
     * appinsights properties extension instance. useful methods on __proto__
     */
    let propertiesExt: IPlugin;

    /**
     * appinsights channel extension instance.
     */
    let channelPluginExt: IPlugin;

    /**
     * timestamp used to track number of seconds since webpage was loaded
     */
    let startTime: number = +new Date();

    /**
     * the config for this plugin
     */
    let _extensionConfig: IDebugPluginConfig = DebugPlugin.getDefaultConfig();

    dynamicProto(DebugPlugin, this, (_self, base) => {
      _self.initialize = (config: IDebugPluginConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {
        if (!_self.isInitialized()) {
          base.initialize(config, core, extensions, pluginChain);

          // 1. grabs each extension involved in instrumentation
          for (let i = 0; i < extensions.length; i++) {
            if (extensions[i].identifier === 'ApplicationInsightsAnalytics') {
              analyticsExt = extensions[i];
            }
            else if (extensions[i].identifier === 'AjaxDependencyPlugin') {
              ajaxDependencyExt = extensions[i];
            }
            else if (extensions[i].identifier === 'AppInsightsPropertiesPlugin') {
              propertiesExt = extensions[i];
            }
            else if (extensions[i].identifier === 'AppInsightsChannelPlugin') {
              channelPluginExt = extensions[i];
            }
          }

          // 2. initialize trackers if they don't exist
          const defaultConfig = DebugPlugin.getDefaultConfig();
          const ctx = _self._getTelCtx();
          const identifier = _self.identifier;
          for (const field in defaultConfig) {
              _extensionConfig[field] = () => ctx.getConfig(identifier, field, defaultConfig[field]());
          }

          trackers = _extensionConfig.trackers();
          prefix = _extensionConfig.cssPrefix();

          // 3. setup debugBin
          const debugBinContainer = document.createElement("div");
          debugBinContainer.className = `${prefix}-debug-bin-container`;
          debugBinParent = new DebugBinParent(debugBinContainer, [], 0, prefix);


          // 5. instrument functions
          const diagLog = _self.diagLog();
          debugBins = {};
          for (let i = 0; i < trackers.length; i++) {
            let tracker = trackers[i];
            for (const target of [propertiesExt, analyticsExt, ajaxDependencyExt, channelPluginExt, diagLog]) {
              let val = InstrumentFunc(target, tracker, {
                req: _self.preProcessItem(tracker) as any as () => InstrumentorHooksCallback,
                rsp: _self.postProcessItem(tracker) as any as () => InstrumentorHooksCallback
              }, true);

              if (val) {
                debugBins[tracker] = new DebugBin(tracker, 0, debugBinParent, (i + 1) * 50);
                break;
              }
            }
          }

          // 6. append permanent style
          permStyleEl = document.createElement("style");
          permStyleEl.innerHTML = permStyle(prefix);
          document.head.appendChild(permStyleEl);

          // 7. setup temporary style and root element
          tempStyleEl = document.createElement("style");
          tempStyleEl.innerHTML = tempStyle(prefix);
          const rootEl = rootElement = document.createElement("div");
          // TODO: research more accessibility (aria)
          rootEl.style.position = 'fixed';
          rootEl.style.width = '100vw';
          rootEl.style.height = '100vh';
          rootEl.style.backgroundColor = '#ffffff';
          rootEl.style.opacity = '0';
          rootEl.style.pointerEvents = 'auto';
          rootEl.style.top = '-100%';
          rootEl.style.transition = '.2s top cubic-bezier(0.87, 0, 0.13, 1)';

          // 8. add button to debugBinParent
          debugBinParent.addButton((evt: MouseEvent) => {
            evt.stopPropagation();
            rootEl.style.top = (rootEl.style.opacity === '0') ? '0%' : '-100%';
            rootEl.style.pointerEvents = (rootEl.style.opacity === '0') ? 'auto' : 'none';

            if (rootEl.style.opacity === '0') {
              document.head.appendChild(tempStyleEl);
            } else {
              document.head.removeChild(tempStyleEl);
            }

            rootEl.style.opacity = (rootEl.style.opacity === '0') ? '1' : '0';
          }, 'toggle dashboard');

          // 9. setup logger and log config
          const logHeading = document.createElement("h1");
          logHeading.textContent = 'dashboard';
          logHeading.style.fontFamily = "monospace";
          logHeading.style.textAlign = 'center';
          rootEl.appendChild(logHeading);

          logger = new LoggingElement(rootEl, prefix, trackers);

          document.body.appendChild(
            rootEl
          );

          document.body.appendChild(
            debugBinContainer
          );

          logger.newLogEntry(config, `[0s] config`, 0, 'config');
        }
      }

      _self.preProcessItem = (itemType: string) => {
        return (funcArgs: IInstrumentCallDetails, ...orgArgs: any[]) => {
          (debugBins[itemType] || debugBins.default).increment();
          if (itemType === 'trackException' && !debugBinParent.showChildren) {
            debugBinParent.addClassToEl('notify');
          }
          logger.newLogEntry(orgArgs, `[${(+new Date() - startTime) / 1000}s] ${itemType}`, 0, itemType);
          if (console && console.log) {
            console.log(`[${itemType}] preProcess - funcArgs: `, funcArgs);
            console.log(`[${itemType}] preProcess - orgArgs: `, orgArgs);
          }
        }
      }

      _self.postProcessItem = (itemType: string) => {
        return (funcArgs: IInstrumentCallDetails, ...orgArgs: any[]) => {
          if (console && console.log) {
            console.log(`[${itemType}] postProcess - funcArgs: `, funcArgs);
            console.log(`[${itemType}] postProcess - orgArgs: `, orgArgs);
          }
        }
      }

      _self.processTelemetry = (event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
        if (console && console.log) { console.log(event); }
        _self.processNext(event, itemCtx);
        logger.newLogEntry(event, `[${(+new Date() - startTime) / 1000}s] ${event.baseType}`, 0, event.baseType);
      }
    });
  }

  public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
    // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
  }


  preProcessItem(itemType: string) {
    // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
  }

  postProcessItem(itemType: string) {
    // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
  }

  processTelemetry(event: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
    // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
  }
}