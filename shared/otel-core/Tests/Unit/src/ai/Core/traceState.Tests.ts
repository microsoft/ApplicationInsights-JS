import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { createOTelTraceState } from "../../../../../src/index";
import { strRepeat } from "@nevware21/ts-utils";

export class OTelTraceApiTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "TraceState: serialize",
            test: () => {
                const traceState = createOTelTraceState("a=1,b=2,c=3");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle empty string",
            test: () => {
                const traceState = createOTelTraceState("");
                Assert.equal(traceState.serialize(), "");
            }
        });

        this.testCase({
            name: "TraceState: handle null",
            test: () => {
                const traceState = createOTelTraceState(null as any);
                Assert.equal(traceState.serialize(), "");
            }
        });

        this.testCase({
            name: "TraceState: handle undefined",
            test: () => {
                const traceState = createOTelTraceState(undefined);
                Assert.equal(traceState.serialize(), "");
            }
        });

        this.testCase({
            name: "TraceState: handle invalid input",
            test: () => {
                const traceState = createOTelTraceState({} as any);
                Assert.equal(traceState.serialize(), "");
            }
        });

        this.testCase({
            name: "TraceState: new / updated keys are added to the front",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("d", "4");
                Assert.equal(traceState.serialize(), "d=4,a=1,b=2,c=3");

                traceState = traceState.set("a", "5");
                Assert.equal(traceState.serialize(), "a=5,d=4,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: must create new instances for each state",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                let traceState2 = createOTelTraceState(traceState.serialize());
                traceState2 = traceState2.set("d", "4");

                Assert.notEqual(traceState, traceState2);
                Assert.notDeepEqual(traceState, traceState2);

                Assert.equal(traceState.serialize(), "a=1,b=2,c=3", "Actual: " + traceState.serialize() + " expected a=1,b=2,c=3");
                Assert.equal(traceState2.serialize(), "d=4,a=1,b=2,c=3", "Actual: " + traceState2.serialize() + " expected d=4,a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: unset",
            test: () => {
                let traceState = createOTelTraceState("a=4,b=5,c=6");
                traceState = traceState.unset("b");
                Assert.equal(traceState.serialize(), "a=4,c=6");

                traceState = traceState.unset("a");
                Assert.equal(traceState.serialize(), "c=6");
            }
        });

        this.testCase({
            name: "TraceState: get",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), "2");
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(traceState.get("d"), undefined);
            }
        });

        this.testCase({
            name: "TraceState: serialize with spaces",
            test: () => {
                const traceState = createOTelTraceState("a=1, b=2, c=3");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: serialize with tabs",
            test: () => {
                const traceState = createOTelTraceState("a=1\t,b=2\t,c=3");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: serialize with newlines",
            test: () => {
                const traceState = createOTelTraceState("a=1\n,b=2\n,c=3");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: serialize with multiple commas",
            test: () => {
                const traceState = createOTelTraceState("a=1,,b=2,,c=3");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: serialize with multiple equals",
            test: () => {
                const traceState = createOTelTraceState("a==1,b==2,c==3");
                Assert.equal(traceState.serialize(), "");
            }
        });

        this.testCase({
            name: "TraceState: serialize with multiple spaces",
            test: () => {
                const traceState = createOTelTraceState("a=1  , b=2  , c=3");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: serialize with multiple tabs",
            test: () => {
                const traceState = createOTelTraceState("a=1\t\t,b=2\t\t,c=3");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: serialize with multiple newlines",
            test: () => {
                const traceState = createOTelTraceState("a=1\n\n,b=2\n\n,c=3");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: serialize with multiple commas and spaces",
            test: () => {
                const traceState = createOTelTraceState("a=1, ,b=2, ,c=3");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle unsetting non-existent keys",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.unset("d");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting empty key",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("", "4");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting empty value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("d", "");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting empty string value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("d", " ");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting empty key and value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("", "");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting null key",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set(null as any, "4");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting null value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("d", null as any);
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting null string value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("d", "null");
                Assert.equal(traceState.serialize(), "d=null,a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting null key and value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set(null as any, null as any);
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting undefined key",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set(undefined as any, "4");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });
        this.testCase({
            name: "TraceState: handle setting undefined value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("d", undefined as any);
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting undefined key and value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set(undefined as any, undefined as any);
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting invalid key",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set({} as any, "4");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting invalid value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("d", {} as any);
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting invalid key and value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set({} as any, {} as any);
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting invalid key and valid value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set({} as any, "4");
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle setting valid key and invalid value",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("d", {} as any);
                Assert.equal(traceState.serialize(), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "TraceState: handle dropping states when the max number of members limit is reached",
            test: () => {
                let traceState = createOTelTraceState("a=1,b=2,c=3");
                traceState = traceState.set("d", "4");
                traceState = traceState.set("e", "5");
                traceState = traceState.set("f", "6");
                traceState = traceState.set("g", "7");
                traceState = traceState.set("h", "8");
                traceState = traceState.set("i", "9");
                traceState = traceState.set("j", "10");
                traceState = traceState.set("k", "11");
                traceState = traceState.set("l", "12");
                traceState = traceState.set("m", "13");
                traceState = traceState.set("n", "14");
                traceState = traceState.set("o", "15");
                traceState = traceState.set("p", "16");
                traceState = traceState.set("q", "17");
                traceState = traceState.set("r", "18");
                traceState = traceState.set("s", "19");
                traceState = traceState.set("t", "20");
                traceState = traceState.set("u", "21");
                traceState = traceState.set("v", "22");
                traceState = traceState.set("w", "23");
                traceState = traceState.set("x", "24");
                traceState = traceState.set("y", "25");
                traceState = traceState.set("z", "26");
                traceState = traceState.set("aa", "27");
                traceState = traceState.set("ab", "28");
                traceState = traceState.set("ac", "29");
                traceState = traceState.set("ad", "30");
                traceState = traceState.set("ae", "31");
                traceState = traceState.set("af", "32");
                Assert.equal(traceState.serialize(), "af=32,ae=31,ad=30,ac=29,ab=28,aa=27,z=26,y=25,x=24,w=23,v=22,u=21,t=20,s=19,r=18,q=17,p=16,o=15,n=14,m=13,l=12,k=11,j=10,i=9,h=8,g=7,f=6,e=5,d=4,a=1,b=2,c=3");
                traceState = traceState.set("ag", "33");
                Assert.equal(traceState.serialize(), "ag=33,af=32,ae=31,ad=30,ac=29,ab=28,aa=27,z=26,y=25,x=24,w=23,v=22,u=21,t=20,s=19,r=18,q=17,p=16,o=15,n=14,m=13,l=12,k=11,j=10,i=9,h=8,g=7,f=6,e=5,d=4,a=1,b=2");
            }
        });

        this.testCase({
            name: "TraceState: drop states when the items are too long",
            test: () => {
                const traceState = createOTelTraceState("a=" + strRepeat("b", 512));
                Assert.equal(traceState.get("a"), undefined);
                Assert.equal(traceState.serialize(), "");
            }
        });

        this.testCase({
            name: "TraceState: drop items that are invalid",
            test: () => {
                const traceState = createOTelTraceState("a=1,b,c=3");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(traceState.serialize(), "a=1,c=3");
            }
        });

        this.testCase({
            name: "TraceState: drop items that are invalid with spaces",
            test: () => {
                const traceState = createOTelTraceState("a=1, b, c=3");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(traceState.serialize(), "a=1,c=3");
            }
        });

        this.testCase({
            name: "TraceState: drop items that are invalid with tabs",
            test: () => {
                const traceState = createOTelTraceState("a=1\t,b\t,c=3");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(traceState.serialize(), "a=1,c=3");
            }
        });

        this.testCase({
            name: "TraceState: drop items that have a single value with an '=' sign",
            test: () => {
                const traceState = createOTelTraceState("a=1,b=2=,c=3,d=");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(traceState.get("d"), undefined);
                Assert.equal(traceState.serialize(), "a=1,c=3");
            }
        });

        this.testCase({
            name: "TraceState: must handle valid state key ranges",
            test: () => {
                const traceState = createOTelTraceState("a-b=1,c/d=2,e_f=3,g*h=4");
                Assert.equal(traceState.get("a-b"), "1");
                Assert.equal(traceState.get("c/d"), "2");
                Assert.equal(traceState.get("e_f"), "3");
                Assert.equal(traceState.get("g*h"), "4");
                Assert.equal(traceState.serialize(), "a-b=1,c/d=2,e_f=3,g*h=4");
            }
        });

        this.testCase({
            name: "TraceState: handle values with embedded spaces",
            test: () => {
                const traceState = createOTelTraceState("a=1 b,c=2 d,e=3 f");
                Assert.equal(traceState.get("a"), "1 b");
                Assert.equal(traceState.get("c"), "2 d");
                Assert.equal(traceState.get("e"), "3 f");
                Assert.equal(traceState.serialize(), "a=1 b,c=2 d,e=3 f");
            }
        });

   }
}
