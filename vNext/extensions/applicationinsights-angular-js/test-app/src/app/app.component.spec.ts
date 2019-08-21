import { TestBed, fakeAsync, tick  } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AngularPlugin, IAngularExtensionConfig } from '@microsoft/applicationinsights-angular-js';
import { AppInsightsCore, IConfiguration, DiagnosticLogger, ITelemetryItem, IPlugin } from "@microsoft/applicationinsights-core-js";
import { IPageViewTelemetry } from "@microsoft/applicationinsights-common";

let angularPlugin: AngularPlugin;
let core: AppInsightsCore;

import { Location } from "@angular/common";
import { Router } from "@angular/router";

import { HomeComponent, SearchComponent, AppComponent, routes } from "./TestComponent";

describe("Router: App", () => {
  let location: Location;
  let router: Router;
  let fixture;

  function init() {
    core = new AppInsightsCore();
    core.logger = new DiagnosticLogger();
    angularPlugin = new AngularPlugin();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(routes)],
      declarations: [HomeComponent, SearchComponent, AppComponent]
    });

    router = TestBed.get(Router);
    location = TestBed.get(Location);

    fixture = TestBed.createComponent(AppComponent);
    router.initialNavigation();
  });

  it("fakeAsync works", fakeAsync(() => {
    let promise = new Promise(resolve => {
      setTimeout(resolve, 10);
    });
    let done = false;
    promise.then(() => (done = true));
    tick(50);
    expect(done).toBeTruthy();
  }));

  it('navigate to "" redirects you to /home', fakeAsync(() => {
    router.navigate([""]).then(() => {
      tick();
      expect(location.path()).toBe("/home");
    });
  }));

  it('navigate to "search" takes you to /search', fakeAsync(() => {
    router.navigate(["/search"]).then(() => {
      tick();
      expect(location.path()).toBe("/search");
    });
  }));

  it("Angular Configuration: Config options can be passed from root config", fakeAsync(() => {
    init();
    angularPlugin.initialize({
      instrumentationKey: 'instrumentation_key',
      extensionConfig: {
        [angularPlugin.identifier]: {
          router: router
        }
      }
    }, core, []);
    const angularConfig: IAngularExtensionConfig = angularPlugin['_extensionConfig'];
    expect(angularConfig.router).toEqual(router);
  }));

  it('Angular Plugin: router change triggers trackPageView event', fakeAsync(() => {
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
        [angularPlugin.identifier]: {
            router: router
        },
        }
    };
    core.initialize(config, [angularPlugin, analyticsExtension, channel]);
    // spy on track
    var spy = spyOn(angularPlugin, "trackPageView");

    // Emulate navigation to different URL-addressed pages
    // navigate to /home
    router.navigate([''])
    .then(() => {
      tick();
      expect(angularPlugin.trackPageView).toHaveBeenCalledTimes(1);
    });
    
    // navigate to /search
    router.navigate(['search'])
    .then(() => {
      tick();
      expect(angularPlugin.trackPageView).toHaveBeenCalledTimes(1);
    });
  }));
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
