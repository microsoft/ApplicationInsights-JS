/// <reference path="../TestFramework/TestClass.ts" />

import { AppInsightsCore, IConfiguration, DiagnosticLogger, ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import PropertiesPlugin from "../../src/PropertiesPlugin";
import { ITelemetryConfig } from "../../src/Interfaces/ITelemetryConfig";
import { Util, IWeb } from "@microsoft/applicationinsights-common";
import { TelemetryContext } from "../../src/TelemetryContext";
import { _SessionManager } from "../../src/Context/Session";
import { TelemetryTrace } from "../../src/Context/TelemetryTrace";

export class PropertiesTests extends TestClass {
    private properties: PropertiesPlugin;
    private core: AppInsightsCore;

    public testInitialize() {
        this.core = new AppInsightsCore();
        this.core.logger = new DiagnosticLogger();
        this.properties = new PropertiesPlugin();
    }

    public testCleanup() {
        this.core = null;
        this.properties = null;
    }

    public registerTests() {
        this.addConfigTests();
        this.addUserTests();
        this.addDeviceTests();
        this.addTelemetryTraceTests();
    }

    private addTelemetryTraceTests() {
        this.testCase({
            name: 'Trace: default operation.name is grabbed from window pathname, if available',
            test: () => {
                const operation = new TelemetryTrace();
                Assert.ok(operation.name);
            }
        });
    }

    private addConfigTests() {
        this.testCase({
            name: 'Properties Configuration: Config options can be passed from root config',
            test: () => {
                this.properties.initialize({
                    instrumentationKey: 'instrumentation_key',
                    accountId: 'abc',
                    samplingPercentage: 15,
                    sessionExpirationMs: 99999,
                    extensionConfig: {
                        [this.properties.identifier]: {
                            sessionExpirationMs: 88888
                        }
                    }
                }, this.core, []);
                const config: ITelemetryConfig = this.properties['_extensionConfig'];
                Assert.equal(15, config.samplingPercentage(), 'Extension configs can be set via root config (number)');
                Assert.equal('abc', config.accountId(), 'Extension configs can be set via root config (string)');
                Assert.equal(88888, config.sessionExpirationMs(), 'Root config does not override extensionConfig field when both are present')
                Assert.notEqual(99999, config.sessionExpirationMs(), 'extensionConfig overrides root config field when both are present');
            }

        });
    }

    private addDeviceTests() {
        this.testCase({
            name: 'Device: device context adds Browser field to ITelemetryItem',
            test: () => {
                this.properties.initialize({
                    instrumentationKey: 'key',
                    extensionConfig: {}
                }, this.core, []);
                this.properties.context.user.isNewUser = false;
                // Act
                const item: ITelemetryItem = {name: 'item'};
                this.properties.processTelemetry(item);

                // Assert
                Assert.equal("Browser", item.ext.device.deviceClass);
                Assert.equal("browser", item.ext.device.localId);
            }
        });
    }

    private addUserTests() {
        this.testCase({
            name: 'User: user context initializes from cookie when possible',
            test: () => {
                // setup
                const id = "someUserId";
                var cookieStub = this.sandbox.stub(Util, "getCookie", () => id + "||||");

                // Act
                Assert.ok(cookieStub.notCalled, 'Cookie not yet grabbed');
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                Assert.ok(cookieStub.called, 'Cookie grabbed');

                // Assert
                Assert.equal(id, this.properties.context.user.id, 'user id was set from cookie');
            }
        });

        this.testCase({
            name: 'User: track is triggered if user context is first time initialized',
            test: () => {
                // setup
                var setCookieStub = this.sandbox.stub(Util, "setCookie", () => {});
                var loggingStub = this.sandbox.stub(this.core.logger, "logInternalMessage");

                // Act
                Assert.ok(setCookieStub.notCalled, 'Cookie not yet generated');
                Assert.ok(loggingStub.notCalled, 'logInternalMessage is not yet triggered');
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                Assert.ok(setCookieStub.called, 'Cookie generated');

                // Assert
                Assert.equal(true, this.properties.context.user.isNewUser, 'current user is a new user');
                const item: ITelemetryItem = {name: 'item'};
                this.properties.processTelemetry(item);
                // this.clock.tick(1000);
                Assert.ok(loggingStub.called, 'logInternalMessage is triggered');
                Assert.equal(false, this.properties.context.user.isNewUser, 'current user is not new user with ai_user cookie set')
            }
        });

        this.testCase({
            name: "ai_user cookie is set with acq date and year expiration",
            test: () => {
                // setup
                var actualCookieName: string;
                var actualCookieValue: string;
                var newIdStub = this.sandbox.stub(Util, "newId", () => "newId");
                var getCookieStub = this.sandbox.stub(Util, "getCookie", () => "");
                var setCookieStub = this.sandbox.stub(Util, "setCookie", (logger, cookieName, cookieValue) => {
                    actualCookieName = cookieName;
                    actualCookieValue = cookieValue;
                });

                // act
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                // verify
                Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                var cookieValueParts = actualCookieValue.split(';');

                Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                Assert.equal("newId", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                Assert.equal(new Date().toString(), (new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");

                var expiration = cookieValueParts[1];
                Assert.equal(true, expiration.substr(0, "expires=".length) === "expires=", "ai_user cookie expiration part should start with expires=");
                var expirationDate = new Date(expiration.substr("expires=".length));
                Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");
            }
        });

        this.testCase({
            name: "ai_user cookie is set with acq date and year expiration",
            test: () => {
                // setup
                var id = "userId"
                var actualCookieName: string;
                var actualCookieValue: string;
                var newIdStub = this.sandbox.stub(Util, "newId", () => "newId");
                var getCookieStub = this.sandbox.stub(Util, "getCookie", () => "");
                var setCookieStub = this.sandbox.stub(Util, "setCookie", (logger, cookieName, cookieValue) => {
                    actualCookieName = cookieName;
                    actualCookieValue = cookieValue;
                });

                // act
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                // verify
                Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                var cookieValueParts = actualCookieValue.split(';');

                Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                Assert.equal("newId", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                Assert.equal(new Date().toString(), (new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");

                var expiration = cookieValueParts[1];
                Assert.equal(true, expiration.substr(0, "expires=".length) === "expires=", "ai_user cookie expiration part should start with expires=");
                var expirationDate = new Date(expiration.substr("expires=".length));
                Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");
            }
        });

        this.testCase({
            name: "Ctor: auth and account id initialize from cookie",
            test: () => {
                // setup
                var authId = "bla@bla.com";
                var accountId = "Contoso";

                var cookieStub = this.sandbox.stub(Util, "getCookie", () => authId + "|" + accountId);

                // act
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                // verify
                Assert.equal(authId, this.properties.context.user.authenticatedId, "user auth id was set from cookie");
                Assert.equal(accountId, this.properties.context.user.accountId, "user account id was not set from cookie");
            }
        });

        this.testCase({
            name: "Ctor: auth id initializes from cookie (without account id)",
            test: () => {
                // setup
                var authId = "bla@bla.com";
                var cookieStub = this.sandbox.stub(Util, "getCookie", () => authId);

                // act
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                // verify
                Assert.equal(authId, this.properties.context.user.authenticatedId, "user auth id was set from cookie");
            }
        });

        this.testCase({
            name: "Ctor: auth user context handles empty cookie",
            test: () => {
                // setup
                var cookieStub = this.sandbox.stub(Util, "getCookie", () => "");

                // act
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                // verify
                Assert.equal(undefined, this.properties.context.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.context.user.accountId, "user account id was not set");
            }
        });

        this.testCase({
            name: "Ctor: auth user context handles empty cookie with accountId backward compatibility",
            test: () => {
                // setup
                var config = this.getEmptyConfig();
                config.extensionConfig.AppInsightsPropertiesPlugin.accountId = "account17";

                var cookieStub = this.sandbox.stub(Util, "getCookie", () => null);

                // act
                this.properties.initialize(config, this.core, []);

                // verify
                Assert.equal(config.extensionConfig.AppInsightsPropertiesPlugin.accountId, this.properties.context.user.accountId, "user account id was set from back compat");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: auth id and account id is set (not in the cookie)",
            test: () => {
                // setup
                var authAndAccountId = ['bla@bla.com', 'contoso'];
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                var cookieStub = this.sandbox.stub(Util, "setCookie");

                // act
                this.properties.context.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal('bla@bla.com', this.properties.context.user.authenticatedId, "user auth id was not set");
                Assert.equal('contoso', this.properties.context.user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: auth user set in cookie without account id",
            test: () => {
                // setup
                var authAndAccountId = ["bla@bla.com"];
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                // act
                this.properties.context.user.setAuthenticatedUserContext(authAndAccountId[0], null, true);

                // verify
                Assert.equal(authAndAccountId[0], this.properties.context.user.authenticatedId, "user auth id was set");
                Assert.equal(cookieStub.calledWithExactly(this.core.logger, 'ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id and account id cookie was set");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: auth user and account id set in cookie ",
            test: () => {
                // setup
                var authAndAccountId = ['bla@bla.com', 'contoso'];
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                // act
                this.properties.context.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);

                // verify
                Assert.equal(authAndAccountId[0], this.properties.context.user.authenticatedId, "user auth id was set");
                Assert.equal(cookieStub.calledWithExactly(this.core.logger, 'ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id cookie was set");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles only auth user id correctly",
            test: () => {
                // setup
                var authAndAccountId = ['bla@bla.com'];
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                // act
                this.properties.context.user.setAuthenticatedUserContext(authAndAccountId[0], null, true);

                // verify
                Assert.equal(authAndAccountId[0], this.properties.context.user.authenticatedId, "user auth id was set");
                Assert.equal(null, this.properties.context.user.accountId, "user account id was not set");
                Assert.equal(cookieStub.calledWithExactly(this.core.logger, 'ai_authUser', encodeURI(authAndAccountId[0]), null), true, "user auth id cookie was set");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles null correctly",
            test: () => {
                // setup
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                var loggingStub = this.sandbox.stub(this.core.logger, "throwInternal");
                cookieStub.reset();
                loggingStub.reset();

                // act
                this.properties.context.user.setAuthenticatedUserContext(null);

                // verify
                Assert.equal(undefined, this.properties.context.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.context.user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles undefined correctly",
            test: () => {
                // setup
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                var loggingStub = this.sandbox.stub(this.core.logger, "throwInternal");
                cookieStub.reset();
                loggingStub.reset();

                // act
                this.properties.context.user.setAuthenticatedUserContext(undefined, undefined);

                // verify
                Assert.equal(undefined, this.properties.context.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.context.user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles only accountID correctly",
            test: () => {
                // setup
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                var loggingStub = this.sandbox.stub(this.core.logger, "throwInternal");
                cookieStub.reset();
                loggingStub.reset();

                // act
                this.properties.context.user.setAuthenticatedUserContext(undefined, '1234');

                // verify
                Assert.equal(undefined, this.properties.context.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.context.user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles authId special characters correctly",
            test: () => {
                // setup
                var authAndAccountId = ['my|||special;id', '1234'];
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                var loggingStub = this.sandbox.stub(this.core.logger, "throwInternal");

                // act
                this.properties.context.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);

                // verify
                Assert.equal(undefined, this.properties.context.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.context.user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles accountId special characters correctly",
            test: () => {
                // setup
                var authAndAccountId = ['myid', '1234 5678'];
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                this.properties.context.user.clearAuthenticatedUserContext();
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                var loggingStub = this.sandbox.stub(this.core.logger, "throwInternal");

                // act
                this.properties.context.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal(undefined, this.properties.context.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.context.user.accountId, "user account id was not set");
                Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
            }
        });

        this.testCase({
            name: "setAuthenticatedUserContext: handles non-ascii unicode characters correctly",
            test: () => {
                // setup
                var authAndAccountId = ["\u05D0", "\u05D1"]; // Hebrew characters
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                var loggingStub = this.sandbox.stub(this.core.logger, "throwInternal");

                // act
                this.properties.context.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);

                // verify
                Assert.equal(authAndAccountId[0], this.properties.context.user.authenticatedId, "user auth id was set");
                Assert.equal(authAndAccountId[1], this.properties.context.user.accountId, "user account id was set");
                Assert.equal(cookieStub.calledWithExactly(this.core.logger, 'ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id cookie was set");
                Assert.equal(loggingStub.notCalled, true, "No warnings");
            }
        });

        this.testCase({
            name: "clearAuthenticatedUserContext: auth user and account cleared in context and cookie ",
            test: () => {
                // setup
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                this.properties.context.user.setAuthenticatedUserContext("bla", "123");
                var cookieStub = this.sandbox.stub(Util, "deleteCookie");

                // act
                this.properties.context.user.clearAuthenticatedUserContext();

                // verify
                Assert.equal(undefined, this.properties.context.user.authenticatedId, "user auth id was cleared");
                Assert.equal(undefined, this.properties.context.user.accountId, "user account id was cleared");
                Assert.equal(cookieStub.calledWithExactly(this.core.logger, 'ai_authUser'), true, "cookie was deleted");
            }
        });

        this.testCase({
            name: "clearAuthenticatedUserContext: works correctly when auth id and account id were never set",
            test: () => {
                // setup
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                var cookieStub = this.sandbox.stub(Util, "deleteCookie");

                // act
                this.properties.context.user.clearAuthenticatedUserContext();

                // verify
                Assert.equal(undefined, this.properties.context.user.authenticatedId, "user auth id was cleared");
                Assert.equal(undefined, this.properties.context.user.accountId, "user account id was cleared");
                Assert.equal(cookieStub.calledWithExactly(this.core.logger, 'ai_authUser'), true, "cookie was deleted");
            }
        });

        this.testCase({
            name: "Validate telemetrycontext sets up web extension properties on TelemetryItem",
            test: () => {
                // setup
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                let context = new TelemetryContext(this.core.logger, this.getTelemetryConfig());
                context.web = <IWeb> {
                    domain: "www.bing.com",
                    userConsent: true,
                    screenRes: "1024x768",
                    browser: "internet explorer",
                    browserVer: "48.0",
                    isManual: true,
                    browserLang: "EN"
                };

                let telemetyItem: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {},
                    baseType: "RemoteDependencyData",
                    baseData: {
                        id: 'some id',
                        name: "/test/name",
                        success: true,
                        responseCode: 200,
                        duration: 123,
                        type: 'Fetch',
                        data: 'some data',
                        target: 'https://example.com/test/name'
                    },
                    data: {
                        property1: "val1",
                        measurement1: 50.0,
                    }
                };

                context.applyWebContext(telemetyItem);
                let ext = telemetyItem.ext;
                Assert.ok(ext);
                Assert.equal("www.bing.com", ext.web.domain);
                Assert.equal("1024x768", ext.web.screenRes);
                Assert.equal(true, ext.web.userConsent);
                Assert.equal("48.0", ext.web.browserVer);
                Assert.equal("EN", ext.web.browserLang);
                Assert.equal("internet explorer", ext.web.browser);
                Assert.equal(true, ext.web.isManual);
            }
        });

        this.testCase({
            name: "validate telemetrycontext cleanup sets empty extensions to undefined",
            test: () => {
                // setup
                this.properties.initialize(this.getEmptyConfig(), this.core, []);

                const telemetyItem: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "user" : {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        },
                        "web": {}
                    },
                    tags: [{"user.accountId": "TestAccountId"}],
                    baseType: "RemoteDependencyData",
                    baseData: {
                        id: 'some id',
                        name: "/test/name",
                        success: true,
                        responseCode: 200,
                        duration: 123,
                        type: 'Fetch',
                        data: 'some data',
                        target: 'https://example.com/test/name'
                    },
                    data: {
                        property1: "val1",
                        property2: "val2",
                        measurement1: 50.0,
                        measurement2: 1.3
                    }
                }

                // act
                const telemetrycontext = new TelemetryContext(this.core.logger, this.getTelemetryConfig());
                telemetrycontext.cleanUp(telemetyItem);

                // verify
                Assert.equal(undefined, telemetyItem.ext.web, "web was cleared");
                Assert.notEqual(undefined, telemetyItem.ext.user, "user was not cleared");
            }
        });

        this.testCase({
            name: 'Session uses name prefix for cookie storage',
            test: () => {

                var sessionPrefix = Util.newId();
                var config = {
                    namePrefix: () => sessionPrefix,
                    sessionExpirationMs: () => undefined,
                    sessionRenewalMs: () => undefined,
                    cookieDomain: () => undefined

                };
                // Setup
                let cookie = "";
                const cookieStub: SinonStub = this.sandbox.stub(Util, 'setCookie', (logger, cookieName, value, domain) => {
                    cookie = cookieName;
                });

                // Act
                const sessionManager = new _SessionManager(config);
                sessionManager.update();

                // Test
                Assert.ok(cookieStub.called, 'cookie set');
                Assert.equal('ai_session' + sessionPrefix, cookie, 'Correct cookie name when name prefix is provided');
            }
        });
    }

    private getEmptyConfig(): IConfiguration {
        return {
            instrumentationKey: 'key',

            extensionConfig: {
                AppInsightsPropertiesPlugin: {
                    accountId: null,
                    sessionRenewalMs: null,
                    sessionExpirationMs: null,
                    samplingPercentage: null,
                    endpointUrl: null,
                    cookieDomain: null,
                    emitLineDelimitedJson: null,
                    maxBatchSizeInBytes: null,
                    maxBatchInterval: null,
                    disableTelemetry: null,
                    enableSessionStorageBuffer: null,
                    isRetryDisabled: null,
                    isBeaconApiDisabled: null,
                    sdkExtension: null,
                    isBrowserLinkTrackingEnabled: null,
                    appId: null
                }
            },
        };
    }

    private getTelemetryConfig(): ITelemetryConfig {
        return {
            instrumentationKey: () => "",
            accountId: () => "",
            sessionRenewalMs: () => 1000,
            samplingPercentage: () => 0,
            sessionExpirationMs: () => 1000,
            cookieDomain: () => "",
            sdkExtension: () => "",
            isBrowserLinkTrackingEnabled: () => true,
            appId: () => "",
            namePrefix: () => ""
        }
    }
}

export function runTests() {
    new PropertiesTests().registerTests();
}
