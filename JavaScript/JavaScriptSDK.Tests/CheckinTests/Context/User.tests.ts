/// <reference path="../../../JavaScriptSDK/context/user.ts" />
/// <reference path="../../testframework/common.ts" />
/// <reference path="../Util.tests.ts"/>

class UserContextTests extends TestClass {

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
    }
}
new UserContextTests().registerTests();
