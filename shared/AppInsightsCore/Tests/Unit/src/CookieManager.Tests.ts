import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore, createCookieMgr, IAppInsightsCore, IConfiguration, ICookieMgrConfig, IPlugin, ITelemetryItem, newId, objExtend } from "../../../src/applicationinsights-core-js"
import { _eInternalMessageId } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage } from "../../../src/JavaScriptSDK/DiagnosticLogger";

export class CookieManagerTests extends AITestClass {
    private _cookieMgrCfg: ICookieMgrConfig;
    private _config: IConfiguration;
    private _testCookies;

    constructor(emulateIe: boolean) {
        super("CookieManagerTests", emulateIe);
    }

    public testInitialize() {
        let _self = this;
        super.testInitialize();
        _self._testCookies = {};
        _self._cookieMgrCfg = {
            getCookie: (name) => {
                let theValue = _self._testCookies[name] || "";
                return theValue.split(";")[0];
            },
            setCookie: (name, value) => {
                _self._testCookies[name] = value;
            },
            delCookie: (name) => {
                delete _self._testCookies[name]
            }
        }
        _self._config = {
            cookieCfg: _self._cookieMgrCfg
        };
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "CookieManager: Initialization",
            test: () => {
                let manager = createCookieMgr();

                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr(null);
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr(undefined);
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr({});
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr({
                    cookieCfg: null
                });
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr({
                    cookieCfg: undefined
                });
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");

                manager = createCookieMgr({
                    cookieCfg: {}
                });
                Assert.equal("", manager.get("Test"), "Getting a non existent cookie returns empty string");
            }
        });

        this.testCase({
            name: "CookieManager: Session get set delete",
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                manager.set(newKey, newValue + "; path=/my-path");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/my-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Session get set delete with configured path",
            test: () => {
                this._cookieMgrCfg.path = "/sub-path";
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/sub-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                manager.set(newKey, newValue + "; path=/my-path");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/my-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Session get set delete with configured domain",
            test: () => {
                this._cookieMgrCfg.domain = "MyDomain.com";
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Encoded expiry value for get set delete",
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue + "; path=/subfield; expires=Thu, 12 Feb 2190 00:00:00 GMT");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/subfield; expires=Thu, 12 Feb 2190 00:00:00 GMT", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Encoded max-age for get set delete",
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue + "; path=/subfield; max-age=42");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/subfield; max-age=42", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: Test with setting max-age",
            useFakeTimers: true,
            test: () => {
                let manager = createCookieMgr(this._config);

                let newKey = "test." + newId();
                let newValue = newId();
                let maxAge = 42 * 24 * 60 * 60;
                manager.set(newKey, newValue, maxAge);
                Assert.equal(newValue, manager.get(newKey));
                if (this.isEmulatingIe) {
                    Assert.equal(newValue + "; expires=Thu, 12 Feb 1970 00:00:00 GMT; path=/", this._testCookies[newKey]);
                } else {
                    Assert.equal(newValue + "; expires=Thu, 12 Feb 1970 00:00:00 GMT; max-age=" + maxAge + "; path=/", this._testCookies[newKey]);
                }

                // With existing max-age
                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                manager.set(newKey, newValue + "; expires=Thu, 12 Feb 2170 00:00:00 GMT", maxAge);
                Assert.equal(newValue, manager.get(newKey));
                if (this.isEmulatingIe) {
                    Assert.equal(newValue + "; expires=Thu, 12 Feb 2170 00:00:00 GMT; path=/", this._testCookies[newKey]);
                } else {
                    Assert.equal(newValue + "; expires=Thu, 12 Feb 2170 00:00:00 GMT; max-age=" + maxAge + "; path=/", this._testCookies[newKey]);
                }

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });

        this.testCase({
            name: "CookieManager: Set as Disabled",
            test: () => {
                let manager = createCookieMgr({
                    cookieCfg: {
                        enabled: false,
                        getCookie: () => { throw "Should not be called" },
                        setCookie: () => { throw "Should not be called" },
                        delCookie: () => { throw "Should not be called" }
                    }
                });

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
            }
        });

        this.testCase({
            name: "CookieManager: disable cookies using the legacy setting",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    isCookieUseDisabled: true,
                    cookieCfg: {
                        getCookie: () => { throw "Should not be called" },
                        setCookie: () => { throw "Should not be called" },
                        delCookie: () => { throw "Should not be called" }
                    }
                } as any, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
            }
        });        

        this.testCase({
            name: "CookieManager: disable cookies using legacy and new setting both enabled",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    isCookieUseDisabled: true,
                    disableCookiesUsage: true,
                    cookieCfg: {
                        getCookie: () => { throw "Should not be called" },
                        setCookie: () => { throw "Should not be called" },
                        delCookie: () => { throw "Should not be called" }
                    }
                } as any, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
            }
        });        

        this.testCase({
            name: "CookieManager: disable cookies using legacy disabled and new setting enabled",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    isCookieUseDisabled: false,
                    disableCookiesUsage: true,
                    cookieCfg: {
                        getCookie: () => { throw "Should not be called" },
                        setCookie: () => { throw "Should not be called" },
                        delCookie: () => { throw "Should not be called" }
                    }
                } as any, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
            }
        });        

        this.testCase({
            name: "CookieManager: disable cookies using disableCookiesUsage",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    disableCookiesUsage: true,
                    cookieCfg: {
                        getCookie: () => { throw "Should not be called" },
                        setCookie: () => { throw "Should not be called" },
                        delCookie: () => { throw "Should not be called" }
                    }
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();
                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal("", manager.get(newKey));

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
            }
        });

        this.testCase({
            name: "CookieManager: set cookie path at the root config setting",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookiePath: "/sub-path",
                    cookieCfg: this._cookieMgrCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/sub-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                manager.set(newKey, newValue + "; path=/my-path");
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; path=/my-path", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: set cookie domain at the root config setting",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: this._cookieMgrCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });

        this.testCase({
            name: "CookieManager: validate ignore Cookies empty setting",
            test: () => {

                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.ignoreCookies = [];

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: cookieCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });

        this.testCase({
            name: "CookieManager: validate ignore Cookies with a single cookie",
            test: () => {

                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.ignoreCookies = [ "testCookie" ];

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: cookieCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                this._testCookies["testCookie"] = "test value";
                Assert.equal("", manager.get("testCookie"), "Check that it can't read the cookie value");

                manager.set("testCookie", "new value");
                Assert.equal("test value", this._testCookies["testCookie"], "The value was not overwritten");

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });

        this.testCase({
            name: "CookieManager: validate blocked Cookies with a single cookie",
            test: () => {

                let cookieCfg: ICookieMgrConfig = objExtend(true, {}, this._cookieMgrCfg);
                cookieCfg.blockedCookies = [ "testCookie" ];

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: cookieCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                this._testCookies["testCookie"] = "test value";
                Assert.equal("test value", manager.get("testCookie"), "Check that it can't read the cookie value");

                manager.set("testCookie", "new value");
                Assert.equal("test value", this._testCookies["testCookie"], "The value was not overwritten");

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);
            }
        });        

        this.testCase({
            name: "CookieManager: set cookie domain on the core config and update using updateCfg()",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: this._cookieMgrCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                // Update the root cookie Domain using the core update function while there is a cookieCfg.domain
                // The cookieCfg.domain overrides the root domain
                core.updateCfg({
                    cookieDomain: "MyDomain2.com"
                });

                let newKey2 = "test2." + newId();
                let newValue2 = newId();
                manager.set(newKey2, newValue2);
                Assert.equal(newValue2, manager.get(newKey2));
                Assert.equal(newValue2 + "; domain=MyDomain.com; path=/", this._testCookies[newKey2]);

                manager.del(newKey2);
                Assert.equal("", manager.get(newKey2));
                Assert.equal(undefined, this._testCookies[newKey2]);

                // Update the cookie Domain using the core update function without a cookieCfg.domain
                core.config.cookieCfg!.domain = undefined;

                core.updateCfg({
                    cookieDomain: "MyDomain3.com"
                });

                let newKey3 = "test3." + newId();
                let newValue3 = newId();
                manager.set(newKey3, newValue3);
                Assert.equal(newValue3, manager.get(newKey3));
                Assert.equal(newValue3 + "; domain=MyDomain3.com; path=/", this._testCookies[newKey3]);

                manager.del(newKey3);
                Assert.equal("", manager.get(newKey3));
                Assert.equal(undefined, this._testCookies[newKey3]);

                // Set the "domain" from the cookieMgr config -- this should override the domain used
                core.config.cookieCfg!.domain = "CfgCookieDomain.com";

                // Update the cookie Domain using the core update function, this will also cause the notifications to occur synchronously
                core.updateCfg({
                    cookieDomain: "RootDomain3.com"
                });

                let newKey4 = "test3." + newId();
                let newValue4 = newId();
                manager.set(newKey4, newValue4);
                Assert.equal(newValue4, manager.get(newKey4));
                Assert.equal(newValue4 + "; domain=CfgCookieDomain.com; path=/", this._testCookies[newKey4]);

                manager.del(newKey4);
                Assert.equal("", manager.get(newKey4));
                Assert.equal(undefined, this._testCookies[newKey4]);
            }
        });        

        this.testCase({
            name: "CookieManager: set cookie domain at the root config using updateCfg()",
            test: () => {

                let core = new AppInsightsCore();
                core.initialize({
                    instrumentationKey: "testiKey",
                    cookieDomain: "MyDomain.com",
                    cookieCfg: this._cookieMgrCfg
                }, [new ChannelPlugin()]);

                let manager = core.getCookieMgr();

                let newKey = "test." + newId();
                let newValue = newId();
                manager.set(newKey, newValue);
                Assert.equal(newValue, manager.get(newKey));
                Assert.equal(newValue + "; domain=MyDomain.com; path=/", this._testCookies[newKey]);

                manager.del(newKey);
                Assert.equal("", manager.get(newKey));
                Assert.equal(undefined, this._testCookies[newKey]);

                // Update the root cookie Domain using the core update function while there is a cookieCfg.domain
                // The cookieCfg.domain overrides the root domain
                core.updateCfg({
                    cookieDomain: "MyDomain2.com"
                });

                let newKey2 = "test2." + newId();
                let newValue2 = newId();
                manager.set(newKey2, newValue2);
                Assert.equal(newValue2, manager.get(newKey2));
                Assert.equal(newValue2 + "; domain=MyDomain.com; path=/", this._testCookies[newKey2]);

                manager.del(newKey2);
                Assert.equal("", manager.get(newKey2));
                Assert.equal(undefined, this._testCookies[newKey2]);

                core.updateCfg({
                    cookieDomain: "MyDomain3.com",
                    cookieCfg: {
                        // Update the cookie Domain using the core update function without a cookieCfg.domain
                        domain: undefined
                    }
                });

                let newKey3 = "test3." + newId();
                let newValue3 = newId();
                manager.set(newKey3, newValue3);
                Assert.equal(newValue3, manager.get(newKey3));
                Assert.equal(newValue3 + "; domain=MyDomain3.com; path=/", this._testCookies[newKey3]);

                manager.del(newKey3);
                Assert.equal("", manager.get(newKey3));
                Assert.equal(undefined, this._testCookies[newKey3]);

                // Update the cookie Domain using the core update function, this will also cause the notifications to occur synchronously
                core.updateCfg({
                    cookieDomain: "RootDomain3.com",
                    cookieCfg: {
                        // Set the "domain" from the cookieMgr config -- this should override the domain used
                        domain: "CfgCookieDomain.com"
                    }
                });

                let newKey4 = "test3." + newId();
                let newValue4 = newId();
                manager.set(newKey4, newValue4);
                Assert.equal(newValue4, manager.get(newKey4));
                Assert.equal(newValue4 + "; domain=CfgCookieDomain.com; path=/", this._testCookies[newKey4]);

                manager.del(newKey4);
                Assert.equal("", manager.get(newKey4));
                Assert.equal(undefined, this._testCookies[newKey4]);

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
  
    public processTelemetry(env: ITelemetryItem) { }
  
    setNextPlugin(next: any) {
      // no next setup
    }
  
    public initialize = (config: IConfiguration, core: IAppInsightsCore, plugin: IPlugin[]) => {
    }
  
    private _processTelemetry(env: ITelemetryItem) {
  
    }
  }