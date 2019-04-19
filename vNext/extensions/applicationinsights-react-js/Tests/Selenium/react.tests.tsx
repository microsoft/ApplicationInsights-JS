/// <reference path='../TestFramework/Common.ts' />

import { AppInsightsCore, IConfiguration, DiagnosticLogger, ITelemetryItem, IPlugin } from "@microsoft/applicationinsights-core-js";
import ReactPlugin from "../../src/ReactPlugin";
import withAITracking from "../../src/withAITracking";
import { IReactExtensionConfig } from "../../src/Interfaces/IReactExtensionConfig";
import { createMemoryHistory } from 'history';
import { ApplicationInsights } from "@microsoft/applicationinsights-analytics-js";
import { IPageViewTelemetry } from "@microsoft/applicationinsights-common";
import { TestComponent } from "./TestComponent";
import * as React from "react";

export class ReactTests extends TestClass {
    private reactPlugin: ReactPlugin;
    private core: AppInsightsCore;
    private reactSpy: SinonSpy;
    private coreSpy: SinonSpy;
    private loggerSpy: SinonSpy;
    private TestComponentWithTracking: any;
    private trackedTestComponentWrapper: any;

    public testInitialize() {
        //configure({ adapter: new Adapter.default() });

        this.useFakeServer = false;
        this.useFakeTimers = false;
        this.clock.restore();
        this.core = new AppInsightsCore();
        this.core.logger = new DiagnosticLogger();
        this.reactPlugin = new ReactPlugin();
        this.TestComponentWithTracking = withAITracking(this.reactPlugin, TestComponent);
    }

    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
        this.core = null;
        this.reactPlugin = null;
    }

    public registerTests() {
        this.addReactTests();
    }

    private addReactTests() {
        this.testCase({
            name: 'React Configuration: Config options can be passed from root config',
            test: () => {
                const history = createMemoryHistory();
                this.reactPlugin.initialize({
                    instrumentationKey: 'instrumentation_key',
                    extensionConfig: {
                        [this.reactPlugin.identifier]: {
                            history: history
                        }
                    }
                }, this.core, []);
                const config: IReactExtensionConfig = this.reactPlugin['_extensionConfig'];
                Assert.equal(history, config.history, 'Extension configs can be set via root config (history)');
            }
        });

        this.testCaseAsync({
            name: "React PageView using Analytics plugin",
            stepDelay: 8000,
            steps: [
                () => {
                    const history = createMemoryHistory();
                    let analyticsExtension = new ApplicationInsights();
                    let channel = new ChannelPlugin();
                    let config: IConfiguration = {
                        instrumentationKey: 'instrumentation_key',
                        extensionConfig: {
                            [this.reactPlugin.identifier]: {
                                history: history
                            },
                            [analyticsExtension.identifier]: {

                            }
                        }
                    };
                    this.core.initialize(config, [this.reactPlugin, analyticsExtension, channel]);
                    this.coreSpy = this.sandbox.spy(this.core, 'track');
                    history.push("/home");
                }]
                .concat(() => {
                    // Assert
                    QUnit.assert.equal(this.coreSpy.called, true);
                    // First two calls are PageView and PVP triggered by Analytics plugin
                    var calledEvent: ITelemetryItem = this.coreSpy.getCall(2).args[0];
                    QUnit.assert.equal(calledEvent.baseType, "PageviewData");
                    QUnit.assert.equal(calledEvent.baseData["uri"], "/home");
                    QUnit.assert.equal(calledEvent.baseData["name"], "Tests for Application Insights JavaScript API");
                })
        });

        this.testCaseAsync({
            name: "React PageView when location change",
            stepDelay: 5000,
            steps: [
                () => {
                    const history = createMemoryHistory();
                    let analyticsExtension = new ApplicationInsights();
                    let channel = new ChannelPlugin();
                    let config: IConfiguration = {
                        instrumentationKey: 'instrumentation_key',
                        extensionConfig: {
                            [this.reactPlugin.identifier]: {
                                history: history
                            }
                        }
                    };
                    this.core.initialize(config, [this.reactPlugin, analyticsExtension, channel]);
                    this.reactSpy = this.sandbox.spy(this.reactPlugin, 'trackPageView');
                    history.push("/home");
                    history.push("/newPage");
                }]
                .concat(() => {
                    // Assert
                    QUnit.assert.equal(this.reactSpy.calledTwice, true);
                    var calledEvent: IPageViewTelemetry = this.reactSpy.getCall(0).args[0];
                    QUnit.assert.equal(calledEvent.name, "Tests for Application Insights JavaScript API");
                    QUnit.assert.equal(calledEvent.uri, "/home");
                    calledEvent = this.reactSpy.getCall(1).args[0];
                    QUnit.assert.equal(calledEvent.name, "Tests for Application Insights JavaScript API");
                    QUnit.assert.equal(calledEvent.uri, "/newPage");
                })
        });

        this.testCaseAsync({
            name: 'React plugin with Analytics not available',
            stepDelay: 5000,
            steps: [
                () => {
                    const history = createMemoryHistory();
                    let channel = new ChannelPlugin();
                    let config: IConfiguration = {
                        instrumentationKey: 'instrumentation_key',
                        extensionConfig: {
                            [this.reactPlugin.identifier]: {
                                history: history
                            }
                        }
                    };
                    this.core.initialize(config, [this.reactPlugin, channel]);
                    this.loggerSpy = this.sandbox.spy(this.reactPlugin["_logger"], 'throwInternal');
                    history.push("/home");
                }]
                .concat(() => {
                    QUnit.assert.equal(this.loggerSpy.called, true);
                })
        });

    }
}

export function runTests() {
    new ReactTests().registerTests();
}

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