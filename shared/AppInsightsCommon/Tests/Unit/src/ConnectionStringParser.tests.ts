import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { ConnectionStringParser } from "../../../src/ConnectionStringParser";
import * as Constants from "../../../src/Constants";

const runTest = (options: {
    connectionString: string,
    expectedAuthorization?: string,
    expectedInstrumentationKey?: string,
    expectedBreezeEndpoint: string,
}) => {
    const result = ConnectionStringParser.parse(options.connectionString);

    if (options.expectedAuthorization) {
        Assert.deepEqual(result.authorization, options.expectedAuthorization);
    }
    if (options.expectedInstrumentationKey) {
        Assert.deepEqual(result.instrumentationkey, options.expectedInstrumentationKey);
    }
    Assert.deepEqual(result.ingestionendpoint, options.expectedBreezeEndpoint);
}

export class ConnectionStringParserTests extends AITestClass {

    public testInitialize() {
    }

    public testCleanup() {}

    public registerTests() {
        this.testCase({
            name: "should parse all valid fields",
            test: () => {
                const authorization = "ikey"
                const instrumentationKey = "instr_key";
                const ingestionEndpoint = "ingest";
                const liveEndpoint = "live";
                const connectionString = `Authorization=${authorization};InstrumentationKey=${instrumentationKey};IngestionEndpoint=${ingestionEndpoint};LiveEndpoint=${liveEndpoint}`;

                const result = ConnectionStringParser.parse(connectionString);

                Assert.deepEqual(result.authorization, authorization);
                Assert.deepEqual(result.instrumentationkey, instrumentationKey);
                Assert.deepEqual(result.ingestionendpoint, ingestionEndpoint);
            }
        });

        this.testCase({
            name: "should ignore invalid fields",
            test: () => {
                const authorization = "ikey"
                const instrumentationKey = "ikey";
                const ingestionEndpoint = "ingest";
                const liveEndpoint = "live";
                const connectionString = `Autho.rization=${authorization};Instrume.ntationKey=${instrumentationKey};Ingestion.Endpoint=${ingestionEndpoint};LiveEnd.point=${liveEndpoint}`;

                const result = ConnectionStringParser.parse(connectionString);

                Assert.deepEqual(result.authorization, undefined);
                Assert.deepEqual(result.instrumentationkey, undefined);
                Assert.deepEqual(result.ingestionendpoint, Constants.DEFAULT_BREEZE_ENDPOINT);
            }
        });

        this.testCase({
            name: "should use correct default endpoints",
            test: () => {
                runTest({
                    connectionString: "InstrumentationKey=00000000-0000-0000-0000-000000000000",
                    expectedAuthorization: undefined,
                    expectedInstrumentationKey: "00000000-0000-0000-0000-000000000000",
                    expectedBreezeEndpoint: Constants.DEFAULT_BREEZE_ENDPOINT,
                });
            }
        });

        this.testCase({
            name: "should use correct endpoints when using EndpointSuffix",
            test: () => {
                runTest({
                    connectionString: "InstrumentationKey=00000000-0000-0000-0000-000000000000;EndpointSuffix=ai.contoso.com",
                    expectedBreezeEndpoint: "https://dc.ai.contoso.com",
                });
            }
        });

        this.testCase({
            name: "should use correct endpoints when using EndpointSuffix with explicit override",
            test: () => {
                runTest({
                    connectionString: "InstrumentationKey=00000000-0000-0000-0000-000000000000;EndpointSuffix=ai.contoso.com;LiveEndpoint=https://custom.live.contoso.com:444",
                    expectedBreezeEndpoint: "https://dc.ai.contoso.com",
                });
            }
        });

        this.testCase({
            name: "should parse EndpointSuffix + Location",
            test: () => {
                runTest({
                    connectionString: "InstrumentationKey=00000000-0000-0000-0000-000000000000;EndpointSuffix=ai.contoso.com;Location=westus2",
                    expectedBreezeEndpoint: "https://westus2.dc.ai.contoso.com",
                });
            }
        });

        this.testCase({
            name: "should parse EndpointSuffix + Location + Endpoint Override",
            test: () => {
                runTest({
                    connectionString: "InstrumentationKey=00000000-0000-0000-0000-000000000000;EndpointSuffix=ai.contoso.com;Location=westus2;LiveEndpoint=https://custom.contoso.com:444",
                    expectedBreezeEndpoint: "https://westus2.dc.ai.contoso.com",
                });
            }
        });

        this.testCase({
            name: "should parse Endpoint Override",
            test: () => {
                runTest({
                    connectionString: "InstrumentationKey=00000000-0000-0000-0000-000000000000;LiveEndpoint=http://custom.live.endpoint.com:444",
                    expectedBreezeEndpoint: Constants.DEFAULT_BREEZE_ENDPOINT,
                });
            }
        });
    }
}
