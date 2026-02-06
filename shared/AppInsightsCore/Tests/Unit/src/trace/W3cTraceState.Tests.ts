import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { asString, strRepeat } from "@nevware21/ts-utils";
import { createW3cTraceState, isW3cTraceState, snapshotW3cTraceState } from "../../../src/telemetry/W3cTraceState";

export class W3cTraceStateTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "W3cTraceState: default",
            test: () => {
                const traceState = createW3cTraceState();
                Assert.equal(traceState.keys.length, 0);
                Assert.equal(traceState.hdrs().length, 0);
                Assert.equal(asString(traceState), "");
                Assert.equal(traceState.isEmpty, true, "Default trace state should be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: handle empty string",
            test: () => {
                const traceState = createW3cTraceState("");
                Assert.equal(traceState.keys.length, 0);
                Assert.equal(traceState.hdrs().length, 0);
                Assert.equal(asString(traceState), "");
                Assert.equal(traceState.isEmpty, true, "Empty string trace state should be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: handle null",
            test: () => {
                const traceState = createW3cTraceState(null as any);
                Assert.equal(traceState.keys.length, 0);
                Assert.equal(traceState.hdrs().length, 0);
                Assert.equal(asString(traceState), "");
                Assert.equal(traceState.isEmpty, true, "Null trace state should be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: handle undefined",
            test: () => {
                const traceState = createW3cTraceState(undefined);
                Assert.equal(traceState.keys.length, 0);
                Assert.equal(traceState.hdrs().length, 0);
                Assert.equal(asString(traceState), "");
                Assert.equal(traceState.isEmpty, true, "Undefined trace state should be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: toString",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.isEmpty, false, "Trace state with values should not be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: handle invalid input",
            test: () => {
                const traceState = createW3cTraceState({} as any);
                Assert.equal(traceState.keys.length, 0);
                Assert.equal(traceState.hdrs().length, 0);
                Assert.equal(asString(traceState), "");
                Assert.equal(traceState.isEmpty, true, "Invalid trace state should be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: new / updated keys are added to the front",
            test: () => {
                let traceState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);

                traceState.set("d", "4");
                Assert.equal(asString(traceState), "d=4,a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 4);
                Assert.deepEqual(["d", "a", "b", "c"], traceState.keys);

                traceState.set("a", "5");
                Assert.equal(asString(traceState), "a=5,d=4,b=2,c=3");
                Assert.equal(traceState.keys.length, 4);
                Assert.deepEqual(["a", "d", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: must create new instances for each state",
            test: () => {
                let traceState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);

                let traceState2 = createW3cTraceState(asString(traceState));
                Assert.equal(traceState2.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState2.keys);
                traceState2.set("d", "4");
                Assert.equal(traceState2.keys.length, 4);
                Assert.deepEqual(["d", "a", "b", "c"], traceState2.keys);

                Assert.notEqual(traceState, traceState2);
                Assert.notDeepEqual(traceState, traceState2);

                Assert.equal(asString(traceState), "a=1,b=2,c=3", "Actual: " + asString(traceState) + " expected a=1,b=2,c=3");
                Assert.equal(asString(traceState2), "d=4,a=1,b=2,c=3", "Actual: " + asString(traceState2) + " expected d=4,a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "W3cTraceState: del",
            test: () => {
                let traceState = createW3cTraceState("a=4,b=5,c=6");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
                Assert.equal(traceState.isEmpty, false, "Trace state should not be empty initially");
                
                traceState.del("b");
                Assert.equal(asString(traceState), "a=4,c=6");
                Assert.equal(traceState.keys.length, 2);
                Assert.deepEqual(["a", "c"], traceState.keys);
                Assert.equal(traceState.isEmpty, false, "Trace state should not be empty after deleting one key");

                traceState.del("a");
                Assert.equal(asString(traceState), "c=6");
                Assert.equal(traceState.keys.length, 1);
                Assert.deepEqual(["c"], traceState.keys);
                Assert.equal(traceState.isEmpty, false, "Trace state should not be empty with one key remaining");
                
                traceState.del("c");
                Assert.equal(asString(traceState), "");
                Assert.equal(traceState.keys.length, 0);
                Assert.deepEqual([], traceState.keys);
                Assert.equal(traceState.isEmpty, true, "Trace state should be empty after deleting all keys");
            }
        });

        this.testCase({
            name: "W3cTraceState: get",
            test: () => {
                let traceState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), "2");
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(traceState.get("d"), undefined);
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: decode with spaces",
            test: () => {
                const traceState = createW3cTraceState("a=1, b=2, c=3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: decode with tabs",
            test: () => {
                const traceState = createW3cTraceState("a=1\t,b=2\t,c=3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: decode with newlines",
            test: () => {
                const traceState = createW3cTraceState("a=1\n,b=2\n,c=3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: decode with multiple commas",
            test: () => {
                const traceState = createW3cTraceState("a=1,,b=2,,c=3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: decode with multiple equals",
            test: () => {
                const traceState = createW3cTraceState("a==1,b==2,c==3");
                Assert.equal(asString(traceState), "");
                Assert.equal(traceState.keys.length, 0);
                Assert.deepEqual([], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: decode with multiple spaces",
            test: () => {
                const traceState = createW3cTraceState("a=1  , b=2  , c=3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: decode with multiple tabs",
            test: () => {
                const traceState = createW3cTraceState("a=1\t\t,b=2\t\t,c=3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: decode with multiple newlines",
            test: () => {
                const traceState = createW3cTraceState("a=1\n\n,b=2\n\n,c=3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: decode with multiple commas and spaces",
            test: () => {
                const traceState = createW3cTraceState("a=1, ,b=2, ,c=3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle unsetting non-existent keys",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.del("d");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting empty key",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("", "4");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting empty value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("d", "");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting empty string value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("d", " ");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting empty key and value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("", "");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting null key",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set(null as any, "4");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting null value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("d", null as any);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting null string value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("d", "null");
                Assert.equal(asString(traceState), "d=null,a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 4);
                Assert.deepEqual(["d", "a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting null key and value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set(null as any, null as any);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting undefined key",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set(undefined as any, "4");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });
        this.testCase({
            name: "W3cTraceState: handle setting undefined value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("d", undefined as any);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting undefined key and value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set(undefined as any, undefined as any);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting invalid key",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set({} as any, "4");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting invalid value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("d", {} as any);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting invalid key and value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set({} as any, {} as any);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting invalid key and valid value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set({} as any, "4");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle setting valid key and invalid value",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("d", {} as any);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle dropping states when the max number of members limit is reached",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                traceState.set("d", "4");
                traceState.set("e", "5");
                traceState.set("f", "6");
                traceState.set("g", "7");
                traceState.set("h", "8");
                traceState.set("i", "9");
                traceState.set("j", "10");
                traceState.set("k", "11");
                traceState.set("l", "12");
                traceState.set("m", "13");
                traceState.set("n", "14");
                traceState.set("o", "15");
                traceState.set("p", "16");
                traceState.set("q", "17");
                traceState.set("r", "18");
                traceState.set("s", "19");
                traceState.set("t", "20");
                traceState.set("u", "21");
                traceState.set("v", "22");
                traceState.set("w", "23");
                traceState.set("x", "24");
                traceState.set("y", "25");
                traceState.set("z", "26");
                traceState.set("aa", "27");
                traceState.set("ab", "28");
                traceState.set("ac", "29");
                traceState.set("ad", "30");
                traceState.set("ae", "31");
                traceState.set("af", "32");
                Assert.equal(asString(traceState), "af=32,ae=31,ad=30,ac=29,ab=28,aa=27,z=26,y=25,x=24,w=23,v=22,u=21,t=20,s=19,r=18,q=17,p=16,o=15,n=14,m=13,l=12,k=11,j=10,i=9,h=8,g=7,f=6,e=5,d=4,a=1,b=2,c=3");
                traceState.set("ag", "33");
                Assert.equal(asString(traceState), "ag=33,af=32,ae=31,ad=30,ac=29,ab=28,aa=27,z=26,y=25,x=24,w=23,v=22,u=21,t=20,s=19,r=18,q=17,p=16,o=15,n=14,m=13,l=12,k=11,j=10,i=9,h=8,g=7,f=6,e=5,d=4,a=1,b=2");
                Assert.equal(traceState.keys.length, 33);
                Assert.deepEqual(["ag","af","ae","ad","ac","ab","aa","z","y","x","w","v","u","t","s","r","q","p","o","n","m","l","k","j","i","h","g","f","e","d","a","b","c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: drop states when the items are too long",
            test: () => {
                const traceState = createW3cTraceState("a=" + strRepeat("b", 512));
                Assert.equal(traceState.get("a"), undefined);
                Assert.equal(asString(traceState), "");
                Assert.equal(traceState.keys.length, 0);
                Assert.deepEqual([], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: drop items that are invalid",
            test: () => {
                const traceState = createW3cTraceState("a=1,b,c=3");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(asString(traceState), "a=1,c=3");
                Assert.equal(traceState.keys.length, 2);
                Assert.deepEqual(["a", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: drop items that are invalid with spaces",
            test: () => {
                const traceState = createW3cTraceState("a=1, b, c=3");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(asString(traceState), "a=1,c=3");
                Assert.equal(traceState.keys.length, 2);
                Assert.deepEqual(["a", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: drop items that are invalid with tabs",
            test: () => {
                const traceState = createW3cTraceState("a=1\t,b\t,c=3");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(asString(traceState), "a=1,c=3");
                Assert.equal(traceState.keys.length, 2);
                Assert.deepEqual(["a", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: drop items that have a single value with an '=' sign",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2=,c=3,d=");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(traceState.get("d"), undefined);
                Assert.equal(asString(traceState), "a=1,c=3");
                Assert.equal(traceState.keys.length, 2);
                Assert.deepEqual(["a", "c"], traceState.keys);
                Assert.equal(traceState.isEmpty, false, "Trace state with valid keys should not be empty");
            }
        });
        
        this.testCase({
            name: "W3cTraceState: isEmpty with all invalid items",
            test: () => {
                const traceState = createW3cTraceState("b=2=,d=");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("d"), undefined);
                Assert.equal(asString(traceState), "");
                Assert.equal(traceState.keys.length, 0);
                Assert.deepEqual([], traceState.keys);
                Assert.equal(traceState.isEmpty, true, "Trace state with only invalid items should be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: must handle valid state key ranges",
            test: () => {
                const traceState = createW3cTraceState("a-b=1,c/d=2,e_f=3,g*h=4");
                Assert.equal(traceState.get("a-b"), "1");
                Assert.equal(traceState.get("c/d"), "2");
                Assert.equal(traceState.get("e_f"), "3");
                Assert.equal(traceState.get("g*h"), "4");
                Assert.equal(asString(traceState), "a-b=1,c/d=2,e_f=3,g*h=4");
                Assert.equal(traceState.keys.length, 4);
                Assert.deepEqual(["a-b", "c/d", "e_f", "g*h"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle values with embedded spaces",
            test: () => {
                const traceState = createW3cTraceState("a=1 b,c=2 d,e=3 f");
                Assert.equal(traceState.get("a"), "1 b");
                Assert.equal(traceState.get("c"), "2 d");
                Assert.equal(traceState.get("e"), "3 f");
                Assert.equal(asString(traceState), "a=1 b,c=2 d,e=3 f");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "c", "e"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle inherited state values with no new values",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(parentState.get("a"), "1");
                Assert.equal(parentState.get("b"), "2");
                Assert.equal(parentState.get("c"), "3");
                Assert.equal(asString(parentState), "a=1,b=2,c=3");
                Assert.equal(parentState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], parentState.keys);

                const traceState = createW3cTraceState("", parentState);
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), "2");
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle inherited state values with new values",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(parentState.get("a"), "1");
                Assert.equal(parentState.get("b"), "2");
                Assert.equal(parentState.get("c"), "3");
                Assert.equal(asString(parentState), "a=1,b=2,c=3");
                Assert.equal(parentState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], parentState.keys);

                const traceState = createW3cTraceState("d=4,e=5,f=6", parentState);
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), "2");
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(traceState.get("d"), "4");
                Assert.equal(traceState.get("e"), "5");
                Assert.equal(traceState.get("f"), "6");
                Assert.equal(asString(traceState), "d=4,e=5,f=6,a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 6);
                Assert.deepEqual(["d", "e", "f", "a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle inherited state values with new values that are too long",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(parentState.get("a"), "1");
                Assert.equal(parentState.get("b"), "2");
                Assert.equal(parentState.get("c"), "3");
                Assert.equal(asString(parentState), "a=1,b=2,c=3");
                Assert.equal(parentState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], parentState.keys);

                const traceState = createW3cTraceState("d=" + strRepeat("e", 512), parentState);
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), "2");
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(traceState.get("d"), undefined);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle deleting an inherited key in the child",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(parentState.get("a"), "1");
                Assert.equal(parentState.get("b"), "2");
                Assert.equal(parentState.get("c"), "3");
                Assert.equal(asString(parentState), "a=1,b=2,c=3");
                Assert.equal(parentState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], parentState.keys);

                const traceState = createW3cTraceState("", parentState);
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), "2");
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);

                traceState.del("b");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(asString(traceState), "a=1,c=3");
                Assert.equal(traceState.keys.length, 2);
                Assert.deepEqual(["a", "c"], traceState.keys);

                // Should not affect the original state
                Assert.equal(parentState.get("a"), "1");
                Assert.equal(parentState.get("b"), "2");
                Assert.equal(parentState.get("c"), "3");
                Assert.equal(asString(parentState), "a=1,b=2,c=3");
                Assert.equal(parentState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], parentState.keys);
            }
        });

        this.testCase({
            name: "W3cTraceState: handle deleting an inherited key in the parent",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(parentState.get("a"), "1");
                Assert.equal(parentState.get("b"), "2");
                Assert.equal(parentState.get("c"), "3");
                Assert.equal(asString(parentState), "a=1,b=2,c=3");
                Assert.equal(parentState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], parentState.keys);

                const traceState = createW3cTraceState("", parentState);
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), "2");
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);

                parentState.del("b");
                Assert.equal(traceState.get("a"), "1");
                Assert.equal(traceState.get("b"), undefined);
                Assert.equal(traceState.get("c"), "3");
                Assert.equal(asString(traceState), "a=1,c=3");
                Assert.equal(traceState.keys.length, 2);
                Assert.deepEqual(["a", "c"], traceState.keys);

                // Should not affect the original state
                Assert.equal(parentState.get("a"), "1");
                Assert.equal(parentState.get("b"), undefined);
                Assert.equal(parentState.get("c"), "3");
                Assert.equal(asString(parentState), "a=1,c=3");
                Assert.equal(parentState.keys.length, 2);
                Assert.deepEqual(["a", "c"], parentState.keys);
            }
        });

        // isEmpty property specific tests
        this.testCase({
            name: "W3cTraceState: isEmpty with trace state values",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(traceState.isEmpty, false, "Trace state with values should not be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: isEmpty after deleting all keys",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(traceState.isEmpty, false, "Trace state with values should not be empty");
                
                traceState.del("a");
                Assert.equal(traceState.isEmpty, false, "Trace state should not be empty after deleting one key");
                
                traceState.del("b");
                Assert.equal(traceState.isEmpty, false, "Trace state should not be empty after deleting two keys");
                
                traceState.del("c");
                Assert.equal(traceState.isEmpty, true, "Trace state should be empty after deleting all keys");
            }
        });

        this.testCase({
            name: "W3cTraceState: isEmpty with parent state",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(parentState.isEmpty, false, "Parent trace state with values should not be empty");
                
                const childState = createW3cTraceState("", parentState);
                Assert.equal(childState.isEmpty, false, "Child trace state with parent values should not be empty");
                
                const emptyChildState = createW3cTraceState("", createW3cTraceState());
                Assert.equal(emptyChildState.isEmpty, true, "Child trace state with empty parent should be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: isEmpty after deleting inherited keys",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                const childState = createW3cTraceState("", parentState);
                Assert.equal(childState.isEmpty, false, "Child trace state with parent values should not be empty");
                
                childState.del("a");
                Assert.equal(childState.isEmpty, false, "Child trace state should not be empty after deleting one key");
                
                childState.del("b");
                Assert.equal(childState.isEmpty, false, "Child trace state should not be empty after deleting two keys");
                
                childState.del("c");
                Assert.equal(childState.isEmpty, true, "Child trace state should be empty after deleting all keys");
                
                // Parent state should remain unchanged
                Assert.equal(parentState.isEmpty, false, "Parent trace state should remain unchanged");
            }
        });

        this.testCase({
            name: "W3cTraceState: isEmpty after parent deletes keys",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                const childState = createW3cTraceState("", parentState);
                Assert.equal(childState.isEmpty, false, "Child trace state with parent values should not be empty");
                
                parentState.del("a");
                Assert.equal(childState.isEmpty, false, "Child trace state should not be empty after parent deletes one key");
                
                parentState.del("b");
                Assert.equal(childState.isEmpty, false, "Child trace state should not be empty after parent deletes two keys");
                
                parentState.del("c");
                Assert.equal(childState.isEmpty, true, "Child trace state should be empty after parent deletes all keys");
            }
        });

        this.testCase({
            name: "W3cTraceState: isEmpty with mixed operations",
            test: () => {
                const traceState = createW3cTraceState();
                Assert.equal(traceState.isEmpty, true, "Empty trace state should be empty");
                
                traceState.set("a", "1");
                Assert.equal(traceState.isEmpty, false, "Trace state should not be empty after adding a key");
                
                traceState.del("a");
                Assert.equal(traceState.isEmpty, true, "Trace state should be empty after deleting the key");
                
                traceState.set("b", "2");
                traceState.set("c", "3");
                Assert.equal(traceState.isEmpty, false, "Trace state should not be empty after adding multiple keys");
                
                traceState.del("b");
                Assert.equal(traceState.isEmpty, false, "Trace state should not be empty with remaining keys");
                
                traceState.del("c");
                Assert.equal(traceState.isEmpty, true, "Trace state should be empty after deleting all keys");
            }
        });

        this.testCase({
            name: "W3cTraceState: isEmpty with changing parent values",
            test: () => {
                const parentState = createW3cTraceState();
                const childState = createW3cTraceState("", parentState);
                Assert.equal(parentState.isEmpty, true, "Empty parent trace state should be empty");
                Assert.equal(childState.isEmpty, true, "Child of empty parent should be empty");
                
                parentState.set("a", "1");
                Assert.equal(parentState.isEmpty, false, "Parent trace state should not be empty after adding a key");
                Assert.equal(childState.isEmpty, false, "Child trace state should not be empty after parent adds a key");
                
                childState.del("a");
                Assert.equal(parentState.isEmpty, false, "Parent trace state should remain unchanged after child deletes key");
                Assert.equal(childState.isEmpty, true, "Child trace state should be empty after deleting parent's key");
                
                childState.set("b", "2");
                Assert.equal(childState.isEmpty, false, "Child trace state should not be empty after adding own key");
                
                parentState.del("a");
                Assert.equal(parentState.isEmpty, true, "Parent trace state should be empty after deleting its only key");
                Assert.equal(childState.isEmpty, false, "Child trace state should not be empty with its own keys");
            }
        });

        // Tests for the child() function
        this.testCase({
            name: "W3cTraceState: child() creates a new child trace state instance",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                const childState = parentState.child();
                
                Assert.notEqual(parentState, childState, "Child should be a new instance");
                Assert.equal(childState.get("a"), "1", "Child should inherit parent values");
                Assert.equal(childState.get("b"), "2", "Child should inherit parent values");
                Assert.equal(childState.get("c"), "3", "Child should inherit parent values");
                Assert.equal(asString(childState), "a=1,b=2,c=3", "Child should have same string representation as parent");
                Assert.equal(childState.keys.length, 3, "Child should have same number of keys as parent");
                Assert.deepEqual(childState.keys, ["a", "b", "c"], "Child should have same keys as parent");
                Assert.equal(childState.isEmpty, false, "Child should not be empty if parent is not empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() from empty parent",
            test: () => {
                const parentState = createW3cTraceState();
                const childState = parentState.child();
                
                Assert.notEqual(parentState, childState, "Child should be a new instance");
                Assert.equal(childState.keys.length, 0, "Child of empty parent should have no keys");
                Assert.equal(asString(childState), "", "Child of empty parent should have empty string representation");
                Assert.equal(childState.isEmpty, true, "Child of empty parent should be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() with modifications to parent",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2");
                const childState = parentState.child();
                
                Assert.equal(asString(childState), "a=1,b=2", "Child should initially match parent");
                
                // Modify parent after creating child
                parentState.set("c", "3");
                Assert.equal(asString(parentState), "c=3,a=1,b=2", "Parent should have new value");
                Assert.equal(asString(childState), "c=3,a=1,b=2", "Child should reflect parent changes");
                Assert.equal(childState.get("c"), "3", "Child should get updated value from parent");
                
                // Delete from parent
                parentState.del("a");
                Assert.equal(asString(parentState), "c=3,b=2", "Parent should have key removed");
                Assert.equal(asString(childState), "c=3,b=2", "Child should reflect parent deletions");
                Assert.equal(childState.get("a"), undefined, "Child should not have deleted key");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() with modifications to child",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2");
                const childState = parentState.child();
                
                // Modify child
                childState.set("c", "3");
                Assert.equal(asString(childState), "c=3,a=1,b=2", "Child should have new value");
                Assert.equal(asString(parentState), "a=1,b=2", "Parent should not be affected by child changes");
                Assert.equal(parentState.get("c"), undefined, "Parent should not have child's new key");
                
                // Modify existing value in child
                childState.set("a", "4");
                Assert.equal(asString(childState), "a=4,c=3,b=2", "Child should have updated value");
                Assert.equal(asString(parentState), "a=1,b=2", "Parent should not be affected by child modifications");
                Assert.equal(parentState.get("a"), "1", "Parent should keep original value");
                Assert.equal(childState.get("a"), "4", "Child should have updated value");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() with deletions in child",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                const childState = parentState.child();
                
                // Delete key in child
                childState.del("b");
                Assert.equal(asString(childState), "a=1,c=3", "Child should have key removed");
                Assert.equal(asString(parentState), "a=1,b=2,c=3", "Parent should not be affected by child deletions");
                Assert.equal(parentState.get("b"), "2", "Parent should keep deleted key");
                Assert.equal(childState.get("b"), undefined, "Child should not have deleted key");
                
                // Delete all keys in child
                childState.del("a");
                childState.del("c");
                Assert.equal(asString(childState), "", "Child should have all keys removed");
                Assert.equal(childState.isEmpty, true, "Child should be empty after deleting all keys");
                Assert.equal(asString(parentState), "a=1,b=2,c=3", "Parent should remain unchanged");
                Assert.equal(parentState.isEmpty, false, "Parent should not be empty");
            }
        });

        this.testCase({
            name: "W3cTraceState: nested children creation",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2");
                const childState = parentState.child();
                const grandchildState = childState.child();
                
                Assert.notEqual(parentState, childState, "Child should be a new instance");
                Assert.notEqual(childState, grandchildState, "Grandchild should be a new instance");
                Assert.notEqual(parentState, grandchildState, "Grandchild should be a new instance different from parent");
                
                Assert.equal(asString(grandchildState), "a=1,b=2", "Grandchild should inherit all values");
                
                // Modify at each level
                parentState.set("p", "parent");
                childState.set("c", "child");
                grandchildState.set("g", "grandchild");
                
                Assert.equal(asString(parentState), "p=parent,a=1,b=2", "Parent should have its own values");
                Assert.equal(asString(childState), "c=child,p=parent,a=1,b=2", "Child should have its values and parent's");
                Assert.equal(asString(grandchildState), "g=grandchild,c=child,p=parent,a=1,b=2", "Grandchild should have all values");
                
                // Override values at different levels
                childState.set("a", "child-a");
                grandchildState.set("c", "grandchild-c");
                
                Assert.equal(parentState.get("a"), "1", "Parent should keep original value");
                Assert.equal(childState.get("a"), "child-a", "Child should have overridden value");
                Assert.equal(grandchildState.get("a"), "child-a", "Grandchild should inherit child's value");
                Assert.equal(childState.get("c"), "child", "Child should keep its value");
                Assert.equal(grandchildState.get("c"), "grandchild-c", "Grandchild should have overridden value");
            }
        });
        
        this.testCase({
            name: "W3cTraceState: child() with modifications affecting isEmpty",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2");
                const childState = parentState.child();
                
                Assert.equal(parentState.isEmpty, false, "Parent should not be empty");
                Assert.equal(childState.isEmpty, false, "Child should not be empty");
                
                // Delete all parent keys from child
                childState.del("a");
                childState.del("b");
                
                Assert.equal(parentState.isEmpty, false, "Parent should still not be empty");
                Assert.equal(childState.isEmpty, true, "Child should be empty after deleting all keys");
                
                // Add key to parent
                parentState.set("c", "3");
                Assert.equal(childState.isEmpty, false, "Child should not be empty after parent adds key");
                Assert.equal(childState.get("c"), "3", "Child should have parent's new key");
                
                // Delete from parent
                parentState.del("a");
                parentState.del("b");
                parentState.del("c");
                
                Assert.equal(parentState.isEmpty, true, "Parent should be empty after deleting all keys");
                Assert.equal(childState.isEmpty, true, "Child should be empty when parent is empty and child has deleted parent keys");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() preserves key ordering",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2,c=3");
                const childState = parentState.child();
                
                // Add keys to child, which should go to the front
                childState.set("d", "4");
                childState.set("e", "5");
                
                Assert.deepEqual(childState.keys, ["e", "d", "a", "b", "c"], "Child should have keys in correct order");
                
                // Update existing key in child, which should move to front
                childState.set("b", "new-b");
                
                Assert.deepEqual(childState.keys, ["b", "e", "d", "a", "c"], "Updated key should move to front");
                Assert.equal(childState.get("b"), "new-b", "Should get updated value");
                
                // Add new key to parent, should be inherited by child
                parentState.set("f", "6");
                
                // Child keys should include parent's new key but maintain child's order
                Assert.deepEqual(childState.keys, ["b", "e", "d", "f", "a", "c"], "Child should include parent's new key");
                
                // Update existing key in parent, which should be reflected in child unless overridden
                parentState.set("a", "new-a");
                
                Assert.equal(childState.get("a"), "new-a", "Child should see parent's updated value");
                
                // Override parent key that was already overridden
                childState.set("a", "child-a");
                
                Assert.equal(parentState.get("a"), "new-a", "Parent should keep its value");
                Assert.equal(childState.get("a"), "child-a", "Child should have its own value");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() handles hdrs() correctly",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2");
                const childState = parentState.child();
                
                Assert.deepEqual(childState.hdrs(), ["a=1,b=2"], "Child headers should match parent initially");
                
                childState.set("c", "3");
                Assert.deepEqual(childState.hdrs(), ["c=3,a=1,b=2"], "Child headers should include own values");
                Assert.deepEqual(parentState.hdrs(), ["a=1,b=2"], "Parent headers should remain unchanged");
                
                // Test with maxHeaders parameter
                const longParent = createW3cTraceState("a=" + strRepeat("x", 250) + ",b=" + strRepeat("y", 250));
                const longChild = longParent.child();
                longChild.set("c", strRepeat("z", 250));
                
                // Should split into multiple headers due to length
                Assert.equal(longChild.hdrs().length > 1, true, "Long values should split into multiple headers");
                
                // Test with maxKeys parameter
                Assert.deepEqual(longChild.hdrs(undefined, 1), ["c=" + strRepeat("z", 250)], "Should respect maxKeys parameter");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() with invalid values in parent",
            test: () => {
                // Create parent with some invalid entries that will be filtered out
                const parentState = createW3cTraceState("a=1,invalid,b=2,c=");
                Assert.equal(asString(parentState), "a=1,b=2", "Parent should only have valid entries");
                
                const childState = parentState.child();
                Assert.equal(asString(childState), "a=1,b=2", "Child should inherit only valid entries");
                
                // Add an invalid entry to parent after child creation
                parentState.set("d", "");
                Assert.equal(asString(parentState), "a=1,b=2", "Parent should not add invalid entry");
                Assert.equal(asString(childState), "a=1,b=2", "Child should reflect parent's valid state");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() with multiple children from same parent",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2");
                
                // Create multiple children
                const child1 = parentState.child();
                const child2 = parentState.child();
                const child3 = parentState.child();
                
                Assert.notEqual(child1, child2, "Each child should be a distinct instance");
                Assert.notEqual(child2, child3, "Each child should be a distinct instance");
                
                // Modify each child differently
                child1.set("c", "3");
                child2.set("d", "4");
                child3.set("e", "5");
                
                // Each child should have its own modifications plus parent's values
                Assert.equal(asString(child1), "c=3,a=1,b=2", "Child 1 should have its own changes");
                Assert.equal(asString(child2), "d=4,a=1,b=2", "Child 2 should have its own changes");
                Assert.equal(asString(child3), "e=5,a=1,b=2", "Child 3 should have its own changes");
                
                // Modify parent, all children should reflect the change
                parentState.set("f", "6");
                
                Assert.equal(asString(child1), "c=3,f=6,a=1,b=2", "Child 1 should see parent's new value");
                Assert.equal(asString(child2), "d=4,f=6,a=1,b=2", "Child 2 should see parent's new value");
                Assert.equal(asString(child3), "e=5,f=6,a=1,b=2", "Child 3 should see parent's new value");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() with limit on trace state members",
            test: () => {
                // Create a parent with more than the maximum allowed entries for hdrs
                const parentState = createW3cTraceState();
                for (let i = 0; i < 40; i++) {
                    parentState.set("key" + i, "value" + i);
                }
                
                // In memory, we can exceed 32 keys
                Assert.equal(parentState.keys.length, 40, "Parent should have all 40 keys in memory");
                Assert.equal(parentState.get("key0"), "value0", "First key should be accessible");
                Assert.equal(parentState.get("key39"), "value39", "Last key should be accessible");
                
                // When converted to headers, it's limited to 32 keys
                const headers = parentState.hdrs();
                let headersStr = headers.join(",");
                // First keys (0-7) should not be in headers as they're the oldest
                Assert.equal(headersStr.indexOf("key0=value0"), -1, "Oldest keys should not be in headers");
                Assert.equal(headersStr.indexOf("key7=value7"), -1, "Oldest keys should not be in headers");
                // Most recent keys (8-39) should be in headers
                Assert.notEqual(headersStr.indexOf("key8=value8"), -1, "More recent keys should be in headers");
                Assert.notEqual(headersStr.indexOf("key39=value39"), -1, "Most recent keys should be in headers");
                
                // Create a child state
                const childState = parentState.child();
                
                // Child should inherit all keys in memory
                Assert.equal(childState.keys.length, 40, "Child should inherit all keys in memory");
                Assert.equal(childState.get("key0"), "value0", "Child should have access to all parent keys");
                Assert.equal(childState.get("key39"), "value39", "Child should have access to all parent keys");
                
                // Add more keys to child
                for (let i = 0; i < 10; i++) {
                    childState.set("child-key" + i, "child-value" + i);
                }
                
                // In memory, child should have all keys
                Assert.equal(childState.keys.length, 50, "Child should have all 50 keys in memory");
                
                // When converted to headers and back, we should only get 32 keys
                const childHeaders = childState.hdrs();
                const roundTripState = createW3cTraceState(childHeaders.join(","));
                
                Assert.equal(roundTripState.keys.length, 32, "Round trip state should have max 32 keys");
                
                // Most recent keys should be preserved (child keys and most recent parent keys)
                Assert.equal(roundTripState.get("child-key9"), "child-value9", "Most recent child key should be preserved");
                Assert.equal(roundTripState.get("child-key0"), "child-value0", "First child key should be preserved");
                
                // Some parent keys should be dropped in the round trip
                Assert.equal(roundTripState.get("key0"), undefined, "Oldest parent keys should be dropped in round trip");
                Assert.equal(roundTripState.get("key10"), undefined, "Older parent keys should be dropped in round trip");
                
                // Make sure both original states are unaffected
                Assert.equal(parentState.keys.length, 40, "Original parent should still have 40 keys");
                Assert.equal(childState.keys.length, 50, "Original child should still have 50 keys");
            }
        });

        this.testCase({
            name: "W3cTraceState: chain of multiple child() calls",
            test: () => {
                // Create a chain of trace states using child()
                const state1 = createW3cTraceState("a=1");
                const state2 = state1.child();
                state2.set("b", "2");
                const state3 = state2.child();
                state3.set("c", "3");
                const state4 = state3.child();
                state4.set("d", "4");
                const state5 = state4.child();
                state5.set("e", "5");
                
                // Each state should have its own keys plus all ancestor keys
                Assert.equal(asString(state1), "a=1", "State 1 should have its own key");
                Assert.equal(asString(state2), "b=2,a=1", "State 2 should have its key and parent's");
                Assert.equal(asString(state3), "c=3,b=2,a=1", "State 3 should have its key and ancestors'");
                Assert.equal(asString(state4), "d=4,c=3,b=2,a=1", "State 4 should have its key and ancestors'");
                Assert.equal(asString(state5), "e=5,d=4,c=3,b=2,a=1", "State 5 should have its key and ancestors'");
                
                // Modify an ancestor, changes should propagate down the chain
                state2.set("b", "new-2");
                
                Assert.equal(state3.get("b"), "new-2", "State 3 should see updated ancestor value");
                Assert.equal(state4.get("b"), "new-2", "State 4 should see updated ancestor value");
                Assert.equal(state5.get("b"), "new-2", "State 5 should see updated ancestor value");
                
                // Delete from an ancestor, deletion should propagate
                state1.del("a");
                
                Assert.equal(state2.get("a"), undefined, "State 2 should see parent deletion");
                Assert.equal(state3.get("a"), undefined, "State 3 should see ancestor deletion");
                Assert.equal(state4.get("a"), undefined, "State 4 should see ancestor deletion");
                Assert.equal(state5.get("a"), undefined, "State 5 should see ancestor deletion");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() and toString consistency",
            test: () => {
                const parentState = createW3cTraceState("a=1,b=2");
                const childState = parentState.child();
                childState.set("c", "3");
                
                // toString and asString should be equivalent
                Assert.equal(asString(childState), childState.toString(), "toString and asString should be consistent");
                Assert.equal(childState.toString(), "c=3,a=1,b=2", "toString should reflect the current state");
                
                // toString should update when state changes
                childState.set("d", "4");
                Assert.equal(childState.toString(), "d=4,c=3,a=1,b=2", "toString should reflect updated state");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() with isW3cTraceState check",
            test: () => {
                const parentState = createW3cTraceState("a=1");
                const childState = parentState.child();
                
                // The isW3cTraceState function should recognize child instances
                Assert.equal(isW3cTraceState(childState), true, "Child should be recognized as W3cTraceState");
                
                // Compare with non-trace state objects
                Assert.equal(isW3cTraceState({}), false, "Empty object is not a trace state");
                Assert.equal(isW3cTraceState({ keys: [] }), false, "Object with only keys is not a trace state");
                Assert.equal(isW3cTraceState(null), false, "Null is not a trace state");
                Assert.equal(isW3cTraceState(undefined), false, "Undefined is not a trace state");
            }
        });
        
        this.testCase({
            name: "W3cTraceState: child() after deleting parent",
            test: () => {
                // Create a parent and child
                const parentState = createW3cTraceState("a=1,b=2");
                const childState = parentState.child();
                
                // Verify initial state
                Assert.equal(childState.get("a"), "1", "Child should have parent's key");
                
                // Simulate "deleting" the parent by removing all references
                // (Note: we can't truly delete objects in JavaScript, but we can simulate by removing all references)
                // Set all parent keys to null to simulate the parent being "gone"
                parentState.del("a");
                parentState.del("b");
                
                // Child should still function properly
                Assert.equal(childState.get("a"), undefined, "Child should see parent's deletion");
                Assert.equal(childState.get("b"), undefined, "Child should see parent's deletion");
                
                // Child should still be able to set its own values
                childState.set("c", "3");
                Assert.equal(childState.get("c"), "3", "Child should be able to set new values");
                Assert.equal(asString(childState), "c=3", "Child should have correct string representation");
            }
        });

        this.testCase({
            name: "W3cTraceState: child() with special characters in values",
            test: () => {
                // Create parent with special characters in values
                const parentState = createW3cTraceState("a=value with spaces,b=value-with-dashes,c=value_with_underscores");
                const childState = parentState.child();
                
                // Child should inherit these values correctly
                Assert.equal(childState.get("a"), "value with spaces", "Child should inherit values with spaces");
                Assert.equal(childState.get("b"), "value-with-dashes", "Child should inherit values with dashes");
                Assert.equal(childState.get("c"), "value_with_underscores", "Child should inherit values with underscores");
                
                // Child should be able to set new values with special characters
                childState.set("d", "value!with@special#chars");
                Assert.equal(childState.get("d"), "value!with@special#chars", "Child should set value with special chars");
                
                // Check string representation
                Assert.equal(asString(childState), 
                    "d=value!with@special#chars,a=value with spaces,b=value-with-dashes,c=value_with_underscores", 
                    "Child should have correct string representation with special chars");
            }
        });

        this.testCase({
            name: "W3cTraceState: serialization limits with parent and child",
            test: () => {
                // Create a parent with many keys
                const parentState = createW3cTraceState();
                for (let i = 0; i < 20; i++) {
                    parentState.set("p" + i, "parent" + i);
                }
                
                // Create a child and add many keys
                const childState = parentState.child();
                for (let i = 0; i < 20; i++) {
                    childState.set("c" + i, "child" + i);
                }
                
                // In memory, both should have their respective keys
                Assert.equal(parentState.keys.length, 20, "Parent should have 20 keys in memory");
                Assert.equal(childState.keys.length, 40, "Child should have 20 own keys + 20 parent keys");
                
                // Get the string representation of the child
                const childString = asString(childState);
                
                // Create a new state from the string representation
                const roundTripState = createW3cTraceState(childString);
                
                // Only 32 keys should survive the round trip
                Assert.equal(roundTripState.keys.length, 32, "Round-trip state should have 32 keys max");
                
                // The most recent keys should be preserved
                // Child keys should all be preserved (since they're more recent)
                Assert.equal(roundTripState.get("c19"), "child19", "Most recent child keys should be preserved");
                Assert.equal(roundTripState.get("c0"), "child0", "All child keys should be preserved");
                
                // Only the most recent parent keys should survive
                Assert.equal(roundTripState.get("p19"), "parent19", "Most recent parent keys should be preserved");
                Assert.equal(roundTripState.get("p8"), "parent8", "Recent parent keys should be preserved");
                Assert.equal(roundTripState.get("p7"), undefined, "Older parent keys should be dropped");
                Assert.equal(roundTripState.get("p0"), undefined, "Oldest parent keys should be dropped");
                
                // Test hdrs with explicit maxKeys parameter
                const limitedHeaders = childState.hdrs(undefined, 15);
                const limitedState = createW3cTraceState(limitedHeaders.join(","));
                
                Assert.equal(limitedState.keys.length, 15, "State from limited headers should respect maxKeys");
                Assert.equal(limitedState.get("c19"), "child19", "Most recent keys should be preserved with limit");
                Assert.equal(limitedState.get("c5"), "child5", "Recent keys should be preserved with limit");
                Assert.equal(limitedState.get("c4"), undefined, "Older keys should be dropped with limit");
                Assert.equal(limitedState.get("p19"), undefined, "Parent keys should be dropped with stricter limit");
            }
        });

        // Tests for snapshotW3cTraceState helper function
        this.testCase({
            name: "snapshotW3cTraceState: handle null input",
            test: () => {
                const snapshot = snapshotW3cTraceState(null as any);
                
                Assert.ok(snapshot, "Should return a valid trace state instance");
                Assert.equal(snapshot.keys.length, 0, "Snapshot should have no keys");
                Assert.equal(asString(snapshot), "", "Snapshot should have empty string representation");
                Assert.equal(snapshot.isEmpty, true, "Snapshot should be empty");
            }
        });

        this.testCase({
            name: "snapshotW3cTraceState: handle undefined input",
            test: () => {
                const snapshot = snapshotW3cTraceState(undefined as any);
                
                Assert.ok(snapshot, "Should return a valid trace state instance");
                Assert.equal(snapshot.keys.length, 0, "Snapshot should have no keys");
                Assert.equal(asString(snapshot), "", "Snapshot should have empty string representation");
                Assert.equal(snapshot.isEmpty, true, "Snapshot should be empty");
            }
        });

        this.testCase({
            name: "snapshotW3cTraceState: handle empty trace state",
            test: () => {
                const original = createW3cTraceState();
                const snapshot = snapshotW3cTraceState(original);
                
                Assert.ok(snapshot, "Should return a valid trace state instance");
                Assert.notEqual(snapshot, original, "Should return a different instance");
                Assert.equal(snapshot.keys.length, 0, "Snapshot should have no keys");
                Assert.equal(asString(snapshot), "", "Snapshot should have empty string representation");
                Assert.equal(snapshot.isEmpty, true, "Snapshot should be empty");
            }
        });

        this.testCase({
            name: "snapshotW3cTraceState: capture simple trace state",
            test: () => {
                const original = createW3cTraceState("a=1,b=2,c=3");
                const snapshot = snapshotW3cTraceState(original);
                
                Assert.ok(snapshot, "Should return a valid trace state instance");
                Assert.notEqual(snapshot, original, "Should return a different instance");
                Assert.equal(snapshot.keys.length, 3, "Snapshot should have 3 keys");
                Assert.deepEqual(snapshot.keys, ["a", "b", "c"], "Snapshot should have correct keys");
                Assert.equal(snapshot.get("a"), "1", "Snapshot should have correct value for 'a'");
                Assert.equal(snapshot.get("b"), "2", "Snapshot should have correct value for 'b'");
                Assert.equal(snapshot.get("c"), "3", "Snapshot should have correct value for 'c'");
                Assert.equal(asString(snapshot), "a=1,b=2,c=3", "Snapshot should have correct string representation");
                Assert.equal(snapshot.isEmpty, false, "Snapshot should not be empty");
            }
        });

        this.testCase({
            name: "snapshotW3cTraceState: snapshot is independent from original",
            test: () => {
                const original = createW3cTraceState("a=1,b=2,c=3");
                const snapshot = snapshotW3cTraceState(original);
                
                // Initial state should be identical
                Assert.equal(asString(snapshot), asString(original), "Initial state should be identical");
                
                // Modify original after snapshot
                original.set("d", "4");
                original.set("a", "modified");
                original.del("b");
                
                // Snapshot should remain unchanged
                Assert.equal(snapshot.keys.length, 3, "Snapshot should still have 3 keys");
                Assert.equal(snapshot.get("a"), "1", "Snapshot should have original value for 'a'");
                Assert.equal(snapshot.get("b"), "2", "Snapshot should still have 'b' key");
                Assert.equal(snapshot.get("c"), "3", "Snapshot should have original value for 'c'");
                Assert.equal(snapshot.get("d"), undefined, "Snapshot should not have new 'd' key");
                Assert.equal(asString(snapshot), "a=1,b=2,c=3", "Snapshot should have original string representation");
                
                // Original should have changes
                Assert.equal(original.keys.length, 3, "Original should have 3 keys after modification");
                Assert.equal(original.get("a"), "modified", "Original should have modified value for 'a'");
                Assert.equal(original.get("b"), undefined, "Original should not have 'b' key after deletion");
                Assert.equal(original.get("c"), "3", "Original should have original value for 'c'");
                Assert.equal(original.get("d"), "4", "Original should have new 'd' key");
                Assert.equal(asString(original), "a=modified,d=4,c=3", "Original should have modified string representation");
            }
        });

        this.testCase({
            name: "snapshotW3cTraceState: snapshot with parent trace state",
            test: () => {
                const parentState = createW3cTraceState("parent1=value1,parent2=value2");
                const childState = createW3cTraceState("child1=cvalue1,child2=cvalue2", parentState);
                
                // Verify child state includes parent values
                Assert.equal(childState.keys.length, 4, "Child should have 4 keys");
                Assert.equal(childState.get("parent1"), "value1", "Child should have parent1 value");
                Assert.equal(childState.get("parent2"), "value2", "Child should have parent2 value");
                Assert.equal(childState.get("child1"), "cvalue1", "Child should have child1 value");
                Assert.equal(childState.get("child2"), "cvalue2", "Child should have child2 value");
                
                // Take snapshot of child state
                const snapshot = snapshotW3cTraceState(childState);
                
                Assert.ok(snapshot, "Should return a valid trace state instance");
                Assert.notEqual(snapshot, childState, "Should return a different instance");
                Assert.equal(snapshot.keys.length, 4, "Snapshot should have 4 keys");
                Assert.equal(snapshot.get("parent1"), "value1", "Snapshot should have parent1 value");
                Assert.equal(snapshot.get("parent2"), "value2", "Snapshot should have parent2 value");
                Assert.equal(snapshot.get("child1"), "cvalue1", "Snapshot should have child1 value");
                Assert.equal(snapshot.get("child2"), "cvalue2", "Snapshot should have child2 value");
                
                // Verify snapshot string representation includes all values
                const snapshotStr = asString(snapshot);
                Assert.ok(snapshotStr.includes("parent1=value1"), "Snapshot string should include parent1");
                Assert.ok(snapshotStr.includes("parent2=value2"), "Snapshot string should include parent2");
                Assert.ok(snapshotStr.includes("child1=cvalue1"), "Snapshot string should include child1");
                Assert.ok(snapshotStr.includes("child2=cvalue2"), "Snapshot string should include child2");
                
                // Check that snapshot has no parent (is independent)
                Assert.equal((snapshot as any)._p, null, "Snapshot should have no parent");
            }
        });

        this.testCase({
            name: "snapshotW3cTraceState: snapshot remains unchanged when parent/child modified",
            test: () => {
                const parentState = createW3cTraceState("parent1=value1,parent2=value2");
                const childState = createW3cTraceState("child1=cvalue1", parentState);
                
                // Take snapshot before modifications
                const snapshot = snapshotW3cTraceState(childState);
                
                // Initial verification
                Assert.equal(snapshot.keys.length, 3, "Snapshot should have 3 keys initially");
                Assert.equal(snapshot.get("parent1"), "value1", "Snapshot should have parent1 value");
                Assert.equal(snapshot.get("parent2"), "value2", "Snapshot should have parent2 value");
                Assert.equal(snapshot.get("child1"), "cvalue1", "Snapshot should have child1 value");
                
                // Modify parent state
                parentState.set("parent1", "modified_parent1");
                parentState.set("parent3", "new_parent3");
                parentState.del("parent2");
                
                // Modify child state
                childState.set("child1", "modified_child1");
                childState.set("child2", "new_child2");
                
                // Snapshot should remain unchanged
                Assert.equal(snapshot.keys.length, 3, "Snapshot should still have 3 keys");
                Assert.equal(snapshot.get("parent1"), "value1", "Snapshot should have original parent1 value");
                Assert.equal(snapshot.get("parent2"), "value2", "Snapshot should have original parent2 value");
                Assert.equal(snapshot.get("child1"), "cvalue1", "Snapshot should have original child1 value");
                Assert.equal(snapshot.get("parent3"), undefined, "Snapshot should not have new parent3");
                Assert.equal(snapshot.get("child2"), undefined, "Snapshot should not have new child2");
                
                // Child state should reflect changes
                Assert.equal(childState.get("parent1"), "modified_parent1", "Child should have modified parent1");
                Assert.equal(childState.get("parent2"), undefined, "Child should not have deleted parent2");
                Assert.equal(childState.get("parent3"), "new_parent3", "Child should have new parent3");
                Assert.equal(childState.get("child1"), "modified_child1", "Child should have modified child1");
                Assert.equal(childState.get("child2"), "new_child2", "Child should have new child2");
            }
        });

        this.testCase({
            name: "snapshotW3cTraceState: snapshot with overridden parent values",
            test: () => {
                const parentState = createW3cTraceState("a=parent_a,b=parent_b,c=parent_c");
                const childState = createW3cTraceState("a=child_a,d=child_d", parentState);
                
                // Verify child state has overridden parent value
                Assert.equal(childState.get("a"), "child_a", "Child should have overridden value for 'a'");
                Assert.equal(childState.get("b"), "parent_b", "Child should have parent value for 'b'");
                Assert.equal(childState.get("c"), "parent_c", "Child should have parent value for 'c'");
                Assert.equal(childState.get("d"), "child_d", "Child should have its own value for 'd'");
                
                // Take snapshot
                const snapshot = snapshotW3cTraceState(childState);
                
                Assert.equal(snapshot.keys.length, 4, "Snapshot should have 4 keys");
                Assert.equal(snapshot.get("a"), "child_a", "Snapshot should have overridden value for 'a'");
                Assert.equal(snapshot.get("b"), "parent_b", "Snapshot should have parent value for 'b'");
                Assert.equal(snapshot.get("c"), "parent_c", "Snapshot should have parent value for 'c'");
                Assert.equal(snapshot.get("d"), "child_d", "Snapshot should have child value for 'd'");
                
                // Verify snapshot string representation
                const snapshotStr = asString(snapshot);
                Assert.ok(snapshotStr.includes("a=child_a"), "Snapshot should include overridden value");
                Assert.ok(snapshotStr.includes("b=parent_b"), "Snapshot should include parent value");
                Assert.ok(snapshotStr.includes("c=parent_c"), "Snapshot should include parent value");
                Assert.ok(snapshotStr.includes("d=child_d"), "Snapshot should include child value");
                
                // Modify parent's overridden key
                parentState.set("a", "new_parent_a");
                
                // Snapshot should still have the overridden value
                Assert.equal(snapshot.get("a"), "child_a", "Snapshot should keep overridden value despite parent change");
            }
        });

        this.testCase({
            name: "snapshotW3cTraceState: snapshot with deleted parent keys",
            test: () => {
                const parentState = createW3cTraceState("a=parent_a,b=parent_b,c=parent_c");
                const childState = createW3cTraceState("d=child_d", parentState);
                
                // Delete a parent key in the child
                childState.del("b");
                
                // Verify child state behavior
                Assert.equal(childState.get("a"), "parent_a", "Child should have parent value for 'a'");
                Assert.equal(childState.get("b"), undefined, "Child should not have deleted 'b' key");
                Assert.equal(childState.get("c"), "parent_c", "Child should have parent value for 'c'");
                Assert.equal(childState.get("d"), "child_d", "Child should have its own value for 'd'");
                
                // Take snapshot
                const snapshot = snapshotW3cTraceState(childState);
                
                Assert.equal(snapshot.keys.length, 3, "Snapshot should have 3 keys (deleted key excluded)");
                Assert.equal(snapshot.get("a"), "parent_a", "Snapshot should have parent value for 'a'");
                Assert.equal(snapshot.get("b"), undefined, "Snapshot should not have deleted 'b' key");
                Assert.equal(snapshot.get("c"), "parent_c", "Snapshot should have parent value for 'c'");
                Assert.equal(snapshot.get("d"), "child_d", "Snapshot should have child value for 'd'");
                
                // Verify snapshot string representation doesn't include deleted key
                const snapshotStr = asString(snapshot);
                Assert.ok(!snapshotStr.includes("b="), "Snapshot should not include deleted key");
                Assert.ok(snapshotStr.includes("a=parent_a"), "Snapshot should include parent value");
                Assert.ok(snapshotStr.includes("c=parent_c"), "Snapshot should include parent value");
                Assert.ok(snapshotStr.includes("d=child_d"), "Snapshot should include child value");
                
                // Re-add the deleted key in parent after snapshot
                parentState.set("b", "restored_parent_b");
                
                // Snapshot should still not have the key
                Assert.equal(snapshot.get("b"), undefined, "Snapshot should not have restored key");
                
                // Child state should also not have the key since it was deleted before child creation
                Assert.equal(childState.get("b"), undefined, "Child should not have restored key");
            }
        });
    }
}
