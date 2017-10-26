/// <reference path="../../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../../JavaScriptSDK/Context/Sample.ts" />
/// <reference path="../../TestFramework/Common.ts" />
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

                var envelope = this.getEnvelope();
                envelope.tags[contextKeys.userId] = null;
                envelope.tags[contextKeys.operationId] = null;
                                
                // act
                var isSampledIn = sample.isSampledIn(envelope);

                // assert
                Assert.ok(isSampledIn);
            }
        });

        this.testCase({
            name: "Sampling: hashing is based on user id even if operation id is provided",
            test: () => {
                // setup
                var sample = new Microsoft.ApplicationInsights.Context.Sample(33);

                var userid = "asdf";

                var envelope1 = this.getEnvelope();
                envelope1.tags[contextKeys.userId] = userid;
                envelope1.tags[contextKeys.operationId] = "operation 1";

                var envelope2 = this.getEnvelope();
                envelope2.tags[contextKeys.userId] = userid;
                envelope2.tags[contextKeys.operationId] = "operation 2";

                // act
                var isSampledIn1 = sample.isSampledIn(envelope1);
                var isSampledIn2 = sample.isSampledIn(envelope2);
                
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

                var envelope1 = this.getEnvelope();
                envelope1.tags[contextKeys.userId] = null;
                envelope1.tags[contextKeys.operationId] = operationid;

                var envelope2 = this.getEnvelope();
                envelope2.tags[contextKeys.userId] = null;
                envelope2.tags[contextKeys.operationId] = operationid;

                var envelope3 = this.getEnvelope();
                envelope3.tags[contextKeys.userId] = undefined;
                envelope3.tags[contextKeys.operationId] = operationid;

                var envelope4 = this.getEnvelope();
                envelope4.tags[contextKeys.userId] = "";
                envelope4.tags[contextKeys.operationId] = operationid;
                
                // act
                var isSampledIn1 = sample.isSampledIn(envelope1);
                var isSampledIn2 = sample.isSampledIn(envelope2);
                var isSampledIn3 = sample.isSampledIn(envelope3);
                var isSampledIn4 = sample.isSampledIn(envelope4);

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

                var envelope1 = this.getEnvelope();
                envelope1.tags[contextKeys.userId] = null;
                envelope1.tags[contextKeys.operationId] = null;

                var mathRandomSpy = this.sandbox.spy(Math, "random");

                // act
                sample.isSampledIn(envelope1);

                // assert
                Assert.ok(mathRandomSpy.calledOnce);
                
            }
        });

        this.testCase({
            name: "Sampling: actual sampling rate should fall into 5% error range",
            test: () => {
                // setup
                var errorRange = 5;
                var totalItems = 1000;
                var ids = [];                
                for (var i = 0; i < totalItems; ++i) {
                    ids.push(Microsoft.ApplicationInsights.Util.newId());
                }

                var sampleRates = [50, 33, 25, 20, 16, 10];

                // act
                sampleRates.forEach((sampleRate) => {
                    var sut = new Microsoft.ApplicationInsights.HashCodeScoreGenerator();
                    var countOfSampledItems = 0;
                    
                    ids.forEach(function (id) {
                        if (sut.getHashCodeScore(id) < sampleRate)++countOfSampledItems;
                    });

                    // Assert
                    var actualSampleRate = 100 * countOfSampledItems / totalItems;
                    Assert.ok(Math.abs(actualSampleRate - sampleRate) < errorRange,
                        "Actual sampling (" + actualSampleRate + ") does not fall into +-2% range from expected rate (" + sampleRate + ")");
                });
            }
        });
    }

    private getEnvelope(): Microsoft.ApplicationInsights.Telemetry.Common.Envelope {
        var pageView = new Microsoft.ApplicationInsights.Telemetry.PageView();
        var data = new Microsoft.ApplicationInsights.Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.PageView>(Microsoft.ApplicationInsights.Telemetry.PageView.dataType, pageView);
        return new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(data, Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType);
    }
}
new SampleContextTests().registerTests();

