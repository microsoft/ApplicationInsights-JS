/**
 * @copyright Microsoft 2020
 */

/// <reference path="./TestFramework/Common.ts" />

import { Util, IConfig } from "@microsoft/applicationinsights-common";
import { ITelemetryItem, AppInsightsCore, IPlugin, IConfiguration, DiagnosticLogger} from '@microsoft/applicationinsights-core-js';
import { ClickAnalyticsPlugin } from '../src/ClickAnalyticsPlugin';
import { PageAction } from "../src/events/PageAction";
import { DomContentHandler } from '../src/handlers/DomContentHandler';
import { IPageActionOverrideValues } from '../src/Interfaces/Datamodel'
import { _mergeConfig } from "../src/common/Utils";




export class ClickEventTest extends TestClass {
    public testInitialize() {
        this.clock.reset();
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public registerTests() {
        this.testCase({
            name: "PageAction properties are correctly assigned (Empty)",
            test: () => {
                let config = {
                    coreData: {},
                    callback: {
                        pageActionPageTags: () => ({ key2: "value2" })
                    },
                    dataTags : {
                        useDefaultContentName : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob',
                        parentDataTag: 'parent',
                        donotTrackDataTag: 'donotTrack'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(_mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, _mergeConfig(config), contentHandler, config.callback.pageActionPageTags, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                
                const element = document.createElement('a');
                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');   
                // clickAnalyticsPlugin.capturePageAction(element, {} as IOverrideValues, {}, false);
                pageAction.capturePageAction(element);
                Assert.equal(true, spy.called);
                let calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.notEqual(-1, calledEvent.baseData["uri"].indexOf("Tests.html"),);
                Assert.equal(0,calledEvent.baseData["behavior"],);
                Assert.equal(undefined, calledEvent.baseData["actionType"],);
                Assert.equal("[{}]", calledEvent.baseData["content"]);
                Assert.equal(false, isNaN(calledEvent.data["timeToAction"] as number));
                Assert.equal("value2", calledEvent.baseData["properties"]["pageTags"].key2);
            }

        });

        this.testCase({
            name: "PageAction properties are correctly assigned (Overrides)",
            test: () => {
                const overrides: IPageActionOverrideValues = {
                    actionType: "overrideActionType",
                    contentTags: { 'testTag': 'testValue' },
                    refUri: "overrideReferrerUri",
                    behavior: 2
                };
                const config = {
                    coreData: {},
                    autoCapture: false,
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(_mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, _mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);
                const element = document.createElement('a');
                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                this.clock.tick(500);  
                // clickAnalyticsPlugin.capturePageAction(element, overrides, { customProperty: { customNextedProperty: "test" } });
                pageAction.capturePageAction(element, overrides, { customProperty: { customNextedProperty: "test" } });
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal("overrideActionType", calledEvent.baseData["actionType"]);
                Assert.equal('[{"testTag":"testValue"}]', calledEvent.baseData["content"]);
                Assert.equal(2, calledEvent.baseData["behavior"]);
                Assert.equal("overrideReferrerUri", calledEvent.data["refUri"]);
                Assert.equal("test", calledEvent.data["customProperty"]["customNextedProperty"]);
            }

        });

        this.testCase({
            name: "PageAction properties are correctly assigned (Populated)",
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentName : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(_mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, _mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id","testId")
                element.setAttribute("data-ha-aN", "testAn");
                element.setAttribute("data-ha-sN", "testsN");
                element.setAttribute("data-ha-cS", "testcS");
                element.setAttribute("data-ha-tN", "testtN");
                element.setAttribute("data-ha-pid", "testpid");
                element.setAttribute("data-ha-cT", "testcT");
                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                    id: "testId",
                    contentName: "testContentName",
                    an: "testAn",
                    sn: "testsN",
                    cs: "testcS",
                    tn: "testtN",
                    pid: "testpid",
                    ct: "testcT"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent: ITelemetryItem = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.baseData["content"]);
            }
        });

        // pageAction - clicked element has no tags, walk up the DOM to find the closest element with tags for tracking recognized as same element
        this.testCase({
            name: "PageAction properties are correctly populated when parent element has data tags",
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentName : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(_mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, _mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id", "testId")
                const parentElement = document.createElement('div');
                parentElement.setAttribute("data-ha-id", "testParentId");
                parentElement.setAttribute("data-ha-name", "testParentName");
                parentElement.appendChild(element);
                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    id:"testParentId",
                    contentName: "testContentName",
                    name: "testParentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.baseData["content"]);
            }
        });
        
        // upper element has no tags, continue walk up the DOM to find grand parent element's info
        this.testCase({
            name: "PageAction: element and its upper element does not have any tags, so grand parent element is recognize as under one area, no parent info is populated.",
            test: () => {
                const config = {
                    callback: {
                        contentName: () => "testContentName"                  
                    },
                    dataTags : {
                        useDefaultContentName : true,
                        customDataPrefix: 'data-ha-',
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(_mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, _mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id", "testId")
                const parentElement = document.createElement('div');
                parentElement.setAttribute("id", "testParentId");
                parentElement.appendChild(element);
                const grandParentElement = document.createElement('div');
                grandParentElement.setAttribute("data-ha-id", "testGrandParentId");
                grandParentElement.setAttribute("data-ha-name", "testGrandParentName");
                grandParentElement.appendChild(parentElement);

                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    id:"testGrandParentId",
                    contentName: "testContentName",
                    name: "testGrandParentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.baseData["content"]);
            }
        });

        // no data tags found, do not populate any data except the id
        this.testCase({
            name: "PageAction: no parentId or parentName data is found",
            test: () => {
                const config = {
                    dataTags : {
                        useDefaultContentName : true,
                        customDataPrefix: 'data-ha-',
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(_mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, _mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("id", "testId")
                const parentElement = document.createElement('div');
                parentElement.setAttribute("id", "testParentId");
                parentElement.appendChild(element);
                const grandParentElement = document.createElement('div');
                grandParentElement.setAttribute("id", "testGrandParentId");
                grandParentElement.appendChild(parentElement);

                ((element) as HTMLBaseElement).href = "testClickTarget";

                var expectedContent = JSON.stringify([{
                    id: "testId"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.baseData["content"]);
            }
        });

        // element use data-ha-blob
        this.testCase({
            name: "Element uses data* blob ",
            test: () => {
                const config = {
                    dataTags : {
                        useDefaultContentName : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(_mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, _mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("data-ha-id", "testId");
                element.setAttribute("data-ha-blob", '{"id":"parentTestId","aN":"areaTestName","sN":"slotTestName","cN":"contentTestName", "pI":"parentIdSelfDefined", "pN":"parentNameSelfDefined"}');
                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    id: "parentTestId",
                    aN: "areaTestName",
                    sN: "slotTestName",
                    cN: "contentTestName",
                    pI: "parentIdSelfDefined",
                    pN: "parentNameSelfDefined"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.baseData["content"]);
            }
        });

        // parent element use data-ha-blob
        this.testCase({
            name: "Parent Element uses data* blob ",
            test: () => {
                const config = {
                    dataTags : {
                        useDefaultContentName : true,
                        metaDataPrefix:'ha-',
                        customDataPrefix: 'data-ha-',
                        aiBlobAttributeTag: 'blob'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(_mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, _mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');  
                const parentElement = document.createElement('div');
                parentElement.setAttribute("id", "testParentId");
                parentElement.setAttribute("data-ha-blob", '{"id":"parentTestId","aN":"areaTestName","sN":"slotTestName","cN":"contentTestName", "pI":"parentIdSelfDefined", "pN":"parentNameSelfDefined"}');
                parentElement.appendChild(element);
                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    id: "parentTestId",
                    aN: "areaTestName",
                    sN: "slotTestName",
                    cN: "contentTestName",
                    pI: "parentIdSelfDefined",
                    pN: "parentNameSelfDefined"
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.baseData["content"]);
            }
        });

         // parent element use data-ha-parent, donot populate data from grandparent
        this.testCase({
            name: "Parent element use data-ha-parent, donot populate data from grandparent",
            test: () => {
                const config = {
                    dataTags : {
                        useDefaultContentName : true,
                        customDataPrefix: 'data-ha-',
                        parentDataTag: 'parent'
                    }
                };
                const clickAnalyticsPlugin = new ClickAnalyticsPlugin();
                const core = new AppInsightsCore();
                const channel = new ChannelPlugin();
                const traceLogger = new DiagnosticLogger({ loggingLevelConsole: 1 } as any);
                const contentHandler = new DomContentHandler(_mergeConfig(config), traceLogger);
                const pageAction = new PageAction(clickAnalyticsPlugin, _mergeConfig(config), contentHandler, null, {}, traceLogger );
                core.initialize({
                    instrumentationKey: 'testIkey',
                    extensionConfig : {
                        [clickAnalyticsPlugin.identifier] : config
                    }
                } as IConfig & IConfiguration, [clickAnalyticsPlugin, channel]);

                let spy = this.sandbox.spy(clickAnalyticsPlugin.core, 'track');
                const element = document.createElement('a');
                element.setAttribute("data-ha-id", "testId");
                const parentElement = document.createElement('div');
                parentElement.setAttribute("data-ha-parentid", "testParentId");
                parentElement.setAttribute("data-ha-name", "testParentName");
                parentElement.appendChild(element);
                const grandParentElement = document.createElement('div');
                grandParentElement.setAttribute("data-ha-grandparent-id", "testGrandParentId");
                grandParentElement.setAttribute("data-ha-grandparent-name", "testGrandParentName");
                grandParentElement.appendChild(parentElement);

                ((element) as HTMLBaseElement).href = "testClickTarget";
                var expectedContent = JSON.stringify([{
                    id:"testId",
                    parentid: "testParentId",
                    name: "testParentName",
                }]);
                // clickAnalyticsPlugin.capturePageAction(element);
                pageAction.capturePageAction(element);
                this.clock.tick(500);
                Assert.equal(true, spy.called);
                var calledEvent = spy.getCall(0).args[0];
                Assert.equal(expectedContent, calledEvent.baseData["content"]);
            }
        });
    }
}

class ChannelPlugin implements IPlugin {

    public isFlushInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    public identifier = "Sender";

    public priority: number = 1001;

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

    public processTelemetry(env: ITelemetryItem) {}

    setNextPlugin(next: any) {
        // no next setup
    }

    public initialize = (config: IConfiguration, core: AppInsightsCore, plugin: IPlugin[]) => {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}
