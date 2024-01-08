import { IConfig } from "@microsoft/applicationinsights-common";
import { BaseTelemetryPlugin, IAppInsightsCore, IChannelControls, IConfiguration, IPlugin, ITelemetryItem } from "@microsoft/applicationinsights-core-js";

export class TestChannel extends BaseTelemetryPlugin implements IChannelControls  {
    public identifier = 'testplugin';
    public priority: number = 1001;

    lastEventAdded: ITelemetryItem;
    eventsAdded: ITelemetryItem[] = [];
    flushCalled: boolean;
    uploadNowCallback: () => void;
    pauseCalled: boolean;
    resumeCalled: boolean;
    teardownCalled: boolean;

    hasEvents(expectedEvents: any[]) {
        QUnit.assert.ok(expectedEvents.length <= this.eventsAdded.length, 'Checking that at least [' + expectedEvents.length + '] events have been processed');

        let matched = 0;
        expectedEvents.forEach((element) => {
            let found = false;
            for (let lp = 0; lp < this.eventsAdded.length; lp++) {
                let evt = this.eventsAdded[lp] as any;
                if (element.id === evt.id) {
                    matched++;
                    found = true;
                    break;
                }
            }

            QUnit.assert.ok(found, 'Looking for event ' + element.id);
        });

        QUnit.assert.equal(expectedEvents.length, matched, 'Checking all found events');
    }

    initialize(config: IConfig & IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        //No-op
    }

    processTelemetry(event: ITelemetryItem) {
        this.lastEventAdded = <any>event;
        this.eventsAdded.push(this.lastEventAdded);
    }

    pause() {
        this.pauseCalled = true;
    }

    resume() {
        this.resumeCalled = true;
    }

    teardown() {
        this.teardownCalled = true;
    }

    flush(async = true, callback?: () => void) {
        this.flushCalled = true;
    }
}



