import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { createW3cTraceState } from "../../../src/JavaScriptSDK/W3cTraceState";
import { asString, strRepeat } from "@nevware21/ts-utils";

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
            }
        });

        this.testCase({
            name: "W3cTraceState: handle empty string",
            test: () => {
                const traceState = createW3cTraceState("");
                Assert.equal(traceState.keys.length, 0);
                Assert.equal(traceState.hdrs().length, 0);
                Assert.equal(asString(traceState), "");
            }
        });

        this.testCase({
            name: "W3cTraceState: handle null",
            test: () => {
                const traceState = createW3cTraceState(null as any);
                Assert.equal(traceState.keys.length, 0);
                Assert.equal(traceState.hdrs().length, 0);
                Assert.equal(asString(traceState), "");
            }
        });

        this.testCase({
            name: "W3cTraceState: handle undefined",
            test: () => {
                const traceState = createW3cTraceState(undefined);
                Assert.equal(traceState.keys.length, 0);
                Assert.equal(traceState.hdrs().length, 0);
                Assert.equal(asString(traceState), "");
            }
        });

        this.testCase({
            name: "W3cTraceState: toString",
            test: () => {
                const traceState = createW3cTraceState("a=1,b=2,c=3");
                Assert.equal(traceState.keys.length, 3);
                Assert.deepEqual(["a", "b", "c"], traceState.keys);
                Assert.equal(asString(traceState), "a=1,b=2,c=3");
            }
        });

        this.testCase({
            name: "W3cTraceState: handle invalid input",
            test: () => {
                const traceState = createW3cTraceState({} as any);
                Assert.equal(traceState.keys.length, 0);
                Assert.equal(traceState.hdrs().length, 0);
                Assert.equal(asString(traceState), "");
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
                traceState.del("b");
                Assert.equal(asString(traceState), "a=4,c=6");
                Assert.equal(traceState.keys.length, 2);
                Assert.deepEqual(["a", "c"], traceState.keys);

                traceState.del("a");
                Assert.equal(asString(traceState), "c=6");
                Assert.equal(traceState.keys.length, 1);
                Assert.deepEqual(["c"], traceState.keys);
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
    }
}