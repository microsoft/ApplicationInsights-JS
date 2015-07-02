/// <reference path="../../../JavaScriptSDK/appInsights.ts" />
/// <reference path="../../../JavaScriptSDK/context/sample.ts" />
/// <reference path="../../testframework/common.ts" />
/// <reference path="../Util.tests.ts"/>

class SampleContextTests extends TestClass {

    private originalDocument;
    private results: any[];

    /** Method called before the start of each test method */
    public testInitialize() {
        this.results = [];
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.results = [];
    }

    public registerTests() {
        var contextKeys = new AI.ContextTagKeys();

        this.testCase({
            name: "Sampling: isSampledIn returns true for 100 sampling rate",
            test: () => {
                // setup
                var sample = new Microsoft.ApplicationInsights.Context.Sample(100);

                var envelope1 = this.GetEnvelope();
                envelope1.tags[contextKeys.userId] = null;
                envelope1.tags[contextKeys.operationId] = null;
                                
                // act
                var isSampledIn1 = sample.IsSampledIn(envelope1);

                // assert
                Assert.ok(isSampledIn1);
            }
        });

        this.testCase({
            name: "Sampling: hashing is based on user id even if operation id is provided",
            test: () => {
                // setup
                var sample = new Microsoft.ApplicationInsights.Context.Sample(33);

                var userid = "asdf";

                var envelope1 = this.GetEnvelope();
                envelope1.tags[contextKeys.userId] = userid;
                envelope1.tags[contextKeys.operationId] = "operation 1";

                var envelope2 = this.GetEnvelope();
                envelope2.tags[contextKeys.userId] = userid;
                envelope2.tags[contextKeys.operationId] = "operation 2";

                // act
                var isSampledIn1 = sample.IsSampledIn(envelope1);
                var isSampledIn2 = sample.IsSampledIn(envelope2);
                
                // assert
                Assert.equal(isSampledIn1, isSampledIn2);
            }
        });

        this.testCase({
            name: "Sampling: hashing is based on operation id if no user id is provided",
            test: () => {
                // setup
                var sample = new Microsoft.ApplicationInsights.Context.Sample(33);

                var operationid = "operation id";

                var envelope1 = this.GetEnvelope();
                envelope1.tags[contextKeys.userId] = null;
                envelope1.tags[contextKeys.operationId] = operationid;

                var envelope2 = this.GetEnvelope();
                envelope2.tags[contextKeys.userId] = null;
                envelope2.tags[contextKeys.operationId] = operationid;

                var envelope3 = this.GetEnvelope();
                envelope3.tags[contextKeys.userId] = undefined;
                envelope3.tags[contextKeys.operationId] = operationid;

                var envelope4 = this.GetEnvelope();
                envelope4.tags[contextKeys.userId] = "";
                envelope4.tags[contextKeys.operationId] = operationid;
                
                // act
                var isSampledIn1 = sample.IsSampledIn(envelope1);
                var isSampledIn2 = sample.IsSampledIn(envelope2);
                var isSampledIn3 = sample.IsSampledIn(envelope3);
                var isSampledIn4 = sample.IsSampledIn(envelope4);

                // assert
                Assert.equal(isSampledIn1, isSampledIn2);
                Assert.equal(isSampledIn1, isSampledIn3);
                Assert.equal(isSampledIn1, isSampledIn4);
            }
        });

        this.testCase({
            name: "Sampling: hashing is random if no user id nor operation id provided",
            test: () => {
                // setup
                var sample = new Microsoft.ApplicationInsights.Context.Sample(33);

                var envelope1 = this.GetEnvelope();
                envelope1.tags[contextKeys.userId] = null;
                envelope1.tags[contextKeys.operationId] = null;

                var mathRandomSpy = sinon.spy(Math, "random");

                // act
                sample.IsSampledIn(envelope1);

                // assert
                Assert.ok(mathRandomSpy.calledOnce);
                mathRandomSpy.restore();
            }
        });
    }

    private GetEnvelope(): Microsoft.ApplicationInsights.Telemetry.Common.Envelope {
        var pageView = new Microsoft.ApplicationInsights.Telemetry.PageView();
        var data = new Microsoft.ApplicationInsights.Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.PageView>(Microsoft.ApplicationInsights.Telemetry.PageView.dataType, pageView);
        return new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(data, Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType);
    }
}
new SampleContextTests().registerTests();

