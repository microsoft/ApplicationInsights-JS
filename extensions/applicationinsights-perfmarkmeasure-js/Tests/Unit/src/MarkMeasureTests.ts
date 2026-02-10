/**
 * @copyright Microsoft 2020
 */

import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { ITelemetryItem, AppInsightsCore, IPlugin, IConfiguration, DiagnosticLogger, IAppInsightsCore, ITelemetryPluginChain, doPerf, EventsDiscardedReason, INotificationManager, IPerfEvent} from "@microsoft/otel-core-js";
import { PerfMarkMeasureManager } from "../../../src/PerfMarkMeasureManager";

export interface PerfMeasures {
    name: string;
    from: string;
    to: string;
};

export class MarkMeasureTests extends AITestClass {
    _marks: string[] = [];
    _measures: PerfMeasures[] = [];

    public testInitialize() {
        this._marks = [];
        this._measures = [];

        this.mockPerformance({
            mark: (name: string) => {
                this._marks.push(name);
            },
            measure: (name, from, to) => {
                this._measures.push({ name, from, to });
            }
        });
    }

    public testCleanup() {
    }

    public registerTests() {
        this.testCase({
            name: "Empty Initialization still calls mark and measure",
            test: () => {
                const manager = new PerfMarkMeasureManager();
                const core = new AppInsightsCore();
                core.setPerfMgr(manager);
                const channel = new ChannelPlugin();
                core.initialize({
                    instrumentationKey: 'testIkey',
                } as IConfiguration, [channel]);
                
                const element = document.createElement('a');
                let markSpy = this.sandbox.spy(window.performance, 'mark');   
                let measureSpy = this.sandbox.spy(window.performance, 'measure');   
                core.track({ 
                    name: "Test",
                    sync: true
                } as ITelemetryItem);
                Assert.equal(true, markSpy.called);
                Assert.equal(true, measureSpy.called);

                Assert.equal(true, this._marks.length > 0);
                for (let lp = 0; lp < this._marks.length; lp++) {
                    let mark = this._marks[lp];
                    // Making sure there are no "end" marks
                    Assert.equal(0, mark.indexOf("ai.prfmrk."), "Checking mark - " + mark)
                    Assert.equal(-1, mark.indexOf("ai.prfmrk-end."), "Checking mark - " + mark)
                }

                Assert.equal(true, this._measures.length > 0);
                for (let lp = 0; lp < this._measures.length; lp++) {
                    let measure = this._measures[lp];
                    // Making sure the measure mark is correct
                    Assert.equal(0, measure.name.indexOf("ai.prfmsr."), "Checking measure - " + JSON.stringify(measure));
                    Assert.equal(0, measure.from.indexOf("ai.prfmrk."), "Checking from measure - " + JSON.stringify(measure));
                    Assert.equal(undefined, measure.to, "Checking to measure - " + JSON.stringify(measure));
                }
            }
        });

        this.testCase({
            name: "Disable measure but keep mark",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMeasures: false
                });
                const core = new AppInsightsCore();
                core.setPerfMgr(manager);
                const channel = new ChannelPlugin();
                core.initialize({
                    instrumentationKey: 'testIkey',
                } as IConfiguration, [channel]);
                
                const element = document.createElement('a');
                let markSpy = this.sandbox.spy(window.performance, 'mark');   
                let measureSpy = this.sandbox.spy(window.performance, 'measure');   
                core.track({ 
                    name: "Test",
                    sync: true
                } as ITelemetryItem);
                Assert.equal(true, markSpy.called);
                Assert.equal(false, measureSpy.called);

                Assert.equal(true, this._marks.length > 0);
                for (let lp = 0; lp < this._marks.length; lp++) {
                    let mark = this._marks[lp];
                    // Making sure there are no "end" marks
                    Assert.equal(0, mark.indexOf("ai.prfmrk."), "Checking mark - " + mark)
                    Assert.equal(-1, mark.indexOf("ai.prfmrk-end."), "Checking mark - " + mark)
                }
                Assert.equal(0, this._measures.length);
            }
        });

        this.testCase({
            name: "Disable measure but use end marks",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMeasures: false,
                    useEndMarks: true
                });
                const core = new AppInsightsCore();
                core.setPerfMgr(manager);
                const channel = new ChannelPlugin();
                core.initialize({
                    instrumentationKey: 'testIkey',
                } as IConfiguration, [channel]);
                
                const element = document.createElement('a');
                let markSpy = this.sandbox.spy(window.performance, 'mark');   
                let measureSpy = this.sandbox.spy(window.performance, 'measure');   
                core.track({ 
                    name: "Test",
                    sync: true
                } as ITelemetryItem);
                Assert.equal(true, markSpy.called);
                Assert.equal(false, measureSpy.called);

                Assert.equal(true, this._marks.length > 0);
                let numStart = 0;
                let numEnd = 0;
                for (let lp = 0; lp < this._marks.length; lp++) {
                    let mark = this._marks[lp];
                    if (mark.indexOf("ai.prfmrk.") !== -1) {
                        numStart++;

                        let foundEnd = false;
                        for (let lp2 = lp + 1; lp2 < this._marks.length; lp2++) {
                            if (this._marks[lp2].indexOf("ai.prfmrk-end." + mark.substring(10)) !== -1) {
                                foundEnd = true;
                                break;
                            }
                        }
                        Assert.equal(true, foundEnd, "Expect to find and end mark for " + mark);
                    }

                    if (mark.indexOf("ai.prfmrk-end.") !== -1) {
                        numEnd++;
                    }
                }

                Assert.equal(numStart, numEnd, "Should be same number of start and end marks");
                Assert.equal(0, this._measures.length);
            }
        });

        this.testCase({
            name: "Disable marks but keep measure",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: false
                });
                const core = new AppInsightsCore();
                core.setPerfMgr(manager);
                const channel = new ChannelPlugin();
                core.initialize({
                    instrumentationKey: 'testIkey',
                } as IConfiguration, [channel]);
                
                const element = document.createElement('a');
                let markSpy = this.sandbox.spy(window.performance, 'mark');   
                let measureSpy = this.sandbox.spy(window.performance, 'measure');   
                core.track({ 
                    name: "Test",
                    sync: true
                } as ITelemetryItem);
                Assert.equal(false, markSpy.called);
                Assert.equal(true, measureSpy.called);
                Assert.equal(0, this._marks.length, "No Marks expected");
                for (let lp = 0; lp < this._measures.length; lp++) {
                    let measure = this._measures[lp];
                    // Making sure the measure mark is correct
                    Assert.equal(0, measure.name.indexOf("ai.prfmsr."), "Checking measure - " + JSON.stringify(measure));
                    Assert.equal(undefined, measure.from, "Checking from measure - " + JSON.stringify(measure));
                    Assert.equal(undefined, measure.to, "Checking to measure - " + JSON.stringify(measure));
                }
            }
        });

        this.testCase({
            name: "Enable start and end marks with measure",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    useMeasures: true
                });
                const core = new AppInsightsCore();
                core.setPerfMgr(manager);
                const channel = new ChannelPlugin();
                core.initialize({
                    instrumentationKey: 'testIkey',
                } as IConfiguration, [channel]);
                
                const element = document.createElement('a');
                let markSpy = this.sandbox.spy(window.performance, 'mark');   
                let measureSpy = this.sandbox.spy(window.performance, 'measure');   
                core.track({ 
                    name: "Test",
                    sync: true
                } as ITelemetryItem);
                Assert.equal(true, markSpy.called);
                Assert.equal(true, measureSpy.called);
                Assert.equal(true, this._marks.length > 0);

                let numStart = 0;
                let numEnd = 0;
                for (let lp = 0; lp < this._marks.length; lp++) {
                    let mark = this._marks[lp];
                    if (mark.indexOf("ai.prfmrk.") !== -1) {
                        numStart++;

                        let foundEnd = false;
                        for (let lp2 = lp + 1; lp2 < this._marks.length; lp2++) {
                            if (this._marks[lp2].indexOf("ai.prfmrk-end." + mark.substring(10)) !== -1) {
                                foundEnd = true;
                                break;
                            }
                        }
                        Assert.equal(true, foundEnd, "Expect to find and end mark for " + mark);
                    }

                    if (mark.indexOf("ai.prfmrk-end.") !== -1) {
                        numEnd++;
                    }
                }

                Assert.equal(numStart, numEnd, "Should be same number of start and end marks");

                Assert.equal(true, this._measures.length > 0);
                for (let lp = 0; lp < this._measures.length; lp++) {
                    let measure = this._measures[lp];
                    // Making sure the measure mark is correct
                    Assert.equal(0, measure.name.indexOf("ai.prfmsr."), "Checking measure - " + JSON.stringify(measure));
                    Assert.equal(0, measure.from.indexOf("ai.prfmrk." + measure.name.substring(10)), "Checking from measure - " + JSON.stringify(measure));
                    Assert.equal(0, measure.to.indexOf("ai.prfmrk-end." + measure.name.substring(10)), "Checking to measure - " + JSON.stringify(measure));
                }
            }
        });

        this.testCase({
            name: "Enable start and end marks with measure with unique names",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    useMeasures: true,
                    uniqueNames: true
                });
                const core = new AppInsightsCore();
                core.setPerfMgr(manager);
                const channel = new ChannelPlugin();
                core.initialize({
                    instrumentationKey: 'testIkey',
                } as IConfiguration, [channel]);
                
                const element = document.createElement('a');
                let markSpy = this.sandbox.spy(window.performance, 'mark');   
                let measureSpy = this.sandbox.spy(window.performance, 'measure');   
                core.track({ 
                    name: "Test1",
                    sync: true
                } as ITelemetryItem);
                core.track({ 
                    name: "Test2",
                    sync: true
                } as ITelemetryItem);
                Assert.equal(true, markSpy.called);
                Assert.equal(true, measureSpy.called);
                Assert.equal(true, this._marks.length > 0);

                let numStart = 0;
                let numEnd = 0;
                for (let lp = 0; lp < this._marks.length; lp++) {
                    let mark = this._marks[lp];
                    if (mark.indexOf("ai.prfmrk.") !== -1) {
                        numStart++;
                        Assert.notEqual(-1, "0123456789".indexOf(mark[10]), "Make sure there is a numeric value for " + mark);

                        let foundEnd = false;
                        for (let lp2 = lp + 1; lp2 < this._marks.length; lp2++) {
                            if (this._marks[lp2].indexOf("ai.prfmrk-end." + mark.substring(10)) !== -1) {
                                foundEnd = true;
                                break;
                            }
                        }
                        Assert.equal(true, foundEnd, "Expect to find and end mark for " + mark);
                    }

                    if (mark.indexOf("ai.prfmrk-end.") !== -1) {
                        numEnd++;
                    }
                }

                Assert.equal(numStart, numEnd, "Should be same number of start and end marks");
                Assert.equal(true, this._measures.length > 0);

                for (let lp = 0; lp < this._measures.length; lp++) {
                    let measure = this._measures[lp];
                    // Making sure the measure mark is correct
                    Assert.equal(0, measure.name.indexOf("ai.prfmsr."), "Checking measure - " + JSON.stringify(measure));
                    Assert.equal(0, measure.from.indexOf("ai.prfmrk." + measure.name.substring(10)), "Checking from measure - " + JSON.stringify(measure));
                    Assert.equal(0, measure.to.indexOf("ai.prfmrk-end." + measure.name.substring(10)), "Checking to measure - " + JSON.stringify(measure));
                }
            }
        });

        this.testCase({
            name: "Test with direct doPerf() usage with defaults",
            test: () => {
                const manager = new PerfMarkMeasureManager();

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test1", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.test1", this._marks[0]);
                });
                Assert.equal(1, this._marks.length);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.test1", this._measures[0].name);
                Assert.equal("ai.prfmrk.test1", this._measures[0].from);
                Assert.equal(undefined, this._measures[0].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): Specific enable start marks",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.test", this._marks[0]);
                });
                Assert.equal(1, this._marks.length);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.test", this._measures[0].name);
                Assert.equal("ai.prfmrk.test", this._measures[0].from);
                Assert.equal(undefined, this._measures[0].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): Specific enable start marks with unique",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    uniqueNames: true
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.0.test", this._marks[0]);
                });
                Assert.equal(1, this._marks.length);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.0.test", this._measures[0].name);
                Assert.equal("ai.prfmrk.0.test", this._measures[0].from);
                Assert.equal(undefined, this._measures[0].to);

                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(2, this._marks.length);
                    Assert.equal("ai.prfmrk.1.test2", this._marks[1]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal(2, this._measures.length);
                Assert.equal("ai.prfmsr.1.test2", this._measures[1].name);
                Assert.equal("ai.prfmrk.1.test2", this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): with start and end marks",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.test", this._marks[0]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal("ai.prfmrk-end.test", this._marks[1]);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.test", this._measures[0].name);
                Assert.equal("ai.prfmrk.test", this._measures[0].from);
                Assert.equal("ai.prfmrk-end.test", this._measures[0].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): with start and end marks with unique",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    uniqueNames: true
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.0.test", this._marks[0]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal("ai.prfmrk-end.0.test", this._marks[1]);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.0.test", this._measures[0].name);
                Assert.equal("ai.prfmrk.0.test", this._measures[0].from);
                Assert.equal("ai.prfmrk-end.0.test", this._measures[0].to);

                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(3, this._marks.length);
                    Assert.equal("ai.prfmrk.1.test2", this._marks[2]);
                });
                Assert.equal(4, this._marks.length);
                Assert.equal("ai.prfmrk-end.1.test2", this._marks[3]);
                Assert.equal(2, this._measures.length);
                Assert.equal("ai.prfmsr.1.test2", this._measures[1].name);
                Assert.equal("ai.prfmrk.1.test2", this._measures[1].from);
                Assert.equal("ai.prfmrk-end.1.test2", this._measures[1].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): Disable Marks",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: false
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(0, this._marks.length);
                });
                Assert.equal(0, this._marks.length);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.test2", this._measures[0].name);
                Assert.equal(undefined, this._measures[0].from);
                Assert.equal(undefined, this._measures[0].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): Disable Marks with unique",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: false,
                    uniqueNames: true
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(0, this._marks.length);
                });
                Assert.equal(0, this._marks.length);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.0.test2", this._measures[0].name);
                Assert.equal(undefined, this._measures[0].from);
                Assert.equal(undefined, this._measures[0].to);

                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(0, this._marks.length);
                });
                Assert.equal(0, this._marks.length);
                Assert.equal(2, this._measures.length);
                Assert.equal("ai.prfmsr.1.test3", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): Disable Measures",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMeasures: false
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.test3", this._marks[0]);
                });
                Assert.equal(1, this._marks.length);
                Assert.equal(0, this._measures.length);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): Disable Measures with unique",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMeasures: false,
                    uniqueNames: true
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.0.test3", this._marks[0]);
                });
                Assert.equal(1, this._marks.length);
                Assert.equal(0, this._measures.length);

                doPerf(manager, () => "test4", (perfEvent) => {
                    Assert.equal(2, this._marks.length);
                    Assert.equal("ai.prfmrk.1.test4", this._marks[1]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal(0, this._measures.length);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): with mark name map",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    markNameMap: {
                        "test": "mapped1",
                        "test3": "mapped3"
                    }
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.mapped1", this._marks[0]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal("ai.prfmrk-end.mapped1", this._marks[1]);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.mapped1", this._measures[0].name);
                Assert.equal("ai.prfmrk.mapped1", this._measures[0].from);
                Assert.equal("ai.prfmrk-end.mapped1", this._measures[0].to);

                // Unmapped name is dropped
                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(2, this._marks.length);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal(1, this._measures.length);

                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(3, this._marks.length);
                    Assert.equal("ai.prfmrk.mapped3", this._marks[2]);
                });
                Assert.equal(4, this._marks.length);
                Assert.equal("ai.prfmrk-end.mapped3", this._marks[3]);
                Assert.equal(2, this._measures.length);
                Assert.equal("ai.prfmsr.mapped3", this._measures[1].name);
                Assert.equal("ai.prfmrk.mapped3", this._measures[1].from);
                Assert.equal("ai.prfmrk-end.mapped3", this._measures[1].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): with mark name map with unique",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    uniqueNames: true,
                    markNameMap: {
                        "test": "mapped1",
                        "test3": "mapped3"
                    }
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.0.mapped1", this._marks[0]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal("ai.prfmrk-end.0.mapped1", this._marks[1]);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.0.mapped1", this._measures[0].name);
                Assert.equal("ai.prfmrk.0.mapped1", this._measures[0].from);
                Assert.equal("ai.prfmrk-end.0.mapped1", this._measures[0].to);

                // Unmapped name is dropped
                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(2, this._marks.length);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal(1, this._measures.length);

                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(3, this._marks.length);
                    Assert.equal("ai.prfmrk.2.mapped3", this._marks[2]);
                });
                Assert.equal(4, this._marks.length);
                Assert.equal("ai.prfmrk-end.2.mapped3", this._marks[3]);
                Assert.equal(2, this._measures.length);
                Assert.equal("ai.prfmsr.2.mapped3", this._measures[1].name);
                Assert.equal("ai.prfmrk.2.mapped3", this._measures[1].from);
                Assert.equal("ai.prfmrk-end.2.mapped3", this._measures[1].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): with mark name map and measure map",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    markNameMap: {
                        "test": "mapped1",
                        "test3": "mapped3"
                    },
                    measureNameMap: {
                        "test": "measure1",
                        "test2": "measure2"
                    }
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.mapped1", this._marks[0]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal("ai.prfmrk-end.mapped1", this._marks[1]);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.measure1", this._measures[0].name);
                Assert.equal("ai.prfmrk.mapped1", this._measures[0].from);
                Assert.equal("ai.prfmrk-end.mapped1", this._measures[0].to);

                // Unmapped name is dropped
                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(2, this._marks.length);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal(2, this._measures.length);
                Assert.equal("ai.prfmsr.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);

                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(3, this._marks.length);
                    Assert.equal("ai.prfmrk.mapped3", this._marks[2]);
                });
                Assert.equal(4, this._marks.length);
                Assert.equal("ai.prfmrk-end.mapped3", this._marks[3]);
                Assert.equal(2, this._measures.length);
                Assert.equal("ai.prfmsr.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): with mark name map and measure map with unique",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    uniqueNames: true,
                    markNameMap: {
                        "test": "mapped1",
                        "test3": "mapped3"
                    },
                    measureNameMap: {
                        "test": "measure1",
                        "test2": "measure2"
                    }
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("ai.prfmrk.0.mapped1", this._marks[0]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal("ai.prfmrk-end.0.mapped1", this._marks[1]);
                Assert.equal(1, this._measures.length);
                Assert.equal("ai.prfmsr.0.measure1", this._measures[0].name);
                Assert.equal("ai.prfmrk.0.mapped1", this._measures[0].from);
                Assert.equal("ai.prfmrk-end.0.mapped1", this._measures[0].to);

                // Unmapped name is dropped
                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(2, this._marks.length);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal(2, this._measures.length);
                Assert.equal("ai.prfmsr.1.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);

                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(3, this._marks.length);
                    Assert.equal("ai.prfmrk.2.mapped3", this._marks[2]);
                });
                Assert.equal(4, this._marks.length);
                Assert.equal("ai.prfmrk-end.2.mapped3", this._marks[3]);
                Assert.equal(2, this._measures.length);
                Assert.equal("ai.prfmsr.1.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): with mark name map, measure map and prefixes",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    markPrefix: "tst.mark.",
                    markEndPrefix: "tst.markend.",
                    measurePrefix: "tst.measure.",
                    markNameMap: {
                        "test": "mapped1",
                        "test3": "mapped3"
                    },
                    measureNameMap: {
                        "test": "measure1",
                        "test2": "measure2"
                    }
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("tst.mark.mapped1", this._marks[0]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal("tst.markend.mapped1", this._marks[1]);
                Assert.equal(1, this._measures.length);
                Assert.equal("tst.measure.measure1", this._measures[0].name);
                Assert.equal("tst.mark.mapped1", this._measures[0].from);
                Assert.equal("tst.markend.mapped1", this._measures[0].to);

                // Unmapped name is dropped
                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(2, this._marks.length);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal(2, this._measures.length);
                Assert.equal("tst.measure.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);

                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(3, this._marks.length);
                    Assert.equal("tst.mark.mapped3", this._marks[2]);
                });
                Assert.equal(4, this._marks.length);
                Assert.equal("tst.markend.mapped3", this._marks[3]);
                Assert.equal(2, this._measures.length);
                Assert.equal("tst.measure.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): with mark name map and measure map with unique",
            test: () => {
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    uniqueNames: true,
                    markPrefix: "tst.mark.",
                    markEndPrefix: "tst.markend.",
                    measurePrefix: "tst.measure.",
                    markNameMap: {
                        "test": "mapped1",
                        "test3": "mapped3"
                    },
                    measureNameMap: {
                        "test": "measure1",
                        "test2": "measure2"
                    }
                });

                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(1, this._marks.length);
                    Assert.equal("tst.mark.0.mapped1", this._marks[0]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal("tst.markend.0.mapped1", this._marks[1]);
                Assert.equal(1, this._measures.length);
                Assert.equal("tst.measure.0.measure1", this._measures[0].name);
                Assert.equal("tst.mark.0.mapped1", this._measures[0].from);
                Assert.equal("tst.markend.0.mapped1", this._measures[0].to);

                // Unmapped name is dropped
                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(2, this._marks.length);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal(2, this._measures.length);
                Assert.equal("tst.measure.1.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);

                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(3, this._marks.length);
                    Assert.equal("tst.mark.2.mapped3", this._marks[2]);
                });
                Assert.equal(4, this._marks.length);
                Assert.equal("tst.markend.2.mapped3", this._marks[3]);
                Assert.equal(2, this._measures.length);
                Assert.equal("tst.measure.1.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);
            }
        });

        this.testCase({
            name: "Test with direct doPerf(): with mark name map and measure map with unique using notification manager",
            test: () => {
                let perfEvents: IPerfEvent[] = [];
                const manager = new PerfMarkMeasureManager({
                    useMarks: true,
                    useEndMarks: true,
                    uniqueNames: true,
                    markPrefix: "tst.mark.",
                    markEndPrefix: "tst.markend.",
                    measurePrefix: "tst.measure.",
                    markNameMap: {
                        "test": "mapped1",
                        "test3": "mapped3"
                    },
                    measureNameMap: {
                        "test": "measure1",
                        "test2": "measure2"
                    }
                },
                {
                    perfEvent: (perfEvent) => {
                        perfEvents.push(perfEvent);
                    }
                } as INotificationManager);

                Assert.equal(0, perfEvents.length);
                Assert.equal(0, this._marks.length);
                doPerf(manager, () => "test", (perfEvent) => {
                    Assert.equal(0, perfEvents.length);
                    Assert.equal(1, this._marks.length);
                    Assert.equal("tst.mark.0.mapped1", this._marks[0]);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal("tst.markend.0.mapped1", this._marks[1]);
                Assert.equal(1, this._measures.length);
                Assert.equal("tst.measure.0.measure1", this._measures[0].name);
                Assert.equal("tst.mark.0.mapped1", this._measures[0].from);
                Assert.equal("tst.markend.0.mapped1", this._measures[0].to);
                Assert.equal(1, perfEvents.length);
                Assert.equal("test", perfEvents[0].name);

                // Unmapped name is dropped
                doPerf(manager, () => "test2", (perfEvent) => {
                    Assert.equal(2, this._marks.length);
                });
                Assert.equal(2, this._marks.length);
                Assert.equal(2, this._measures.length);
                Assert.equal("tst.measure.1.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);
                Assert.equal(2, perfEvents.length);
                Assert.equal("test2", perfEvents[1].name);

                doPerf(manager, () => "test3", (perfEvent) => {
                    Assert.equal(3, this._marks.length);
                    Assert.equal("tst.mark.2.mapped3", this._marks[2]);
                });
                Assert.equal(4, this._marks.length);
                Assert.equal("tst.markend.2.mapped3", this._marks[3]);
                Assert.equal(2, this._measures.length);
                Assert.equal("tst.measure.1.measure2", this._measures[1].name);
                Assert.equal(undefined, this._measures[1].from);
                Assert.equal(undefined, this._measures[1].to);
                Assert.equal(3, perfEvents.length);
                Assert.equal("test3", perfEvents[2].name);
            }
        });
    }
}

class ChannelPlugin implements IPlugin {

    public isFlushInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    public identifier = "Sender";

    public priority: number = 1001;

    constructor() {
        this.processTelemetry = this._processTelemetry.bind(this);
    }
    public pause(): void {
        this.isPauseInvoked = true;
    }

    public resume(): void {
        this.isResumeInvoked = true;
    }

    public teardown(): void {
        this.isTearDownInvoked = true;
    }

    flush(async?: boolean, callBack?: () => void): void {
        this.isFlushInvoked = true;
        if (callBack) {
            callBack();
        }
    }

    public processTelemetry(env: ITelemetryItem) {}

    setNextPlugin(next: any) {
        // no next setup
    }

    public initialize = (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}
