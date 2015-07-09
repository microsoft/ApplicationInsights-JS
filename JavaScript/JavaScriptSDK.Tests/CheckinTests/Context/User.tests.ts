/// <reference path="../../../JavaScriptSDK/context/user.ts" />
/// <reference path="../../testframework/common.ts" />
/// <reference path="../Util.tests.ts"/>

class UserContextTests extends TestClass {

    constructor() {
        super("UserContext");
    }

    /** Method called before the start of each test method */
    public testInitialize() {
    }

    /** Method called after each test method has completed */
    public testCleanup() {
    }

    public registerTests() {

        this.testCase({
            name: "Types: user context initializes from cookie when possible",
            test: () => {
                // setup
                var id = "userId";
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie", () => id + "||||");

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal(id, user.id, "user id was set from cookie");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "ai_user cookie is set with acq date and year expiration",
            test: () => {
                // setup
                var id = "userId";
                var actualCookieName: string;
                var actualCookieValue: string;
                var newGuidStub = sinon.stub(Microsoft.ApplicationInsights.Util, "newGuid",() => "newGuid");
                var getCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => "");
                var setCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie",(cookieName, cookieValue) => {
                    actualCookieName = cookieName;
                    actualCookieValue = cookieValue;
                });

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                var cookieValueParts = actualCookieValue.split(';');

                Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                Assert.equal("newGuid", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                Assert.equal(new Date().toString(),(new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");

                var expiration = cookieValueParts[1];
                Assert.equal(true, expiration.substr(0, "expires=".length)==="expires=", "ai_user cookie expiration part should start with expires=");
                var expirationDate = new Date(expiration.substr("expires=".length));
                Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");

                // cleanup
                getCookieStub.restore();
                setCookieStub.restore();
                newGuidStub.restore();
            }
        });

        this.testCase({
            name: "ai_user cookie is set with acq date and year expiration",
            test: () => {
                // setup
                var id = "userId"
                var actualCookieName: string;
                var actualCookieValue: string;
                var newGuidStub = sinon.stub(Microsoft.ApplicationInsights.Util, "newGuid",() => "newGuid");
                var getCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => "");
                var setCookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie",(cookieName, cookieValue) => {
                    actualCookieName = cookieName;
                    actualCookieValue = cookieValue;
                });

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                var cookieValueParts = actualCookieValue.split(';');

                Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                Assert.equal("newGuid", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                Assert.equal(new Date().toString(),(new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");

                var expiration = cookieValueParts[1];
                Assert.equal(true, expiration.substr(0, "expires=".length)==="expires=", "ai_user cookie expiration part should start with expires=");
                var expirationDate = new Date(expiration.substr("expires=".length));
                Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");

                // cleanup
                getCookieStub.restore();
                setCookieStub.restore();
                newGuidStub.restore();
            }
        });

        this.testCase({
            name: "Ctor: auth and account id initialize from cookie",
            test: () => {
                // setup
                var authId = "bla@bla.com";
                var accountId = "Contoso";

                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => authId + "|" + accountId);

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal(authId, user.authId, "user auth id was set from cookie");
                Assert.equal(accountId, user.accountId, "user account id was not set from cookie");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "Ctor: auth id initializes from cookie (without account id)",
            test: () => {
                // setup
                var authId = "bla@bla.com";
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => authId);

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal(authId, user.authId, "user auth id was set from cookie");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "Ctor: auth user context initializes from cookie when possible, even when account id not present",
            test: () => {
                // setup
                var authId = "bla@bla.com";
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "getCookie",() => authId);

                // act
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // verify
                Assert.equal(authId, user.authId, "user auth id was set from cookie");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "setAuthId: auth user set in cookie without account id",
            test: () => {
                // setup
                var authAndAccountId = ["bla@bla.com"];
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // act
                user.setAuthId(authAndAccountId[0]);

                // verify
                Assert.equal(authAndAccountId[0], user.authId, "user auth id was set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', authAndAccountId.join('|')), true, "user auth id cookie was set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "setAuthId: auth user and account id set in cookie ",
            test: () => {
                // setup
                var authAndAccountId = ['bla@bla.com', 'contoso'];
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "setCookie");
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);

                // act
                user.setAuthId(authAndAccountId[0], authAndAccountId[1]);

                // verify
                Assert.equal(authAndAccountId[0], user.authId, "user auth id was set");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser', authAndAccountId.join('|')), true, "user auth id cookie was set");
                cookieStub.restore();
            }
        });

        this.testCase({
            name: "clearAuthId: auth user and account cleared in context and cookie ",
            test: () => {
                // setup
                var user = new Microsoft.ApplicationInsights.Context.User(undefined);
                user.setAuthId("bla", "123");
                var cookieStub = sinon.stub(Microsoft.ApplicationInsights.Util, "deleteCookie");

                // act
                user.clearAuthId();

                // verify
                Assert.equal(undefined, user.authId, "user auth id was cleared");
                Assert.equal(undefined, user.accountId, "user account id was cleared");
                Assert.equal(cookieStub.calledWithExactly('ai_authUser'), true, "cookie was deleted");
                cookieStub.restore();
            }
        });
    }
}
new UserContextTests().registerTests();
