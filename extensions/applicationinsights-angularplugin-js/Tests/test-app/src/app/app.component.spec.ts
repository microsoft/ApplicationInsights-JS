import { TestBed, fakeAsync, tick  } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AngularPlugin } from '@microsoft/applicationinsights-angularplugin-js';
import { AppInsightsCore, IConfiguration, DiagnosticLogger } from '@microsoft/applicationinsights-core-js';
import { IPageViewTelemetry } from '@microsoft/applicationinsights-common';
import { ChannelPlugin, analyticsExtension } from './Common';

let angularPlugin: AngularPlugin;
let core: AppInsightsCore;
let angularPluginTrackPageViewSpy;
let angularPluginTrackMetricSpy;

import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { HomeComponent, SearchComponent, AppComponent, routes } from './TestComponent';

describe('Angular Plugin basic events tracking tests', () => {
  let location: Location;
  let router: Router;
  let fixture;

  function init() {
    core = new AppInsightsCore();
    core.logger = new DiagnosticLogger();
    angularPlugin = new AngularPlugin();
    fixture.componentInstance.angularPluginService.init(angularPlugin, router);
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
    angularPluginTrackPageViewSpy = spyOn(angularPlugin, 'trackPageView');
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

  it('Angular Plugin: component destroy triggers trackMetrics event', fakeAsync(() => {
    init();
    angularPluginTrackMetricSpy = spyOn(angularPlugin, 'trackMetric');
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

    // navigate to / - first time router navigates, home component is added
    router.navigate(['/']);
    tick(500);
    // navigate to /search, home component is destroyed
    router.navigate(['search']);
    tick(500);
    expect(angularPluginTrackMetricSpy).toHaveBeenCalledTimes(1);
    expect(angularPluginTrackMetricSpy).toHaveBeenCalledWith({average: 500, name: 'Angular Component Existed Time (seconds)'}, {'Component Name': 'HomeComponent'});
    // navigate to /home, search component is destroyed
    router.navigate(['home']);
    tick(500);
    expect(angularPluginTrackMetricSpy).toHaveBeenCalledTimes(2);
    expect(angularPluginTrackMetricSpy).toHaveBeenCalledWith({average: 500, name: 'Angular Component Existed Time (seconds)'}, {'Component Name': 'SearchComponent'});
  }));
});
