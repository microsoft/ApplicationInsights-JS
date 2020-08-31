import { TestBed, fakeAsync, tick  } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AngularPlugin } from '@microsoft/applicationinsights-angularplugin-js';
import { AppInsightsCore, IConfiguration, DiagnosticLogger, ITelemetryItem, IPlugin } from '@microsoft/applicationinsights-core-js';
import { IPageViewTelemetry } from '@microsoft/applicationinsights-common';

let angularPlugin: AngularPlugin;
let core: AppInsightsCore;
let angularPluginTrackPageViewSpy;

import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { HomeComponent, SearchComponent, AppComponent, routes } from './TestComponent';

describe('Router: App', () => {
  let location: Location;
  let router: Router;
  let fixture;

  function init() {
    core = new AppInsightsCore();
    core.logger = new DiagnosticLogger();
    angularPlugin = new AngularPlugin();
    angularPluginTrackPageViewSpy = spyOn(angularPlugin, 'trackPageView');
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

  it('navigate to "" redirects you to /home', fakeAsync(() => {
    router.navigate(['']).then(() => {
      tick(500);
      expect(location.path()).toBe('/home');
    });
  }));

  it('navigate to "search" takes you to /search', fakeAsync(() => {
    router.navigate(['/search']).then(() => {
      tick(500);
      expect(location.path()).toBe('/search');
    });
  }));

  it('Angular Plugin: router change triggers trackPageView event', fakeAsync(() => {
    init();
    const analyticsExtension = {
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
        identifier: 'ApplicationInsightsAnalytics'
    };
    const channel = new ChannelPlugin();
    const config: IConfiguration = {
        instrumentationKey: 'instrumentation_key',
        extensionConfig: {
        [angularPlugin.identifier]: {
            router
        },
        }
    };
    
    core.initialize(config, [angularPlugin, analyticsExtension, channel]);

    // trackPageView is called on plugin intialize
    // default route is '/'
    expect(angularPluginTrackPageViewSpy).toHaveBeenCalledTimes(1);
    expect(angularPluginTrackPageViewSpy).toHaveBeenCalledWith({ uri: '/' } as IPageViewTelemetry);

    // Simulate navigation to different URL-addressed pages - tick is used to simulate the asynchronous passage of time for the timers in the fakeAsync zone.
    // This equals to .then() and is more clear
    // navigate to / - first time router navigates, this is needed here to simulate user opens up browser, this call simulates the router behavior when core gets initialized
    router.navigate(['/']);
    tick(500);
    // navigate to /search
    router.navigate(['search']);
    tick(500);
    expect(angularPluginTrackPageViewSpy).toHaveBeenCalledTimes(2);
    expect(angularPluginTrackPageViewSpy).toHaveBeenCalledWith({ uri: '/search' } as IPageViewTelemetry);
    // navigate to /home
    router.navigate(['home']);
    tick(500);
    expect(angularPluginTrackPageViewSpy).toHaveBeenCalledTimes(3);
    expect(angularPluginTrackPageViewSpy).toHaveBeenCalledWith({ uri: '/home' } as IPageViewTelemetry);
  }));
});

class ChannelPlugin implements IPlugin {
  public isFlushInvoked = false;
  public isTearDownInvoked = false;
  public isResumeInvoked = false;
  public isPauseInvoked = false;
  public identifier = 'Sender';
  public priority = 1001;

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

  setNextPlugin(next: any) {
      // no next setup
  }

  public initialize = (config: IConfiguration, core: AppInsightsCore, plugin: IPlugin[]) => {
  }

  private _processTelemetry(env: ITelemetryItem) {
  }
}