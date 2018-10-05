/// <reference path="../TestFramework/TestClass.ts" />

import { AppInsightsCore, IConfiguration, DiagnosticLogger } from "applicationinsights-core-js";
import PropertiesPlugin from "../../PropertiesPlugin";
import { Util } from "applicationinsights-common";

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
        this.addUserTests();
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
                Assert.equal(id, this.properties.user.id, 'user id was set from cookie');
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
                Assert.equal(authId, this.properties.user.authenticatedId, "user auth id was set from cookie");
                Assert.equal(accountId, this.properties.user.accountId, "user account id was not set from cookie");
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
                Assert.equal(authId, this.properties.user.authenticatedId, "user auth id was set from cookie");
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
                Assert.equal(undefined, this.properties.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.user.accountId, "user account id was not set");
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
                Assert.equal(config.extensionConfig.AppInsightsPropertiesPlugin.accountId, this.properties.user.accountId, "user account id was set from back compat");
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
                this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal('bla@bla.com', this.properties.user.authenticatedId, "user auth id was not set");
                Assert.equal('contoso', this.properties.user.accountId, "user account id was not set");
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
                this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], null, true);

                // verify
                Assert.equal(authAndAccountId[0], this.properties.user.authenticatedId, "user auth id was set");
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
                this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);

                // verify
                Assert.equal(authAndAccountId[0], this.properties.user.authenticatedId, "user auth id was set");
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
                this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], null, true);

                // verify
                Assert.equal(authAndAccountId[0], this.properties.user.authenticatedId, "user auth id was set");
                Assert.equal(null, this.properties.user.accountId, "user account id was not set");
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
                this.properties.user.setAuthenticatedUserContext(null);

                // verify
                Assert.equal(undefined, this.properties.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.user.accountId, "user account id was not set");
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
                this.properties.user.setAuthenticatedUserContext(undefined, undefined);

                // verify
                Assert.equal(undefined, this.properties.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.user.accountId, "user account id was not set");
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
                this.properties.user.setAuthenticatedUserContext(undefined, '1234');

                // verify
                Assert.equal(undefined, this.properties.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.user.accountId, "user account id was not set");
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
                this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);

                // verify
                Assert.equal(undefined, this.properties.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.user.accountId, "user account id was not set");
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
                this.properties.user.clearAuthenticatedUserContext();
                var cookieStub = this.sandbox.stub(Util, "setCookie");
                var loggingStub = this.sandbox.stub(this.core.logger, "throwInternal");

                // act
                this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal(undefined, this.properties.user.authenticatedId, "user auth id was not set");
                Assert.equal(undefined, this.properties.user.accountId, "user account id was not set");
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
                this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);

                // verify
                Assert.equal(authAndAccountId[0], this.properties.user.authenticatedId, "user auth id was set");
                Assert.equal(authAndAccountId[1], this.properties.user.accountId, "user account id was set");
                Assert.equal(cookieStub.calledWithExactly(this.core.logger, 'ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id cookie was set");
                Assert.equal(loggingStub.notCalled, true, "No warnings");
            }
        });

        this.testCase({
            name: "clearAuthenticatedUserContext: auth user and account cleared in context and cookie ",
            test: () => {
                // setup
                this.properties.initialize(this.getEmptyConfig(), this.core, []);
                this.properties.user.setAuthenticatedUserContext("bla", "123");
                var cookieStub = this.sandbox.stub(Util, "deleteCookie");

                // act
                this.properties.user.clearAuthenticatedUserContext();

                // verify
                Assert.equal(undefined, this.properties.user.authenticatedId, "user auth id was cleared");
                Assert.equal(undefined, this.properties.user.accountId, "user account id was cleared");
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
                this.properties.user.clearAuthenticatedUserContext();

                // verify
                Assert.equal(undefined, this.properties.user.authenticatedId, "user auth id was cleared");
                Assert.equal(undefined, this.properties.user.accountId, "user account id was cleared");
                Assert.equal(cookieStub.calledWithExactly(this.core.logger, 'ai_authUser'), true, "cookie was deleted");
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
                    sampleRate: null,
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
}

export function runTests() {
    new PropertiesTests().registerTests();
}
