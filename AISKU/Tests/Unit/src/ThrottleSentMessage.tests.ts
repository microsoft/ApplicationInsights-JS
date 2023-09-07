import { ApplicationInsights, IApplicationInsights, IConfig, IConfiguration, LoggingSeverity, _eInternalMessageId } from '../../../src/applicationinsights-web'
import { AITestClass, Assert} from '@microsoft/ai-test-framework';
import { IThrottleInterval, IThrottleLimit, IThrottleMgrConfig } from '@microsoft/applicationinsights-common';
import { safeGetLogger } from '@microsoft/applicationinsights-core-js';
import { SinonSpy } from 'sinon';


export class ThrottleSentMessage extends AITestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';

    private _ai: IApplicationInsights;
    private getAi: ApplicationInsights;

    private loggingSpy: SinonSpy;
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${ThrottleSentMessage._instrumentationKey}`;

    private delay = 100;
    private _config: IConfiguration | IConfig;

    constructor() {
        super("ThrottleSentMessage");
    }

   

    protected _getTestConfig() {
        let tconfig = {
            disabled: false,
            limit: {
                samplingRate: 1000000,
                maxSendNumber:100
            } as IThrottleLimit,
            interval: {
                monthInterval: 1,
                dayInterval: undefined
            } as IThrottleInterval
        } as IThrottleMgrConfig;
        let config: IConfiguration | IConfig = {
            instrumentationKey: ThrottleSentMessage._instrumentationKey,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 2500,
            disableExceptionTracking: false,
            enableCorsCorrelation: true,
            samplingPercentage: 50,
            convertUndefined: "test-value",
            disablePageUnloadEvents: [ "beforeunload" ],
            throttleMgrCfg: {
                [_eInternalMessageId.InstrumentationKeyDeprecation as number]:tconfig
            },
            messageSwitch: {"disableIkeyDeprecationMessage": true}
        };

        return config;
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._config = this._getTestConfig();

            const init = new ApplicationInsights({
                config: this._config
            });
          
            
            this._ai = init.loadAppInsights();
            this.getAi = init;

            let core = this._ai['core'];
            let coreLogger = core.logger;
            this.loggingSpy = this.sandbox.stub(coreLogger, 'throwInternal');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai && this._ai.unload) {
            // force unload
            this._ai.unload(false);
        }
    }

    public registerTests() {
        this.messageSentTests();
        // this.addAsyncTests();
    }

    public messageSentTests(): void {
        this.testCase({
            name: "ThrottleSentMessage: Message is sent when user use connection string",
            useFakeTimers: true,
            test: () => {
                Assert.ok(this._ai, 'ApplicationInsights SDK exists');
                Assert.ok(this._ai.appInsights, 'App Analytics exists');
                Assert.equal(true, this._ai.appInsights.isInitialized(), 'App Analytics is initialized');

                Assert.ok(this._ai.appInsights.core, 'Core exists');
                Assert.equal(true, this._ai.appInsights.core.isInitialized(),
                    'Core is initialized');

                let config = this.getAi.config;
                config.messageSwitch = {"disableIkeyDeprecationMessage": false};
                this.clock.tick(1);
                Assert.ok(this.loggingSpy.called);
                Assert.equal(_eInternalMessageId.InstrumentationKeyDeprecation, this.loggingSpy.args[0][1]);
                Assert.equal("Instrumentation key support will end soon, see aka.ms/IkeyMigrate", this.loggingSpy.args[0][2]);

            }
        });
        this.testCase({
            name: "ThrottleSentMessage: Message will not be sent when user turn off message",
            useFakeTimers: true,
            test: () => {
                Assert.ok(this._ai, 'ApplicationInsights SDK exists');
                Assert.ok(this._ai.appInsights, 'App Analytics exists');
                Assert.equal(true, this._ai.appInsights.isInitialized(), 'App Analytics is initialized');

                Assert.ok(this._ai.appInsights.core, 'Core exists');
                Assert.equal(true, this._ai.appInsights.core.isInitialized(),
                    'Core is initialized');

                let config = this.getAi.config;
                config.messageSwitch = {"disableIkeyDeprecationMessage": true};
                this.clock.tick(1);
                Assert.equal(this.loggingSpy.callCount, 0);
            }
        });
    }
}