import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer
} from '@microsoft/sp-application-base';
import { Dialog } from '@microsoft/sp-dialog';

import * as strings from 'AppInsightsApplicationCustomizerStrings';
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

const LOG_SOURCE: string = 'AppInsightsApplicationCustomizer';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface IAppInsightsApplicationCustomizerProperties {
  /* ...Other Configuration Options... */
  instrumentationKey: string;
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class AppInsightsApplicationCustomizer
  extends BaseApplicationCustomizer<IAppInsightsApplicationCustomizerProperties> {

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    const appInsights = new ApplicationInsights({ config: {
        /* ...Other Configuration Options... */
        instrumentationKey: this.properties.instrumentationKey
      } 
    });
    appInsights.loadAppInsights();

    // This is an example; replace with your own authenticatedUserId, accountId, and storeInCookie
    appInsights.setAuthenticatedUserContext("test1username", undefined, true);

    // This is an example; replace with your own telemetry initializer properties field
    var telemetryInitializer = (envelope) => {
      envelope.baseData.properties = envelope.baseData.properties || {};
      envelope.baseData.properties["email"] = "test1@email.com";
    }
    appInsights.addTelemetryInitializer(telemetryInitializer);
    appInsights.trackPageView();

    let message: string = this.properties.instrumentationKey;
    if (!message) {
      message = '(No properties were provided.)';
    }

    Dialog.alert(`Hello from ${strings.Title} - 1:\n\n${message}`);

    return Promise.resolve();
  }
}
