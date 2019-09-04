import { AppInsightsCore, IConfiguration, DiagnosticLogger, ITelemetryItem, IPlugin } from "@microsoft/applicationinsights-core-js";
import { IPageViewTelemetry } from "@microsoft/applicationinsights-common";
import ReactPlugin from "../src/ReactPlugin";
import { IReactExtensionConfig } from "../src/Interfaces/IReactExtensionConfig";
import { createBrowserHistory } from "history";

let reactPlugin: ReactPlugin;
let core: AppInsightsCore;

describe("ReactAI", () => {

  function init() {
    core = new AppInsightsCore();
    core.logger = new DiagnosticLogger();
    reactPlugin = new ReactPlugin();
  }

  it("React Configuration: Config options can be passed from root config", () => {
    const history = createBrowserHistory();
    init();
    reactPlugin.initialize({
      instrumentationKey: 'instrumentation_key',
      extensionConfig: {
        [reactPlugin.identifier]: {
          history: history
        }
      }
    }, core, []);
    const reactConfig: IReactExtensionConfig = reactPlugin['_extensionConfig'];
    expect(reactConfig.history).toEqual(history);
  });

  it("React PageView using Analytics plugin", () => {
    const history = createBrowserHistory();
    jest.useFakeTimers();
    init();
    let analyticsExtension = {
      initialize: (config, core, extensions) => { },
      trackEvent: (event, customProperties) => { },
      trackPageView: (pageView, customProperties) => { },
      trackException: (exception, customProperties) => { },
      trackTrace: (trace, customProperties) => { },
      trackMetric: (metric, customProperties) => { },
      _onerror: (exception) => { },
      startTrackPage: (name) => { },
      stopTrackPage: (name, properties, measurements) => { },
      startTrackEvent: (name) => { },
      stopTrackEvent: (name, properties, measurements) => { },
      addTelemetryInitializer: (telemetryInitializer) => { },
      trackPageViewPerformance: (pageViewPerformance, customProperties) => { },
      processTelemetry: (env) => { },
      setNextPlugin: (next) => { },
      identifier: "ApplicationInsightsAnalytics"
    };
    let channel = new ChannelPlugin();
    let config: IConfiguration = {
      instrumentationKey: 'instrumentation_key',
      extensionConfig: {
        [reactPlugin.identifier]: {
          history: history
        },
      }
    };
    core.initialize(config, [reactPlugin, analyticsExtension, channel]);
    // Mock Analytics track
    const analyticsMock = analyticsExtension.trackPageView = jest.fn();

    // Emulate navigation to different URL-addressed pages
    history.push("/home", { some: "state" });
    history.push("/new-fancy-page");
    jest.runOnlyPendingTimers();
    expect(analyticsExtension.trackPageView).toHaveBeenCalledTimes(2);
    var event: IPageViewTelemetry = analyticsMock.mock.calls[0][0]
    expect(event.uri).toBe("/home");
    event = analyticsMock.mock.calls[1][0]
    expect(event.uri).toBe("/new-fancy-page");
  });

  it("React plugin with Analytics not available", () => {
    const history = createBrowserHistory();
    jest.useFakeTimers();
    init();
    let channel = new ChannelPlugin();
    let config: IConfiguration = {
      instrumentationKey: 'instrumentation_key',
      extensionConfig: {
        [reactPlugin.identifier]: {
          history: history
        }
      }
    };
    core.initialize(config, [reactPlugin, channel]);
    // Mock logger
    const loggerMock = reactPlugin["_logger"].throwInternal = jest.fn();
    history.push("/home");
    jest.runOnlyPendingTimers();
    expect(loggerMock).toHaveBeenCalledTimes(1);
  });
});

class ChannelPlugin implements IPlugin {
  public isFlushInvoked = false;
  public isTearDownInvoked = false;
  public isResumeInvoked = false;
  public isPauseInvoked = false;

  constructor() {
    this.processTelemetry = this._processTelemetry.bind(this);
  }
  public pause(): void {
    this.isPauseInvoked = true;
  }

  public resume(): void {
    this.isResumeInvoked = true;
  }

  public teardown(): void {
    this.isTearDownInvoked = true;
  }

  flush(async?: boolean, callBack?: () => void): void {
    this.isFlushInvoked = true;
    if (callBack) {
      callBack();
    }
  }

  public processTelemetry(env: ITelemetryItem) { }

  public identifier = "Sender";

  setNextPlugin(next: any) {
    // no next setup
  }

  public priority: number = 1001;

  public initialize = (config: IConfiguration, core: AppInsightsCore, plugin: IPlugin[]) => {
  }

  private _processTelemetry(env: ITelemetryItem) {

  }
}