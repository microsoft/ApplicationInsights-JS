import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {IPostTransmissionTelemetryItem} from "../../../src/Interfaces/IInMemoryBatch";
import { InMemoryBatch } from "../../../src/InMemoryBatch";
import { DiagnosticLogger, IDiagnosticLogger, arrForEach } from "@microsoft/applicationinsights-core-js";
import { base64Decode, base64Encode, getEndpointDomain } from "../../../src/Helpers/Utils";

export class OfflineInMemoryBatchTests extends AITestClass {
    private _logger: IDiagnosticLogger;

    public testInitialize() {
        super.testInitialize();
        this._logger = new DiagnosticLogger();
        
    }

    public testCleanup() {
        super.testCleanup();
        this._logger = null as any;
       
    }

    public registerTests() {

        this.testCase({
            name: "Init: Init should contain expected events",
            test: () => {
                let endpoint = "testEndpoint";
                let inMemoBatch = new InMemoryBatch(this._logger, endpoint);
                let evts = inMemoBatch.getItems();
                Assert.deepEqual(evts, [], "should have no events");

                let mockEvt = mockPostTransmissionTelemetryItem();
                let evtArr = [mockEvt, mockEvt, mockEvt, mockEvt, mockEvt, mockEvt];
                inMemoBatch = new InMemoryBatch(this._logger, endpoint, evtArr);
                evts = inMemoBatch.getItems();
                Assert.deepEqual(evts.length, 6, "should have 6 events");
            }
            
        });


        this.testCase({
            name: "Add Event: Add Event with expected event limit ",
            test: () => {
                let endpoint = "testEndpoint";
                let inMemoBatch = new InMemoryBatch(this._logger, endpoint, undefined, 2);
                let evts = inMemoBatch.getItems();
                Assert.deepEqual(evts, [], "should have no events");

                let mockEvt = mockPostTransmissionTelemetryItem();
                inMemoBatch.addEvent(mockEvt);
                inMemoBatch.addEvent(mockEvt);

                evts = inMemoBatch.getItems();
                Assert.deepEqual(evts.length, 2, "should have 2 events");
               
                let isAdded = inMemoBatch.addEvent(mockEvt);

                Assert.ok(!isAdded, "should not added");
                

                evts = inMemoBatch.getItems();
                Assert.deepEqual(evts.length, 2, "should have 2 events test1");

                inMemoBatch.clear();
                evts = inMemoBatch.getItems();
                Assert.deepEqual(evts.length, 0, "should clear events");

            }
            
        });
       
        this.testCase({
            name: "Get domain: get domain from endpoint",
            test: () => {
                let testUrl: string[] = [
                    "test.com",
                    "http://test.com",
                    "https://test.com",
                    "www.test.com",
                    "https://test.com?test",
                    "https://test.com??test",
                    "https://test.com?test?test123"
                ]
                let expectedDomain =  "test.com";

                arrForEach(testUrl, (url) => {
                    let domain =  getEndpointDomain(url);
                    Assert.equal(domain, expectedDomain, "should get expected domain");
                });

                let domain = getEndpointDomain("http://test.us.eu-east.com?warmpth&auth=true");
                Assert.equal(domain, "test.us.eu-east.com", "should get expected domain");

            }
            
        });

        this.testCase({
            name: "Uint8 tranform: Encode and decode Uint8 array",
            test: () => {
                let arr = new Uint8Array([255,255,1,236,45,18]);
             
                let str = base64Encode(arr);
                Assert.equal(str, "MjU1LDI1NSwxLDIzNiw0NSwxOA==", "get expected string")

                let decode = base64Decode(str);
                Assert.deepEqual(decode, arr, "should return expected arr")
                Assert.deepEqual(decode.toString(), arr.toString(), "get expected arr string back");

            }
            
        });
    }
}

function mockPostTransmissionTelemetryItem(): IPostTransmissionTelemetryItem {
    let evt = {
        ver: "testVer",
        name:"testName",
        time: "testTime",
        iKey:"testKey",
        sendAttempt: 1,
        baseData: {pro1: "prop1"}

    } as IPostTransmissionTelemetryItem;
    return evt;
}