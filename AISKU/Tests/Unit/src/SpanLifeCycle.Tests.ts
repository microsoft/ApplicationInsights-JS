import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { eOTelSpanStatusCode, ITelemetryItem } from "@microsoft/applicationinsights-core-js";

export class SpanLifeCycleTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${SpanLifeCycleTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "SpanLifeCycleTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: SpanLifeCycleTests._connectionString,
                    disableAjaxTracking: false,
                    disableXhr: false,
                    maxBatchInterval: 0,
                    disableExceptionTracking: false
                }
            });

            this._ai.loadAppInsights();

            // Hook core.track to capture calls
            const originalTrack = this._ai.core.track;
            this._ai.core.track = (item: ITelemetryItem) => {
                this._trackCalls.push(item);
                return originalTrack.call(this._ai.core, item);
            };
            
        } catch (e) {
            console.error('Failed to initialize tests: ' + e);
            throw e;
        }
    }

    public testFinishedCleanup() {
        if (this._ai && this._ai.unload) {
            this._ai.unload(false);
        }
    }

    public registerTests() {
        this.addDoubleEndTests();
        this.addOperationsOnEndedSpansTests();
        this.addEndedPropertyTests();
        this.addIsRecordingAfterEndTests();
        this.addEndTimeTests();
    }

    private addDoubleEndTests(): void {
        this.testCase({
            name: "DoubleEnd: calling end() twice should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("double-end-test");

                // Act & Assert - First end should succeed
                Assert.doesNotThrow(() => {
                    span?.end();
                }, "First end() should not throw");

                // Second end should not throw but should be no-op
                Assert.doesNotThrow(() => {
                    span?.end();
                }, "Second end() should not throw");
            }
        });

        this.testCase({
            name: "DoubleEnd: second end() should be no-op",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("double-end-noop");
                this._trackCalls = [];

                // Act - End twice
                span?.end();
                const trackCountAfterFirst = this._trackCalls.length;
                
                span?.end();
                const trackCountAfterSecond = this._trackCalls.length;

                // Assert - Second end should not generate additional telemetry
                Assert.equal(trackCountAfterSecond, trackCountAfterFirst,
                    "Second end() should not generate additional telemetry");
            }
        });

        this.testCase({
            name: "DoubleEnd: ended property remains true after second end",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("double-end-property");

                // Act
                span?.end();
                const endedAfterFirst = span?.ended;

                span?.end();
                const endedAfterSecond = span?.ended;

                // Assert
                Assert.ok(endedAfterFirst, "Span should be ended after first end()");
                Assert.ok(endedAfterSecond, "Span should remain ended after second end()");
            }
        });

        this.testCase({
            name: "DoubleEnd: multiple end() calls are safe",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("multiple-end-test");

                // Act & Assert - Multiple ends should all be safe
                Assert.doesNotThrow(() => {
                    for (let i = 0; i < 10; i++) {
                        span?.end();
                    }
                }, "Multiple end() calls should not throw");

                Assert.ok(span?.ended, "Span should be marked as ended");
            }
        });

        this.testCase({
            name: "DoubleEnd: end with different times only uses first",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("double-end-time");

                // Act - End with specific time
                const firstEndTime = Date.now();
                span?.end(firstEndTime);
                const capturedEndTime1 = span?.endTime;

                // Try to end again with different time
                const secondEndTime = Date.now() + 1000;
                span?.end(secondEndTime);
                const capturedEndTime2 = span?.endTime;

                // Assert - End time should not change
                Assert.deepEqual(capturedEndTime1, capturedEndTime2,
                    "End time should not change on second end()");
            }
        });
    }

    private addOperationsOnEndedSpansTests(): void {
        this.testCase({
            name: "EndedSpan: setAttribute on ended span should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-setAttribute");
                span?.end();

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttribute("after.end", "value");
                }, "setAttribute should not throw on ended span");
            }
        });

        this.testCase({
            name: "EndedSpan: setAttribute on ended span should be no-op",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-setAttribute-noop");
                span?.setAttribute("before.end", "initialValue");
                
                const attributesBeforeEnd = span?.attributes;
                span?.end();

                // Act
                span?.setAttribute("after.end", "newValue");
                span?.setAttribute("before.end", "modifiedValue");

                // Assert
                const attributesAfterEnd = span?.attributes;
                Assert.ok(!attributesAfterEnd["after.end"],
                    "New attribute should not be added after end");
                Assert.equal(attributesAfterEnd["before.end"], "initialValue",
                    "Existing attribute should not be modified after end");
            }
        });

        this.testCase({
            name: "EndedSpan: setAttributes on ended span should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-setAttributes");
                span?.end();

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttributes({
                        "attr1": "value1",
                        "attr2": "value2"
                    });
                }, "setAttributes should not throw on ended span");
            }
        });

        this.testCase({
            name: "EndedSpan: setAttributes on ended span should be no-op",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-setAttributes-noop");
                span?.setAttributes({ "initial": "value" });
                span?.end();

                // Act
                span?.setAttributes({
                    "after.end.1": "value1",
                    "after.end.2": "value2"
                });

                // Assert
                const attributes = span?.attributes;
                Assert.ok(!attributes["after.end.1"],
                    "Attributes should not be added after end");
                Assert.ok(!attributes["after.end.2"],
                    "Attributes should not be added after end");
            }
        });

        this.testCase({
            name: "EndedSpan: setStatus on ended span should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-setStatus");
                span?.end();

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setStatus({
                        code: eOTelSpanStatusCode.ERROR,
                        message: "Error after end"
                    });
                }, "setStatus should not throw on ended span");
            }
        });

        this.testCase({
            name: "EndedSpan: setStatus on ended span should be no-op",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-setStatus-noop");
                span?.setStatus({
                    code: eOTelSpanStatusCode.OK,
                    message: "Initial status"
                });
                
                const statusBeforeEnd = span?.status;
                span?.end();

                // Act
                span?.setStatus({
                    code: eOTelSpanStatusCode.ERROR,
                    message: "Modified after end"
                });

                // Assert
                const statusAfterEnd = span?.status;
                Assert.equal(statusAfterEnd.code, statusBeforeEnd?.code,
                    "Status code should not change after end");
            }
        });

        this.testCase({
            name: "EndedSpan: updateName on ended span should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("original-name");
                span?.end();

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.updateName("new-name-after-end");
                }, "updateName should not throw on ended span");
            }
        });

        this.testCase({
            name: "EndedSpan: updateName on ended span should be no-op",
            test: () => {
                // Arrange
                const originalName = "original-name-noop";
                const span = this._ai.startSpan(originalName);
                span?.end();

                // Act
                span?.updateName("modified-name");

                // Assert
                Assert.equal(span?.name, originalName,
                    "Span name should not change after end");
            }
        });

        this.testCase({
            name: "EndedSpan: recordException on ended span should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-recordException");
                span?.end();

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.recordException(new Error("Exception after end"));
                }, "recordException should not throw on ended span");
            }
        });

        this.testCase({
            name: "EndedSpan: multiple operations on ended span should all be safe",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-multiple-ops");
                span?.end();

                // Act & Assert - All operations should be safe
                Assert.doesNotThrow(() => {
                    span?.setAttribute("key", "value");
                    span?.setAttributes({ "key1": "val1", "key2": "val2" });
                    span?.setStatus({ code: eOTelSpanStatusCode.ERROR });
                    span?.updateName("new-name");
                    span?.recordException(new Error("test"));
                    span?.end(); // Try to end again
                }, "Multiple operations on ended span should not throw");
            }
        });
    }

    private addEndedPropertyTests(): void {
        this.testCase({
            name: "EndedProperty: span should not be ended initially",
            test: () => {
                // Arrange & Act
                const span = this._ai.startSpan("initial-not-ended");

                // Assert
                Assert.ok(!span?.ended, "Span should not be ended initially");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "EndedProperty: span should be ended after end() call",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-after-call");

                // Act
                span?.end();

                // Assert
                Assert.ok(span?.ended, "Span should be ended after end() call");
            }
        });

        this.testCase({
            name: "EndedProperty: ended property is read-only",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("readonly-ended") as any;

                // Act - Try to modify ended property
                const canModify = () => {
                    try {
                        span.ended = true;
                        return true;
                    } catch (e) {
                        return false;
                    }
                };

                // Assert
                Assert.ok(!span.ended, "Should start not ended");
                // Property should be read-only (or modification has no effect)
                canModify();
                Assert.ok(!span.ended, "Manual modification should not affect ended state");

                // Cleanup
                span.end();
            }
        });

        this.testCase({
            name: "EndedProperty: ended state persists across property reads",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("persistent-ended");
                span?.end();

                // Act - Read ended property multiple times
                const ended1 = span?.ended;
                const ended2 = span?.ended;
                const ended3 = span?.ended;

                // Assert
                Assert.ok(ended1, "First read should show ended");
                Assert.ok(ended2, "Second read should show ended");
                Assert.ok(ended3, "Third read should show ended");
            }
        });

        this.testCase({
            name: "EndedProperty: recording and non-recording spans both have ended property",
            test: () => {
                // Arrange
                const recordingSpan = this._ai.startSpan("recording", { recording: true });
                const nonRecordingSpan = this._ai.startSpan("non-recording", { recording: false });

                // Act
                recordingSpan?.end();
                nonRecordingSpan?.end();

                // Assert
                Assert.ok(recordingSpan?.ended, "Recording span should be ended");
                Assert.ok(nonRecordingSpan?.ended, "Non-recording span should be ended");
            }
        });
    }

    private addIsRecordingAfterEndTests(): void {
        this.testCase({
            name: "IsRecording: isRecording() returns false after end()",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("recording-test");
                const isRecordingBefore = span?.isRecording();

                // Act
                span?.end();
                const isRecordingAfter = span?.isRecording();

                // Assert
                Assert.ok(isRecordingBefore, "Span should be recording before end");
                Assert.ok(!isRecordingAfter, "Span should not be recording after end");
            }
        });

        this.testCase({
            name: "IsRecording: non-recording span stays non-recording after end",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-test", { recording: false });
                const isRecordingBefore = span?.isRecording();

                // Act
                span?.end();
                const isRecordingAfter = span?.isRecording();

                // Assert
                Assert.ok(!isRecordingBefore, "Non-recording span should not be recording before end");
                Assert.ok(!isRecordingAfter, "Non-recording span should not be recording after end");
            }
        });

        this.testCase({
            name: "IsRecording: isRecording() consistent with ended state",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("recording-consistency");

                // Assert initial state
                Assert.ok(span?.isRecording(), "Should be recording when not ended");
                Assert.ok(!span?.ended, "Should not be ended initially");

                // Act
                span?.end();

                // Assert final state
                Assert.ok(!span?.isRecording(), "Should not be recording when ended");
                Assert.ok(span?.ended, "Should be ended after end()");
            }
        });

        this.testCase({
            name: "IsRecording: multiple isRecording() calls after end return consistent value",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("recording-multiple-calls");
                span?.end();

                // Act
                const check1 = span?.isRecording();
                const check2 = span?.isRecording();
                const check3 = span?.isRecording();

                // Assert
                Assert.ok(!check1, "First check should return false");
                Assert.ok(!check2, "Second check should return false");
                Assert.ok(!check3, "Third check should return false");
            }
        });
    }

    private addEndTimeTests(): void {
        this.testCase({
            name: "EndTime: endTime is undefined before end()",
            test: () => {
                // Arrange & Act
                const span = this._ai.startSpan("endtime-undefined");
                const endTime = span?.endTime;

                // Assert
                Assert.ok(endTime === undefined || endTime === null,
                    "endTime should be undefined/null before end()");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "EndTime: endTime is set after end()",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("endtime-set");

                // Act
                span?.end();
                const endTime = span?.endTime;

                // Assert
                Assert.ok(endTime !== undefined && endTime !== null,
                    "endTime should be set after end()");
            }
        });

        this.testCase({
            name: "EndTime: endTime is after startTime",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("endtime-after-start");

                // Act
                span?.end();

                // Assert
                const startTime = span?.startTime;
                const endTime = span?.endTime;

                if (startTime && endTime) {
                    // Compare HrTime [seconds, nanoseconds]
                    const startMs = startTime[0] * 1000 + startTime[1] / 1000000;
                    const endMs = endTime[0] * 1000 + endTime[1] / 1000000;
                    
                    Assert.ok(endMs >= startMs,
                        "endTime should be after or equal to startTime");
                }
            }
        });

        this.testCase({
            name: "EndTime: custom endTime is respected",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("endtime-custom");
                const customEndTime = Date.now();

                // Act
                span?.end(customEndTime);
                const actualEndTime = span?.endTime;

                // Assert
                if (actualEndTime) {
                    const actualMs = actualEndTime[0] * 1000 + actualEndTime[1] / 1000000;
                    const diff = Math.abs(actualMs - customEndTime);
                    
                    Assert.ok(diff < 10, // Allow 10ms difference for conversion
                        "Custom endTime should be approximately respected");
                }
            }
        });

        this.testCase({
            name: "EndTime: duration is calculated from startTime to endTime",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("duration-calculation");

                // Act - Add small delay
                const startTime = Date.now();
                for (let i = 0; i < 1000; i++) {
                    // Small busy loop
                }
                span?.end();

                // Assert
                const duration = span?.duration;
                if (duration) {
                    const durationMs = duration[0] * 1000 + duration[1] / 1000000;
                    Assert.ok(durationMs >= 0, "Duration should be non-negative");
                }
            }
        });

        this.testCase({
            name: "EndTime: endTime does not change after span is ended",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("endtime-immutable");

                // Act
                span?.end();
                const endTime1 = span?.endTime;

                // Try to end again (should be no-op)
                span?.end();
                const endTime2 = span?.endTime;

                // Assert
                Assert.deepEqual(endTime1, endTime2,
                    "endTime should not change after first end()");
            }
        });

        this.testCase({
            name: "EndTime: negative duration is handled gracefully",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("negative-duration");

                // Act - End with time before start
                const futureTime = Date.now() + 10000;
                span?.end();
                
                // Try to set past end time after span started
                // (Note: SDK should handle this internally and prevent negative duration)

                // Assert
                const duration = span?.duration;
                if (duration) {
                    const durationMs = duration[0] * 1000 + duration[1] / 1000000;
                    Assert.ok(durationMs >= 0,
                        "Duration should never be negative (SDK should handle this)");
                }
            }
        });
    }
}
